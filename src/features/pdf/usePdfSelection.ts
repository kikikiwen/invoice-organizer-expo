import { useMemo, useState } from "react";

import type { InvoicePdf } from "../../types/invoice";

export function usePdfSelection(pdfs: InvoicePdf[]) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectedPdfs = useMemo(
    () => pdfs.filter((pdf) => selectedIds.has(pdf.id)),
    [pdfs, selectedIds],
  );

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current);
    setSelectedIds(new Set());
  };

  const toggleSelect = (pdfId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(pdfId)) {
        next.delete(pdfId);
      } else {
        next.add(pdfId);
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
    selectedPdfs,
    toggleSelectionMode,
    toggleSelect,
    clearSelection,
  };
}
