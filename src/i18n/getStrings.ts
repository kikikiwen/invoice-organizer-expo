import { en } from "./locales/en";
import { fr } from "./locales/fr";
import { zh } from "./locales/zh";
import { resolveLocale } from "./resolveLocale";
import type { AppLocale, Strings } from "./types";

const translations: Record<AppLocale, Strings> = { fr, en, zh };

const LOCALE_CYCLE: AppLocale[] = ["fr", "en", "zh"];

export function getNextLocale(locale: AppLocale): AppLocale {
  const index = LOCALE_CYCLE.indexOf(locale);
  return LOCALE_CYCLE[(index + 1) % LOCALE_CYCLE.length];
}

export function getStrings(locale: AppLocale = resolveLocale()): Strings {
  return translations[locale];
}
