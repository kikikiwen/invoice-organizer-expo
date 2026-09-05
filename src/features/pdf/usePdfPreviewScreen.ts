import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../i18n";
import { pdfUriFromId, ensureCompressedPdf } from "../../services/pdfMetadataService";
import { getFileSize } from "../../storage/getFileSize";
import { sharePdfOrNotifyGenerated } from "../../services/shareService";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function usePdfPreviewScreen(pdfId: string | undefined) {
  const strings = useI18n();
  const router = useRouter();
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [fileSizeLabel, setFileSizeLabel] = useState("");
  const [ready, setReady] = useState(false);
  const [sharing, setSharing] = useState(false);

  const loadPdf = useCallback(async () => {
    if (!pdfId) {
      setReady(true);
      return;
    }

    try {
      const uri = pdfUriFromId(pdfId);
      const compressedUri = await ensureCompressedPdf(uri);
      const size = await getFileSize(compressedUri);
      setPdfUri(compressedUri);
      setPdfName(pdfId.replace(/\.pdf$/i, ""));
      setFileSizeLabel(formatFileSize(size));
    } catch (error) {
      Alert.alert(
        strings.errorTitle,
        error instanceof Error ? error.message : strings.pdfGenerateFailed,
      );
    } finally {
      setReady(true);
    }
  }, [pdfId, strings]);

  const sharePdf = async () => {
    if (!pdfUri) {
      return;
    }

    setSharing(true);
    try {
      await sharePdfOrNotifyGenerated(pdfUri, strings);
    } catch (error) {
      Alert.alert(
        strings.errorTitle,
        error instanceof Error ? error.message : strings.shareFailed,
      );
    } finally {
      setSharing(false);
    }
  };

  const closePreview = () => {
    router.back();
  };

  return {
    strings,
    pdfUri,
    pdfName,
    fileSizeLabel,
    ready,
    sharing,
    loadPdf,
    sharePdf,
    closePreview,
  };
}
