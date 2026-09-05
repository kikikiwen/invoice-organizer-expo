import { useState } from "react";
import { Alert } from "react-native";

import { useI18n } from "../../i18n";
import { sharePdfFile } from "../../services/shareService";
import { useInvoiceData } from "../invoices/useInvoiceData";

export function usePdfListScreen() {
  const strings = useI18n();
  const { pdfs, ready } = useInvoiceData();
  const [sharingId, setSharingId] = useState<string | null>(null);

  const sharePdf = async (uri: string, id: string) => {
    setSharingId(id);
    try {
      await sharePdfFile(uri, strings);
    } catch (error) {
      Alert.alert(
        strings.errorTitle,
        error instanceof Error ? error.message : strings.shareFailed,
      );
    } finally {
      setSharingId(null);
    }
  };

  return { strings, pdfs, ready, sharingId, sharePdf };
}
