import * as FileSystem from "expo-file-system/legacy";

import { resolvePdfUriFromId } from "../utils/pdfId";
import type { InvoicePdf } from "../types/invoice";

function metadataUriForPdf(pdfUri: string): string {
  return pdfUri.replace(/\.pdf$/i, ".meta.json");
}

export async function deletePdfMetadata(pdfUri: string): Promise<void> {
  await FileSystem.deleteAsync(metadataUriForPdf(pdfUri), { idempotent: true });
}

export function pdfUriFromId(pdfId: string): string | null {
  return resolvePdfUriFromId(pdfId);
}

export function pdfNameFromId(pdfId: string): string {
  return pdfId.replace(/\.pdf$/i, "");
}

export function toInvoicePdfFromId(pdfId: string): InvoicePdf | null {
  const uri = pdfUriFromId(pdfId);
  if (!uri) {
    return null;
  }
  return {
    id: pdfId,
    uri,
    name: pdfNameFromId(pdfId),
  };
}
