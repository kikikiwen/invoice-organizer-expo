import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AlbumToolbarProps = {
  pdfLabel: string;
  languageLabel: string;
  selectLabel: string;
  cancelLabel: string;
  selectionMode: boolean;
  onToggleLanguage: () => void;
  onToggleSelection: () => void;
};

export function AlbumToolbar({
  pdfLabel,
  languageLabel,
  selectLabel,
  cancelLabel,
  selectionMode,
  onToggleLanguage,
  onToggleSelection,
}: AlbumToolbarProps) {
  return (
    <View style={styles.container}>
      <Link href="/pdfs" asChild>
        <Pressable style={styles.sideButton}>
          <Text style={styles.buttonText}>{pdfLabel}</Text>
        </Pressable>
      </Link>

      <Pressable style={styles.centerButton} onPress={onToggleLanguage}>
        <Text style={styles.buttonText}>{languageLabel}</Text>
      </Pressable>

      <Pressable
        style={[styles.sideButton, styles.alignEnd]}
        onPress={onToggleSelection}
      >
        <Text style={styles.buttonText}>
          {selectionMode ? cancelLabel : selectLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  sideButton: {
    flex: 1,
    alignItems: "flex-start",
  },
  alignEnd: {
    alignItems: "flex-end",
  },
  centerButton: {
    flex: 1,
    alignItems: "center",
  },
  buttonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },
});
