import { TranslationSource, TypedObject } from "./types";
import { translate as clientSideTranslate } from "./../src/services/translate";
import en from "../src/languages/en.json";
import es from "../src/languages/es.json";
import fs from "fs";

export const languages: TypedObject<TranslationSource> = { en, es };
var untranslatedPhrases: TypedObject<TranslationSource> = {};
const untranslatedFileName: string = __dirname + "/untranslated.json";
var openedUntranslatedFile = false;

function loadUntranslated(): void {
  if (!fs.existsSync(untranslatedFileName))
    fs.writeFileSync(untranslatedFileName, JSON.stringify({}));
  untranslatedPhrases = JSON.parse(
    fs.readFileSync(untranslatedFileName).toString()
  );
  openedUntranslatedFile = true;
}

export function translate(
  phrase: string,
  source: string | TranslationSource,
  autosave?: boolean
): string {
  if (!openedUntranslatedFile) loadUntranslated();
  let lang: string = "not-specified";

  if (!source) {
    throw new Error("Translate must have a language or a source determined");
  }

  if (typeof source === "string") {
    lang = source;
    source = languages[source];
  }

  // The incoming phrase can be a word, if it's a word the translate function must difference between a first uppercase, a entire lowercase and a entire uppercase and return the same format
  let returnPhrase = clientSideTranslate(phrase, source);
  if (returnPhrase === phrase) {
    pushUntranslated(phrase, lang);
    if (autosave) saveUntranslated();
  }
  return returnPhrase;
}

function pushUntranslated(phrase: string, lang: string): void {
  if (!(lang in untranslatedPhrases)) untranslatedPhrases[lang] = {};
  untranslatedPhrases[lang][phrase] = "";
}

export function buildTranslation(
  source: string,
  lang: string
): TranslationSource {
  if (typeof source === "string" && typeof lang === "string") {
    if (lang in languages) {
      if ("translatorSections" in languages[lang]) {
        let sections = languages[lang].translatorSections as TranslationSource;
        let languageWithoutSections = { ...languages[lang] };
        delete languageWithoutSections["translatorSections"];
        let translation = {
          ...(sections[source] as TranslationSource),
          ...languageWithoutSections,
        };
        if (!translation)
          throw new Error(
            `The requested translation "${source}" is not defined in "${lang}"`
          );
        return translation;
      } else
        throw new Error(
          `The provided language has no sections defined: ${lang}`
        );
    } else throw new Error(`The selected language is undefined: ${lang}`);
  } else
    throw new Error(
      "The provided arguments are incorrect, impossible to create the translation package"
    );
}

export function saveUntranslated() {
  fs.writeFileSync(untranslatedFileName, JSON.stringify(untranslatedPhrases));
}
