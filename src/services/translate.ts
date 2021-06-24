import { ucFirst } from "./common";
import { TranslationSource, TypedObject } from "../../node-services/types";

export var currentSource: TranslationSource | null = null;

export function setTranslationsSource(source: TranslationSource): void {
  currentSource = source;
}

export function translate(phrase: string, source?: TranslationSource): string {
  let noSourceError = new Error(
    "The source of translation has not been defined. Please use setSource before translate"
  );
  if (currentSource === null) {
    if (!source) {
      throw noSourceError;
    }
  }
  if (!source) {
    if (currentSource === null) {
      throw noSourceError;
    }
    source = currentSource;
  }
  // The incoming phrase can be a word, if it's a word the translate function must difference between a first uppercase, a entire lowercase and a entire uppercase and return the same format
  let returnPhrase;
  let lowerCasePhrase = phrase.toLowerCase();

  if (lowerCasePhrase in source) {
    returnPhrase = source[lowerCasePhrase];
    if (typeof returnPhrase === "string") {
      if (phrase.match(/^[ ÁÉÍÓÚA-Z_\.-]+$/)) {
        return returnPhrase.toUpperCase();
      }
      if (phrase.match(/^[ áéíóúa-z_\.-]+$/)) {
        return returnPhrase.toLowerCase();
      } else return ucFirst(returnPhrase);
    } else return phrase;
  } else if (phrase.indexOf("/") !== -1) {
    return phrase
      .split("/")
      .map(slug => translate(slug, source))
      .join("/");
  } else if (phrase !== "") {
    if (phrase.match(/[ \/_-]/)) {
      // If it's a phrase and it doesn't exist in the translate file, it will be translated word by word
      return phrase.replace(/[a-zA-ZáéíóúÁÉÍÓÚ]+/g, word =>
        translate(word, source)
      );
    }
  }
  return phrase;
}
