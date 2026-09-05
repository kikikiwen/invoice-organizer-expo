import { fr } from "./locales/fr";
import { zh } from "./locales/zh";
import { resolveLocale } from "./resolveLocale";
import type { AppLocale, Strings } from "./types";

const translations: Record<AppLocale, Strings> = { fr, zh };

export function getStrings(locale: AppLocale = resolveLocale()): Strings {
  return translations[locale];
}
