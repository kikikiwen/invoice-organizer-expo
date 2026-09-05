import { useState } from "react";
import { useRouter } from "expo-router";

import { useI18n } from "../../i18n";
import { useInvoiceData } from "../invoices/useInvoiceData";

export function usePdfListScreen() {
  const strings = useI18n();
  const router = useRouter();
  const { pdfs, ready } = useInvoiceData();
  const [openingId, setOpeningId] = useState<string | null>(null);

  const openPdf = (id: string) => {
    setOpeningId(id);
    router.push({ pathname: "/pdf-preview", params: { id } });
    setOpeningId(null);
  };

  return { strings, pdfs, ready, openingId, openPdf };
}
