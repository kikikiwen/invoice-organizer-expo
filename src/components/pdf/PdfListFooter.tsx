import { Pressable, StyleSheet, Text, View } from "react-native";

type PdfListFooterProps = {
  deleteLabel: string;
  selectedCount: number;
  working: boolean;
  bottomInset: number;
  onDeleteSelected: () => void;
};

export function PdfListFooter({
  deleteLabel,
  selectedCount,
  working,
  bottomInset,
  onDeleteSelected,
}: PdfListFooterProps) {
  return (
    <View style={[styles.container, { paddingBottom: bottomInset + 12 }]}>
      <Pressable
        style={[
          styles.deleteButton,
          (selectedCount === 0 || working) && styles.buttonDisabled,
        ]}
        onPress={onDeleteSelected}
        disabled={selectedCount === 0 || working}
      >
        <Text style={styles.deleteButtonText}>
          {selectedCount > 0 ? `${deleteLabel}（${selectedCount}）` : deleteLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  deleteButton: {
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
