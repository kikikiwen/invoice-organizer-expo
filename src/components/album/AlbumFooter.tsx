import { Pressable, StyleSheet, Text, View } from "react-native";

type AlbumFooterProps = {
  scanLabel: string;
  galleryLabel: string;
  deleteLabel: string;
  previewLabel: string;
  doneLabel: string;
  generatingLabel: string;
  selectionMode: boolean;
  selectedCount: number;
  working: boolean;
  bottomInset: number;
  onScan: () => void;
  onPickFromGallery: () => void;
  onDeleteSelected: () => void;
  onPreviewPdf: () => void;
  onMakePdf: () => void;
};

export function AlbumFooter({
  scanLabel,
  galleryLabel,
  deleteLabel,
  previewLabel,
  doneLabel,
  generatingLabel,
  selectionMode,
  selectedCount,
  working,
  bottomInset,
  onScan,
  onPickFromGallery,
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
        <View style={styles.importActions}>
          <Pressable
            style={[styles.scanButton, working && styles.buttonDisabled]}
            onPress={onScan}
            disabled={working}
          >
            <Text style={styles.scanButtonText}>{scanLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.galleryButton, working && styles.buttonDisabled]}
            onPress={onPickFromGallery}
            disabled={working}
          >
            <Text style={styles.galleryButtonText}>{galleryLabel}</Text>
          </Pressable>
        </View>
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
  importActions: {
    flexDirection: "row",
    gap: 12,
  },
  scanButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  galleryButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  galleryButtonText: {
    color: "#2563EB",
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
