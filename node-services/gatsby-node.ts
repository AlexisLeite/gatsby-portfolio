import { resolve } from "path";
import { GatsbyNode } from "gatsby";
import MultiLanguageStore from "./multiLanguageStore";
import { TypedObject } from "./types";
const { createFilePath } = require(`gatsby-source-filesystem`);

/**
 *
 * The multiLanguageStore will organize all the incoming singleLanguage pages in such a way that at the end of the pages creation process, it will be able to route every page to its paths and its alternate languages.
 *
 * Every page must have a default language translation as a rule.
 *
 */
const multiLanguageStore = new MultiLanguageStore({
  defaultLang: "es",
});

export const onCreateNode: GatsbyNode["onCreateNode"] = async ({
  node,
  actions,
  getNode,
}) => {
  const { createNodeField } = actions;
  if (node.internal.type === `MarkdownRemark`) {
    let parent = node.parent as string;
    let fileName = getNode(parent).base;
    createNodeField({
      node,
      name: `name`,
      value: fileName,
    });
  }
};

export const createPages: GatsbyNode["createPages"] = async ({
  actions,
  graphql,
}) => {
  const { createPage } = actions;

  const markdownFiles: {
    data?: {
      allMarkdownRemark: {
        nodes: {
          file: {
            details: { name: string; relativeDirectory: string };
          };
          description: string;
          meta: {
            label: string;
            title: string;
          };
          html: string;
          tableOfContents: string;
        }[];
      };
    };
  } = await graphql(`
    {
      allMarkdownRemark {
        nodes {
          file: fields {
            details: name {
              name
              relativeDirectory
            }
          }
          description: excerpt
          meta: frontmatter {
            label
            title
          }
          html
          tableOfContents
        }
      }
    }
  `);

  if (markdownFiles.data?.allMarkdownRemark.nodes) {
    for (let file of markdownFiles.data?.allMarkdownRemark.nodes) {
      let matchLang = file.file.details.name.match(/^(.*?)(?:\.(\w{2}))?$/);
      if (!matchLang) continue;
      let fileName = matchLang[1];
      let lang = matchLang[2] ?? multiLanguageStore.defaultLang;
      let order =
        fileName === "index"
          ? file.file.details.relativeDirectory
          : `${file.file.details.relativeDirectory}/${fileName}`;

      multiLanguageStore.addPage({
        componentName: resolve(__dirname, "../src/components/showPage.tsx"),
        content: file.html,
        description: file.description,
        group: order.indexOf("/") === -1 ? "applications" : undefined,
        label: file.meta.label,
        lang,
        order,
        relativeDirectory: file.file.details.relativeDirectory,
        title: file.meta.title,
        toc: file.tableOfContents,
        translations: "content",
      });
    }
  }
  /* 
  multiLanguageStore.addPage({
    componentName: resolve(__dirname, "../src/components/home.tsx"),
    description: "La descripción de la página",
    label: "Inicio",
    lang: "es",
    order: "home",
    title: "Esta página está buenísima",
    translations: "home",
  });

  multiLanguageStore.addPage({
    componentName: resolve(__dirname, "../src/components/home.tsx"),
    description: "The description",
    label: "Home",
    lang: "en",
    order: "home",
    title: "This page is great",
    translations: "home",
  });

  multiLanguageStore.addMultilanguage({
    componentName: resolve(__dirname, "../src/components/about.tsx"),
    definitions: [
      {
        description: "Sobre mi",
        label: "Sobre mi",
        lang: "es",
        title: "Sobre mi",
      },
    ],
    order: "sobre",
    translations: "about",
  }); */

  let everyPath = multiLanguageStore.build();

  let homeContext = {};
  for (let page of everyPath) {
    // Get context for home route
    if (page.order === "home" && page.lang === "es") homeContext = page;

    let path = page.url;
    createPage({
      path,
      context: page,
      component: page.componentName,
    });
  }
  /* 
  createPage({
    path: "/",
    component: resolve(__dirname, "../src/components/home.tsx"),
    context: homeContext,
  }); */
};
