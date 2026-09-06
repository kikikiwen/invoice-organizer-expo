import { getLocales } from "expo-localization";

import type { AppLocale } from "./types";

export function resolveLocale(): AppLocale {
  const languageCode = getLocales()[0]?.languageCode ?? "fr";
  if (languageCode === "zh") {
    return "zh";
  }
  if (languageCode === "fr") {
    return "fr";
  }
  if (languageCode === "en") {
    return "en";
  }
  return "en";
}
