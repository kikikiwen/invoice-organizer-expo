import { useCallback, useState } from "react";
import { Alert } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { useI18n } from "../../i18n";
import { deletePdfs } from "../../services/pdfService";
import { useInvoiceData } from "../invoices/useInvoiceData";
import { usePdfSelection } from "./usePdfSelection";

export function usePdfListScreen() {
  const strings = useI18n();
  const router = useRouter();
  const { pdfs, ready, refreshPdfs } = useInvoiceData();
  const selection = usePdfSelection(pdfs);
  const [working, setWorking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void refreshPdfs();
    }, [refreshPdfs]),
  );

  const openPdf = (id: string) => {
    if (selection.selectionMode) {
      selection.toggleSelect(id);
      return;
    }

    router.push({ pathname: "/pdf-preview", params: { id } });
  };

  const handleDeleteSelected = () => {
    if (selection.selectedPdfs.length === 0) {
      return;
    }

    const count = selection.selectedPdfs.length;
    Alert.alert(
      strings.confirmDeleteTitle,
      strings.confirmDeletePdfMessage(count),
      [
        { text: strings.cancel, style: "cancel" },
        {
          text: strings.confirm,
          style: "destructive",
          onPress: async () => {
            setWorking(true);
            try {
              await deletePdfs(selection.selectedPdfs);
              selection.clearSelection();
              await refreshPdfs();
            } catch (error) {
              Alert.alert(
                strings.errorTitle,
                error instanceof Error ? error.message : strings.pdfGenerateFailed,
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
    pdfs,
    ready,
    working,
    openPdf,
    handleDeleteSelected,
    ...selection,
  };
}
