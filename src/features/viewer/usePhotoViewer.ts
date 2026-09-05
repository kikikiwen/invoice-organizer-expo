import { useCallback, useMemo, useState } from "react";

import type { InvoicePhoto } from "../../types/invoice";

export function usePhotoViewer(photos: InvoicePhoto[]) {
  const [visible, setVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const photoIndexById = useMemo(
    () => new Map(photos.map((photo, index) => [photo.id, index])),
    [photos],
  );

  const openPhoto = useCallback(
    (photoId: string) => {
      const index = photoIndexById.get(photoId);
      if (index === undefined) {
        return;
      }
      setInitialIndex(index);
      setVisible(true);
    },
    [photoIndexById],
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
