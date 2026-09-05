import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../i18n";
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
  const [showCamera, setShowCamera] = useState(false);
  const [pendingCaptureUri, setPendingCaptureUri] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const handleOpenCamera = () => {
    if (working) {
      return;
    }
    setShowCamera(true);
  };

  const handleCaptured = (uri: string) => {
    setShowCamera(false);
    setPendingCaptureUri(uri);
  };

  const handleRetake = () => {
    setPendingCaptureUri(null);
    setShowCamera(true);
  };

  const handleUsePhoto = async () => {
    if (!pendingCaptureUri) {
      return;
    }

    setWorking(true);
    try {
      await savePhoto(pendingCaptureUri);
      setPendingCaptureUri(null);
      await refresh();
    } catch (error) {
      Alert.alert(
        strings.errorTitle,
        error instanceof Error ? error.message : strings.savePhotoFailed,
      );
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
    } catch (error) {
      Alert.alert(
        strings.errorTitle,
        error instanceof Error ? error.message : strings.pdfGenerateFailed,
      );
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
    } catch (error) {
      Alert.alert(
        strings.errorTitle,
        error instanceof Error ? error.message : strings.pdfGenerateFailed,
      );
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
            } catch (error) {
              Alert.alert(
                strings.errorTitle,
                error instanceof Error ? error.message : strings.savePhotoFailed,
              );
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
    showCamera,
    pendingCaptureUri,
    setShowCamera,
    handleOpenCamera,
    handleCaptured,
    handleRetake,
    handleUsePhoto,
    handlePreviewPdf,
    handleMakePdf,
    handleDeleteSelected,
    ...selection,
    ...viewer,
  };
}
