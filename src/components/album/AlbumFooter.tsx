import { Pressable, StyleSheet, Text, View } from "react-native";

type AlbumFooterProps = {
  photoLabel: string;
  deleteLabel: string;
  previewLabel: string;
  doneLabel: string;
  generatingLabel: string;
  selectionMode: boolean;
  selectedCount: number;
  working: boolean;
  bottomInset: number;
  onOpenCamera: () => void;
  onDeleteSelected: () => void;
  onPreviewPdf: () => void;
  onMakePdf: () => void;
};

export function AlbumFooter({
  photoLabel,
  deleteLabel,
  previewLabel,
  doneLabel,
  generatingLabel,
  selectionMode,
  selectedCount,
  working,
  bottomInset,
  onOpenCamera,
  onDeleteSelected,
  onPreviewPdf,
  onMakePdf,
}: AlbumFooterProps) {
  return (
    <View style={[styles.container, { paddingBottom: bottomInset + 12 }]}>
      {selectionMode ? (
        <View style={styles.actions}>
          <Pressable
            style={[
              styles.deleteButton,
              (selectedCount === 0 || working) && styles.buttonDisabled,
            ]}
            onPress={onDeleteSelected}
            disabled={selectedCount === 0 || working}
          >
            <Text style={styles.deleteButtonText}>{deleteLabel}</Text>
          </Pressable>
          <Pressable
            style={[
              styles.previewButton,
              (selectedCount === 0 || working) && styles.buttonDisabled,
            ]}
            onPress={onPreviewPdf}
            disabled={selectedCount === 0 || working}
          >
            <Text style={styles.previewButtonText}>
              {working ? generatingLabel : previewLabel}
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.doneButton,
              (selectedCount === 0 || working) && styles.buttonDisabled,
            ]}
            onPress={onMakePdf}
            disabled={selectedCount === 0 || working}
          >
            <Text style={styles.doneButtonText}>
              {working ? generatingLabel : doneLabel}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          style={[styles.photoButton, working && styles.buttonDisabled]}
          onPress={onOpenCamera}
          disabled={working}
        >
          <Text style={styles.photoButtonText}>{photoLabel}</Text>
        </Pressable>
      )}
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
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  photoButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  photoButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#DC2626",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  previewButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  previewButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  doneButton: {
    flex: 1,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  doneButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
