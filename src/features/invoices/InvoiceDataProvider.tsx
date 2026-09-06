import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { listPdfs } from "../../services/pdfService";
import { listPhotos } from "../../services/photoService";
import { ensureStorageDirs } from "../../storage/paths";
import { measureAsync } from "../../utils/perf";
import type { InvoicePdf, InvoicePhoto } from "../../types/invoice";

type InvoiceDataContextValue = {
  photos: InvoicePhoto[];
  pdfs: InvoicePdf[];
  photosReady: boolean;
  pdfsReady: boolean;
  loadError: boolean;
  refresh: () => Promise<void>;
  refreshPhotos: () => Promise<void>;
  refreshPdfs: () => Promise<void>;
  retryPhotosLoad: () => Promise<void>;
};

const InvoiceDataContext = createContext<InvoiceDataContextValue | null>(null);

export function InvoiceDataProvider({ children }: { children: ReactNode }) {
  const [photos, setPhotos] = useState<InvoicePhoto[]>([]);
  const [pdfs, setPdfs] = useState<InvoicePdf[]>([]);
  const [photosReady, setPhotosReady] = useState(false);
  const [pdfsReady, setPdfsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const refreshPhotos = useCallback(async () => {
    const nextPhotos = await measureAsync("refreshPhotos", listPhotos);
    setPhotos(nextPhotos);
  }, []);

  const refreshPdfs = useCallback(async () => {
    const nextPdfs = await measureAsync("refreshPdfs", listPdfs);
    setPdfs(nextPdfs);
    setPdfsReady(true);
  }, []);

  const refresh = useCallback(async () => {
    setLoadError(false);
    try {
      await ensureStorageDirs();
      const [nextPhotos, nextPdfs] = await Promise.all([
        measureAsync("refreshPhotos", listPhotos),
        measureAsync("refreshPdfs", listPdfs),
      ]);
      setPhotos(nextPhotos);
      setPdfs(nextPdfs);
      setPdfsReady(true);
    } catch {
      setLoadError(true);
      throw new Error("Failed to load invoice data");
    }
  }, []);

  const retryPhotosLoad = useCallback(async () => {
    setLoadError(false);
    try {
      await ensureStorageDirs();
      await refreshPhotos();
    } catch {
      setLoadError(true);
    }
  }, [refreshPhotos]);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await ensureStorageDirs();
        await refreshPhotos();
      } catch {
        if (active) {
          setLoadError(true);
        }
      } finally {
        if (active) {
          setPhotosReady(true);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [refreshPhotos]);

  const value = useMemo(
    () => ({
      photos,
      pdfs,
      photosReady,
      pdfsReady,
      loadError,
      refresh,
      refreshPhotos,
      refreshPdfs,
      retryPhotosLoad,
    }),
    [
      photos,
      pdfs,
      photosReady,
      pdfsReady,
      loadError,
      refresh,
      refreshPhotos,
      refreshPdfs,
      retryPhotosLoad,
    ],
  );

  return (
    <InvoiceDataContext.Provider value={value}>
      {children}
    </InvoiceDataContext.Provider>
  );
}

export function useInvoiceData(): InvoiceDataContextValue {
  const context = useContext(InvoiceDataContext);
  if (!context) {
    throw new Error("useInvoiceData must be used within InvoiceDataProvider");
  }
  return context;
}
