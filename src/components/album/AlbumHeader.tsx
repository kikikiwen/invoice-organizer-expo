import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AppLocale } from "../../i18n/types";

const LOCALE_LABELS: Record<AppLocale, string> = {
  fr: "FR",
  en: "EN",
  zh: "CH",
};

type AlbumHeaderProps = {
  title: string;
  topInset: number;
  locale: AppLocale;
  onToggleLanguage: () => void;
};

export function AlbumHeader({
  title,
  topInset,
  locale,
  onToggleLanguage,
}: AlbumHeaderProps) {
  const locales: AppLocale[] = ["fr", "en", "zh"];

  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <View style={styles.row}>
        <View style={styles.sideSlot} />

        <Text style={styles.title}>{title}</Text>

        <Pressable style={styles.sideSlot} onPress={onToggleLanguage}>
          <Text style={styles.language}>
            {locales.map((code, index) => (
              <Text key={code}>
                {index > 0 ? (
                  <Text style={styles.languageSeparator}>/</Text>
                ) : null}
                <Text style={locale === code ? styles.languageActive : undefined}>
                  {LOCALE_LABELS[code]}
                </Text>
              </Text>
            ))}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  sideSlot: {
    minWidth: 72,
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "700",
    color: "#111827",
  },
  language: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  languageActive: {
    color: "#2563EB",
  },
  languageSeparator: {
    color: "#9CA3AF",
  },
});
