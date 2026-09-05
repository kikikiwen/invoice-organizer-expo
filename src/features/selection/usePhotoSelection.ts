import { useMemo, useState } from "react";

import type { InvoicePhoto } from "../../types/invoice";

export function usePhotoSelection(photos: InvoicePhoto[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedPhotos = useMemo(
    () => photos.filter((photo) => selectedIds.has(photo.id)),
    [photos, selectedIds],
  );

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current);
    setSelectedIds(new Set());
  };

  const toggleSelect = (photoId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  return {
    selectionMode,
    selectedIds,
    selectedCount: selectedIds.size,
    selectedPhotos,
    toggleSelectionMode,
    toggleSelect,
    clearSelection,
  };
}
