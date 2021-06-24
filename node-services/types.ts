export interface MultiLanguagePage extends SingleLanguagePage {
  alternateLanguages: TypedObject<string>;
  defaultLang: boolean;
  paths: Path[];
  url: string;
}

export interface MultiLanguageStoreOptions {
  defaultLang: string;
}

export interface MultiToSingleLanguagePageDefinitions {
  description: string;
  label: string;
  lang: string;
  order?: string;
  title: string;
}

export interface MultiToSingleLanguagePage {
  componentName: string;
  definitions: MultiToSingleLanguagePageDefinitions[];
  langs?: string[];
  order: string;
  translations: string;
}

export interface Path {
  group?: string;
  label: string;
  order: string;
  url: string;
}

export interface SingleLanguagePage
  extends MultiToSingleLanguagePageDefinitions {
  componentName: string;
  fallbackLang?: boolean;
  group?: string;
  translations?: TranslationSource | string;
  order: string;
  [key: string]: any;
}

export interface TranslationSource {
  [key: string]: string | TranslationSource;
}

export type TypedObject<Type> = { [key: string]: Type };
