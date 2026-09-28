import { useState } from "react";
import { Alert } from "react-native";
import { useRouter } from "expo-router";

import { useI18n } from "../../i18n";
import { scanInvoiceDocuments } from "../../services/documentScannerService";
import { pickPhotosFromGallery } from "../../services/galleryService";
import { createPdfFromPhotos } from "../../services/pdfService";
import { deletePhotos, savePhoto } from "../../services/photoService";
import { sharePdfOrNotifyGenerated } from "../../services/shareService";
import { useEntitlement } from "../billing/EntitlementProvider";
import { useInvoiceData } from "../invoices/useInvoiceData";
import { usePhotoSelection } from "../selection/usePhotoSelection";
import { usePhotoViewer } from "../viewer/usePhotoViewer";

export function useAlbumScreen() {
  const strings = useI18n();
  const router = useRouter();
  const {
    photos,
    photosReady,
    loadError,
    refreshPhotos,
    refreshPdfs,
    retryPhotosLoad,
  } = useInvoiceData();
  const selection = usePhotoSelection(photos);
  const viewer = usePhotoViewer(photos);
  const entitlement = useEntitlement();
  const [working, setWorking] = useState(false);

  const saveScannedPhotos = async (uris: string[]) => {
    const { saved, blocked } = await entitlement.saveWithinAllowance(
      uris,
      savePhoto,
    );

    if (saved > 0) {
      await refreshPhotos();
    }

    if (saved === 0) {
      Alert.alert(
        strings.errorTitle,
        blocked ? strings.quotaBlocked : strings.savePhotoFailed,
      );
    } else if (saved < uris.length) {
      Alert.alert(
        strings.errorTitle,
        strings.galleryImportPartial(saved, uris.length),
      );
    }
  };

  const captureAndSave = async (uris: string[]) => {
    if (uris.length === 0) {
      return;
    }

    const allowed = await entitlement.requestSave(uris.length);
    if (!allowed) {
      Alert.alert(strings.errorTitle, strings.quotaBlocked);
      return;
    }

    await saveScannedPhotos(uris);
  };

  const runDocumentScan = async () => {
    if (working) {
      return;
    }

    setWorking(true);
    try {
      const canCapture = await entitlement.canStartCapture();
      if (!canCapture) {
        entitlement.openPaywall();
        return;
      }

      const uris = await scanInvoiceDocuments();
      await captureAndSave(uris);
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
      const canCapture = await entitlement.canStartCapture();
      if (!canCapture) {
        entitlement.openPaywall();
        return;
      }

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

      await captureAndSave(uris);
    } catch {
      Alert.alert(strings.errorTitle, strings.savePhotoFailed);
    } finally {
      setWorking(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (working) {
      return;
    }

    if (selection.selectedPhotos.length === 0) {
      Alert.alert(strings.errorTitle, strings.selectAtLeastOnePhoto);
      return;
    }

    setWorking(true);
    try {
      const pdfUri = await createPdfFromPhotos(selection.selectedPhotos);
      await refreshPdfs();
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
    if (working) {
      return;
    }

    if (selection.selectedPhotos.length === 0) {
      Alert.alert(strings.errorTitle, strings.selectAtLeastOnePhoto);
      return;
    }

    setWorking(true);
    try {
      const pdfUri = await createPdfFromPhotos(selection.selectedPhotos);
      selection.clearSelection();
      await refreshPdfs();
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
              await refreshPhotos();
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

  const handleRetryLoad = () => {
    void retryPhotosLoad();
  };

  return {
    strings,
    photos,
    ready: photosReady,
    loadError,
    working,
    handleRetryLoad,
    handleScan,
    handlePickFromGallery,
    handlePreviewPdf,
    handleMakePdf,
    handleDeleteSelected,
    ...selection,
    ...viewer,
  };
}
