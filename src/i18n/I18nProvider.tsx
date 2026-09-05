import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getStrings } from "./getStrings";
import { resolveLocale } from "./resolveLocale";
import type { AppLocale, Strings } from "./types";

type I18nContextValue = {
  strings: Strings;
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<AppLocale>(resolveLocale);

  const value = useMemo<I18nContextValue>(() => {
    const strings = getStrings(locale);
    return {
      strings,
      locale,
      setLocale,
      toggleLocale: () => setLocale(locale === "fr" ? "zh" : "fr"),
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Strings {
  const context = useContext(I18nContext);
  if (!context) {
    return getStrings();
  }
  return context.strings;
}

export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useLocale must be used within I18nProvider");
  }
  return {
    locale: context.locale,
    setLocale: context.setLocale,
    toggleLocale: context.toggleLocale,
  };
}
