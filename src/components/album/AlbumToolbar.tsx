import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type AlbumToolbarProps = {
  historyLabel: string;
  selectLabel: string;
  cancelLabel: string;
  selectionMode: boolean;
  onToggleSelection: () => void;
};

export function AlbumToolbar({
  historyLabel,
  selectLabel,
  cancelLabel,
  selectionMode,
  onToggleSelection,
}: AlbumToolbarProps) {
  return (
    <View style={styles.container}>
      <Link href="/pdfs" asChild>
        <Pressable style={styles.sideButton}>
          <Text style={styles.buttonText}>{historyLabel}</Text>
        </Pressable>
      </Link>

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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
  },
  sideButton: {
    alignItems: "flex-start",
  },
  alignEnd: {
    alignItems: "flex-end",
  },
  buttonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },
});
