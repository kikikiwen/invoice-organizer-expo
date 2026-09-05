import { useCallback, useState } from "react";

import type { InvoicePhoto } from "../../types/invoice";

export function usePhotoViewer(photos: InvoicePhoto[]) {
  const [visible, setVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const openPhoto = useCallback(
    (photoId: string) => {
      const index = photos.findIndex((photo) => photo.id === photoId);
      if (index < 0) {
        return;
      }
      setInitialIndex(index);
      setVisible(true);
    },
    [photos],
  );

  const closePhoto = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    viewerVisible: visible,
    viewerInitialIndex: initialIndex,
    openPhoto,
    closePhoto,
  };
}
