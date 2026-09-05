import { useCallback, useEffect, useState } from "react";

import { listPdfs } from "../../services/pdfService";
import { listPhotos } from "../../services/photoService";
import { ensureStorageDirs } from "../../storage/paths";
import type { InvoicePdf, InvoicePhoto } from "../../types/invoice";

export function useInvoiceData() {
  const [photos, setPhotos] = useState<InvoicePhoto[]>([]);
  const [pdfs, setPdfs] = useState<InvoicePdf[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    await ensureStorageDirs();
    const [nextPhotos, nextPdfs] = await Promise.all([listPhotos(), listPdfs()]);
    setPhotos(nextPhotos);
    setPdfs(nextPdfs);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      await refresh();
      if (active) {
        setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [refresh]);

  return { photos, pdfs, ready, refresh };
}
