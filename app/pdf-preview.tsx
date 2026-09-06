import { useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "../src/components/common/EmptyState";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { PdfViewer } from "../src/components/pdf/PdfViewer";
import { usePdfPreviewScreen } from "../src/features/pdf/usePdfPreviewScreen";

export default function PdfPreviewScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const pdfId = typeof id === "string" ? id : id?.[0];
  const insets = useSafeAreaInsets();
  const preview = usePdfPreviewScreen(pdfId);

  useEffect(() => {
    void preview.loadPdf();
  }, [preview.loadPdf]);

  if (!preview.ready) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ title: preview.strings.pdfPreviewTitle }} />

      {!preview.pdfUri ? (
        <EmptyState
          title={preview.notFound ? preview.strings.pdfNotFound : preview.strings.pdfGenerateFailed}
          description={preview.strings.emptyPdfsDescription}
        />
      ) : (
        <View style={styles.container}>
          <PdfViewer uri={preview.pdfUri} />

          <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable
              style={[styles.shareButton, preview.sharing && styles.buttonDisabled]}
              onPress={() => void preview.sharePdf()}
              disabled={preview.sharing}
            >
              {preview.sharing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.shareButtonText}>{preview.strings.share}</Text>
              )}
            </Pressable>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  shareButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  shareButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
