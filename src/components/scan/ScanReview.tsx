import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ScanReviewProps = {
  visible: boolean;
  uri: string | null;
  working: boolean;
  retakeLabel: string;
  usePhotoLabel: string;
  onRetake: () => void;
  onUsePhoto: () => void;
  onDismiss: () => void;
  onDismissComplete?: () => void;
};

export function ScanReview({
  visible,
  uri,
  working,
  retakeLabel,
  usePhotoLabel,
  onRetake,
  onUsePhoto,
  onDismiss,
  onDismissComplete,
}: ScanReviewProps) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const dismissHandledRef = useRef(false);

  const finishDismiss = useCallback(() => {
    if (dismissHandledRef.current) {
      return;
    }

    dismissHandledRef.current = true;
    setPreviewUri(null);
    onDismissComplete?.();
  }, [onDismissComplete]);

  useEffect(() => {
    if (visible && uri) {
      dismissHandledRef.current = false;
      setPreviewUri(uri);
      setModalVisible(true);
      return;
    }

    if (!visible) {
      setModalVisible(false);
    }
  }, [visible, uri]);

  useEffect(() => {
    if (modalVisible || !previewUri || Platform.OS === "ios") {
      return;
    }

    const timeout = setTimeout(finishDismiss, 350);
    return () => clearTimeout(timeout);
  }, [modalVisible, previewUri, finishDismiss]);

  if (!previewUri) {
    return null;
  }

  return (
    <Modal
      visible={modalVisible}
      animationType="slide"
      onRequestClose={onDismiss}
      onDismiss={finishDismiss}
    >
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.previewWrapper}>
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="contain" />
        </View>
        <View style={styles.actions}>
          <Pressable
            style={[styles.retakeButton, working && styles.buttonDisabled]}
            onPress={onRetake}
            disabled={working}
          >
            <Text style={styles.retakeButtonText}>{retakeLabel}</Text>
          </Pressable>
          <Pressable
            style={[styles.usePhotoButton, working && styles.buttonDisabled]}
            onPress={onUsePhoto}
            disabled={working}
          >
            <Text style={styles.usePhotoButtonText}>{usePhotoLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  previewWrapper: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },
  preview: {
    flex: 1,
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  retakeButton: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    paddingVertical: 14,
    alignItems: "center",
  },
  retakeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  usePhotoButton: {
    flex: 1,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  usePhotoButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
