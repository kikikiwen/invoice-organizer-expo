import { Pressable, StyleSheet, Text, View } from "react-native";

import type { AppLocale } from "../../i18n/types";

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
  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <View style={styles.row}>
        <View style={styles.sideSlot} />

        <Text style={styles.title}>{title}</Text>

        <Pressable style={styles.sideSlot} onPress={onToggleLanguage}>
          <Text style={styles.language}>
            <Text style={locale === "fr" ? styles.languageActive : undefined}>
              FR
            </Text>
            <Text style={styles.languageSeparator}>/</Text>
            <Text style={locale === "zh" ? styles.languageActive : undefined}>
              CH
            </Text>
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
    minWidth: 56,
    alignItems: "flex-end",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  language: {
    fontSize: 15,
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
