import { useCallback, useEffect, useState } from "react";

import { listPdfs } from "../../services/pdfService";
import { listPhotos } from "../../services/photoService";
import { ensureStorageDirs } from "../../storage/paths";
import { measureAsync } from "../../utils/perf";
import type { InvoicePdf, InvoicePhoto } from "../../types/invoice";

export function useInvoiceData() {
  const [photos, setPhotos] = useState<InvoicePhoto[]>([]);
  const [pdfs, setPdfs] = useState<InvoicePdf[]>([]);
  const [ready, setReady] = useState(false);

  const refreshPhotos = useCallback(async () => {
    const nextPhotos = await measureAsync("refreshPhotos", listPhotos);
    setPhotos(nextPhotos);
  }, []);

  const refreshPdfs = useCallback(async () => {
    const nextPdfs = await measureAsync("refreshPdfs", listPdfs);
    setPdfs(nextPdfs);
  }, []);

  const refresh = useCallback(async () => {
    await ensureStorageDirs();
    const [nextPhotos, nextPdfs] = await Promise.all([
      measureAsync("refreshPhotos", listPhotos),
      measureAsync("refreshPdfs", listPdfs),
    ]);
    setPhotos(nextPhotos);
    setPdfs(nextPdfs);
  }, []);

  useEffect(() => {
    let active = true;
    void (async () => {
      await refresh();
      if (active) {
        setReady(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  return { photos, pdfs, ready, refresh, refreshPhotos, refreshPdfs };
}
