import {
  MultiLanguagePage,
  MultiLanguageStoreOptions,
  MultiToSingleLanguagePage,
  MultiToSingleLanguagePageDefinitions,
  Path,
  SingleLanguagePage,
  TypedObject,
} from "./types";
import {
  buildTranslation,
  languages,
  saveUntranslated,
  translate,
} from "./translate";

export default class MultiLanguageStore {
  private defaultLangStore: TypedObject<SingleLanguagePage> = {};
  private store: TypedObject<TypedObject<SingleLanguagePage>> = {};

  defaultLang: string;

  constructor(options: MultiLanguageStoreOptions) {
    this.defaultLang = options.defaultLang;
  }

  public addMultilanguage(pageDefinition: MultiToSingleLanguagePage) {
    if (!pageDefinition.langs) pageDefinition.langs = Object.keys(languages);
    let defaultLanguagePage;
    for (let definition of pageDefinition.definitions) {
      let page: SingleLanguagePage = {
        componentName: pageDefinition.componentName,
        order: pageDefinition.order,
        translations: buildTranslation(
          pageDefinition.translations,
          definition.lang
        ),
        ...definition,
      };
      pageDefinition.langs = pageDefinition.langs.filter(
        lang => lang !== definition.lang
      );
      if (definition.lang === this.defaultLang) defaultLanguagePage = page;
      this.addPage(page);
    }

    if (defaultLanguagePage) {
      for (let remainingLang of pageDefinition.langs) {
        let page = { ...defaultLanguagePage };
        page.lang = remainingLang;
        page.fallbackLang = true;
        let props: (keyof MultiToSingleLanguagePageDefinitions)[] = [
          "label",
          "title",
          "description",
          "order",
        ];
        props.forEach(prop => {
          page[prop] = translate(page[prop], remainingLang);
        });
        this.addPage(page);
      }
    }
  }

  public addPage(page: SingleLanguagePage): void {
    if (page.lang === this.defaultLang) {
      this.defaultLangStore[page.order] = page;
    } else {
      if (!(page.lang in this.store)) {
        this.store[page.lang] = {};
      }
      this.store[page.lang][page.order] = page;
    }
  }

  public build(): MultiLanguagePage[] {
    let availableLanguages = Object.keys(this.store);
    let paths: MultiLanguagePage[][] = [];
    // Search for each path in the store
    for (let path in this.defaultLangStore) {
      let singleLanguagePages = {
        [this.defaultLang]: this.defaultLangStore[path],
      };
      for (let lang in this.store) {
        if (path in this.store[lang]) {
          singleLanguagePages[lang] = this.store[lang][path];
        }
      }
      for (let lang of availableLanguages) {
        if (!(lang in singleLanguagePages)) {
          singleLanguagePages[lang] = {
            ...singleLanguagePages[this.defaultLang],
          };
          Object.assign(singleLanguagePages[lang], {
            label: translate(singleLanguagePages[lang].label, lang),
            lang,
            fallbackLang: true,
          });
        }
      }
      let pathMultiLangPages: MultiLanguagePage[] = [];
      for (let page in singleLanguagePages) {
        // If there is no translations set, then the translations will be an empty object
        if (!("translations" in singleLanguagePages[page]))
          singleLanguagePages[page].translations = {};

        // If the translates are set as a string, the translation set with that name will be loaded instead
        let translationsName = singleLanguagePages[page].translations;
        if (typeof translationsName === "string") {
          singleLanguagePages[page].translations = buildTranslation(
            translationsName,
            singleLanguagePages[page].lang
          );
        }

        let alternateLanguages: TypedObject<string> = {};
        let isDefaultLang = singleLanguagePages[page].lang === this.defaultLang;
        let url = `/${singleLanguagePages[page].order}`;
        if (!isDefaultLang) url = `/${singleLanguagePages[page].lang}${url}`;
        pathMultiLangPages.push({
          ...singleLanguagePages[page],
          alternateLanguages,
          defaultLang: isDefaultLang,
          paths: [],
          url: translate(url, singleLanguagePages[page].lang),
        });
      }
      paths.push(pathMultiLangPages);
    }

    // Once all paths were found, create all the language specific pages
    paths.map(path => {
      path.map(specificLangPath => {
        let searchLang = specificLangPath.lang;
        let currentPath = specificLangPath.order;

        let currentPathPaths: Path[] = [];
        let alternateLanguages: TypedObject<string> = {};
        let relatives: Path[] = [];
        paths.forEach(comparePath => {
          comparePath.forEach(specificLanguageComparePath => {
            if (specificLanguageComparePath.lang === searchLang) {
              currentPathPaths.push({
                group: specificLanguageComparePath.group,
                order: specificLanguageComparePath.order,
                label: specificLanguageComparePath.label,
                url: specificLanguageComparePath.url,
              });
            }

            if (
              specificLanguageComparePath.lang !== searchLang &&
              specificLanguageComparePath.order === currentPath
            ) {
              alternateLanguages[specificLanguageComparePath.lang] =
                specificLanguageComparePath.url;
            }

            if (
              specificLangPath.relativeDirectory &&
              specificLanguageComparePath.lang === searchLang &&
              specificLangPath.relativeDirectory ===
                specificLanguageComparePath.relativeDirectory &&
              specificLangPath.order !== specificLanguageComparePath.order
            )
              relatives.push({
                order: specificLanguageComparePath.order,
                label: specificLanguageComparePath.label,
                url: specificLanguageComparePath.url,
              });
          });
        });

        specificLangPath.paths = currentPathPaths;
        specificLangPath.alternateLanguages = alternateLanguages;
        specificLangPath.relatives = relatives;

        return specificLangPath;
      });
    });

    saveUntranslated();

    return paths.reduce((acc, act) => {
      acc.push(...act);
      return acc;
    }, []);
  }
}
