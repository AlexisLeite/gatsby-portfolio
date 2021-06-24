const {
  translate,
  saveUntranslated,
  buildTranslation,
} = require("./node-services/translate");

const path = require("path");
const en = require("./src/languages/en.json");
const es = require("./src/languages/es.json");

const defaultLanguage = "es";
const translates = { en, es };
const availableLanguages = Object.keys(translates);

// It stores in the following format:
/**
 * files{
 *   relativePath{
 *     fileName{
 *       language {
 *         relativePath,
 *         rawFileName (with extension),
 *         absolutePath,
 *         fileName (without extension)
 *       }
 *     }
 *   }
 * }
 * */
var pagesStore = new (function () {
  this.files = {};
  this.add = (absolutePath, relativePath, rawFileName) => {
    let result = rawFileName.match(/(.*?)(?:\.(\w{2}))?\.mdx?/);
    let fileName = result[1];
    let language = result[2] ?? defaultLanguage;

    if (!(relativePath in this.files)) this.files[relativePath] = {};
    if (!(fileName in this.files[relativePath]))
      this.files[relativePath][fileName] = {};

    this.files[relativePath][fileName][language] = {
      relativePath,
      rawFileName,
      absolutePath,
      fileName,
    };
  };
})();

exports.onCreateNode = async ({ node, actions, createNodeId }) => {
  if (node.internal.type === "MarkdownRemark") {
    let { fileAbsolutePath } = node;
    fileAbsolutePath = fileAbsolutePath.split("/");
    let fileName = fileAbsolutePath.pop();
    fileAbsolutePath = fileAbsolutePath.join("/");
    let fileRelativePath = fileAbsolutePath.match(
      /.*\/portfolio\/src\/documents\/(.*)/
    )[1];
    pagesStore.add(fileAbsolutePath, fileRelativePath, fileName);
  }
};

async function loadRemarkDetails(remarkFileName, graphql) {
  let markdownDetails = await graphql(`{
      markdownRemark(
        fileAbsolutePath: {eq: "${remarkFileName}"}
      ) {
        meta: frontmatter {
          title
          label
        }
        description: excerpt
        html
      }
    }
  `);
  markdownDetails = markdownDetails.data.markdownRemark;
  return markdownDetails;
}

exports.createPages = async ({ graphql, actions }) => {
  let languages = availableLanguages.filter(lang => lang !== defaultLanguage);
  let pages = [];
  let paths = {};
  for (let relativePath in pagesStore.files) {
    for (let fileName in pagesStore.files[relativePath]) {
      // First load the default laguage details
      let fileDefinitions = pagesStore.files[relativePath][fileName];
      let fileDetails = fileDefinitions[defaultLanguage];
      let markdownDetails = await loadRemarkDetails(
        `${fileDetails.absolutePath}/${fileDetails.rawFileName}`,
        graphql
      );
      let path =
        fileName !== "index" ? `${relativePath}/${fileName}` : relativePath;

      let defaultPage = {
        path,
        context: {
          alternateLanguages: {},
          defaultLang: true,
          description: markdownDetails.description,
          html: markdownDetails.html,
          label: markdownDetails.meta.label,
          lang: defaultLanguage,
          title: markdownDetails.meta.title,
        },
      };
      if (!(defaultLanguage in paths)) paths[defaultLanguage] = [];
      paths[defaultLanguage].push({
        label: defaultPage.context.label,
        CurrentPath: defaultPage.path,
        url: defaultPage.path,
      });

      let fileNamePages = [defaultPage];

      for (let lang of languages) {
        let translatedPath =
          lang +
          "/" +
          path
            .split("/")
            .map(slug => translate(slug, lang))
            .join("/");

        let translatePage = {
          path: translatedPath,
          context: {
            lang,
            defaultLanguage: false,
            alternateLanguages: {},
          },
        };

        if (lang in fileDefinitions) {
          let fileDetails = fileDefinitions[lang];
          let markdownDetails = await loadRemarkDetails(
            `${fileDetails.absolutePath}/${fileDetails.rawFileName}`,
            graphql
          );
          translatePage.context = Object.assign(translatePage.context, {
            description: markdownDetails.description,
            html: markdownDetails.html,
            label: markdownDetails.meta.label,
            title: markdownDetails.meta.title,
          });
        } else {
          translatePage.context = Object.assign(translatePage.context, {
            description: defaultPage.context.description,
            fallbackLanguage: true,
            html: defaultPage.context.html,
            label: translate(defaultPage.context.label, lang),
            title: translate(defaultPage.context.title, lang),
          });
        }

        fileNamePages.push(translatePage);

        if (!(lang in paths)) paths[lang] = [];
        paths[lang].push({
          label: translatePage.context.label,
          url: translatePage.path,
          CurrentPath: translatePage.path.substr(3),
        });
      }

      fileNamePages = fileNamePages.map(page => {
        [...fileNamePages]
          .filter(filterPage => filterPage.context.lang !== page.context.lang)
          .forEach(filteredPage => {
            page.context.alternateLanguages[filteredPage.context.lang] =
              filteredPage.path;
          });

        page.context.translation = buildTranslation(
          "content",
          page.context.lang
        );
        page.context.paths = paths[page.context.lang];
        return page;
      });

      pages = pages.concat(fileNamePages);
    }
  }
  saveUntranslated();

  const { createPage } = actions;
  pages.forEach(page => {
    createPage({
      path: page.path,
      context: page.context,
      component: path.resolve("./src/components/showPage.tsx"),
    });
  });

  /**
   * The constantPages will be passed to a function which will create the different languages pages for each one.
   *
   * The properties that must be passed are:
   *  - component
   *
   * The optional properties are:
   *  - translation: the name of the set of translations that will be passed to the component
   *  - context: an object containing additional context properties
   *
   * */
  let constantPages = {
    about: {
      component: path.resolve("./src/components/about.tsx"),
    },
    home: {
      component: path.resolve(".src/components/home.tsx"),
    },
  };

  /**
   * 
    context: {
      alternateLanguages: {[key:langName}: path},
      defaultLang: boolean,
      description?: string,
      label: markdownDetails.meta.label,
      lang: defaultLanguage,
      title: markdownDetails.meta.title,
    }
   */
  function createMultilanguagePages(page) {
    let pages = {};
    for (let language of availableLanguages) {
    }
  }

  for (let page in constantPages) {
    createMultilanguagePages(page);
  }
};

exports.createResolvers = ({ createResolvers }) => {};
