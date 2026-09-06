import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../i18n";
import { scanInvoiceDocument } from "../../services/documentScannerService";
import { pickPhotosFromGallery } from "../../services/galleryService";
import { createPdfFromPhotos } from "../../services/pdfService";
import { deletePhotos, savePhoto } from "../../services/photoService";
import { sharePdfOrNotifyGenerated } from "../../services/shareService";
import { useInvoiceData } from "../invoices/useInvoiceData";
import { usePhotoSelection } from "../selection/usePhotoSelection";
import { usePhotoViewer } from "../viewer/usePhotoViewer";

export function useAlbumScreen() {
  const strings = useI18n();
  const router = useRouter();
  const { photos, ready, refresh } = useInvoiceData();
  const selection = usePhotoSelection(photos);
  const viewer = usePhotoViewer(photos);
  const [pendingScanUri, setPendingScanUri] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const runDocumentScan = async () => {
    if (working) {
      return;
    }

    setWorking(true);
    try {
      const uri = await scanInvoiceDocument();
      if (uri) {
        setPendingScanUri(uri);
      }
    } catch {
      Alert.alert(strings.errorTitle, strings.scanFailed);
    } finally {
      setWorking(false);
    }
  };

  const handleScan = () => {
    void runDocumentScan();
  };

  const handlePickFromGallery = async () => {
    if (working) {
      return;
    }

    setWorking(true);
    try {
      const uris = await pickPhotosFromGallery();
      if (uris === null) {
        Alert.alert(
          strings.galleryPermissionTitle,
          strings.galleryPermissionMessage,
        );
        return;
      }
      if (uris.length === 0) {
        return;
      }

      let savedCount = 0;
      for (const uri of uris) {
        try {
          await savePhoto(uri);
          savedCount += 1;
        } catch {
          // Continue importing remaining photos.
        }
      }

      if (savedCount > 0) {
        await refresh();
      }

      if (savedCount === 0) {
        Alert.alert(strings.errorTitle, strings.savePhotoFailed);
      } else if (savedCount < uris.length) {
        Alert.alert(
          strings.errorTitle,
          strings.galleryImportPartial(savedCount, uris.length),
        );
      }
    } catch {
      Alert.alert(strings.errorTitle, strings.savePhotoFailed);
    } finally {
      setWorking(false);
    }
  };

  const handleDismissScanReview = () => {
    if (working) {
      return;
    }
    setPendingScanUri(null);
  };

  const handleRetake = () => {
    if (working) {
      return;
    }
    setPendingScanUri(null);
    void runDocumentScan();
  };

  const handleUsePhoto = async () => {
    if (!pendingScanUri || working) {
      return;
    }

    setWorking(true);
    try {
      await savePhoto(pendingScanUri);
      setPendingScanUri(null);
      await refresh();
    } catch {
      Alert.alert(strings.errorTitle, strings.savePhotoFailed);
    } finally {
      setWorking(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (selection.selectedPhotos.length === 0) {
      Alert.alert(strings.errorTitle, strings.selectAtLeastOnePhoto);
      return;
    }

    setWorking(true);
    try {
      const pdfUri = await createPdfFromPhotos(selection.selectedPhotos);
      await refresh();
      const pdfId = pdfUri.split("/").pop();
      if (pdfId) {
        router.push({ pathname: "/pdf-preview", params: { id: pdfId } });
      }
    } catch {
      Alert.alert(strings.errorTitle, strings.pdfGenerateFailed);
    } finally {
      setWorking(false);
    }
  };

  const handleMakePdf = async () => {
    if (selection.selectedPhotos.length === 0) {
      Alert.alert(strings.errorTitle, strings.selectAtLeastOnePhoto);
      return;
    }

    setWorking(true);
    try {
      const pdfUri = await createPdfFromPhotos(selection.selectedPhotos);
      selection.clearSelection();
      await refresh();
      await sharePdfOrNotifyGenerated(pdfUri, strings);
    } catch {
      Alert.alert(strings.errorTitle, strings.pdfGenerateFailed);
    } finally {
      setWorking(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selection.selectedPhotos.length === 0) {
      return;
    }

    const count = selection.selectedPhotos.length;
    Alert.alert(
      strings.confirmDeleteTitle,
      strings.confirmDeleteMessage(count),
      [
        { text: strings.cancel, style: "cancel" },
        {
          text: strings.confirm,
          style: "destructive",
          onPress: async () => {
            setWorking(true);
            try {
              await deletePhotos(selection.selectedPhotos);
              selection.clearSelection();
              await refresh();
            } catch {
              Alert.alert(strings.errorTitle, strings.deletePhotoFailed);
            } finally {
              setWorking(false);
            }
          },
        },
      ],
    );
  };

  return {
    strings,
    photos,
    ready,
    working,
    pendingScanUri,
    handleScan,
    handlePickFromGallery,
    handleDismissScanReview,
    handleRetake,
    handleUsePhoto,
    handlePreviewPdf,
    handleMakePdf,
    handleDeleteSelected,
    ...selection,
    ...viewer,
  };
}
