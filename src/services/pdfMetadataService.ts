import * as FileSystem from "expo-file-system/legacy";

import { buildInvoicePdf } from "../pdf/buildInvoicePdf";
import { writeBinaryFile } from "../storage/writeBinaryFile";
import type { InvoicePdf, InvoicePhoto } from "../types/invoice";
import { listPhotos } from "./photoService";

type PdfMetadata = {
  photoIds: string[];
};

function metadataUriForPdf(pdfUri: string): string {
  return pdfUri.replace(/\.pdf$/i, ".meta.json");
}

export async function savePdfMetadata(
  pdfUri: string,
  photoIds: string[],
): Promise<void> {
  await FileSystem.writeAsStringAsync(
    metadataUriForPdf(pdfUri),
    JSON.stringify({ photoIds } satisfies PdfMetadata),
  );
}

async function readPdfMetadata(pdfUri: string): Promise<PdfMetadata | null> {
  const metaUri = metadataUriForPdf(pdfUri);
  const info = await FileSystem.getInfoAsync(metaUri);
  if (!info.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(metaUri);
  return JSON.parse(raw) as PdfMetadata;
}

function resolvePhotosByIds(
  photoIds: string[],
  allPhotos: InvoicePhoto[],
): InvoicePhoto[] {
  const byId = new Map(allPhotos.map((photo) => [photo.id, photo]));
  return photoIds
    .map((id) => byId.get(id))
    .filter((photo): photo is InvoicePhoto => photo !== undefined);
}

/** Rebuild PDF with current compression settings when source photos still exist. */
export async function recreateCompressedPdf(pdfUri: string): Promise<string> {
  const metadata = await readPdfMetadata(pdfUri);
  if (!metadata || metadata.photoIds.length === 0) {
    return pdfUri;
  }

  const sourcePhotos = resolvePhotosByIds(metadata.photoIds, await listPhotos());
  if (sourcePhotos.length === 0) {
    return pdfUri;
  }

  const pdfBytes = await buildInvoicePdf(sourcePhotos);
  await writeBinaryFile(pdfUri, pdfBytes);

  return pdfUri;
}

export function pdfUriFromId(pdfId: string): string {
  return `${FileSystem.documentDirectory}pdfs/${pdfId}`;
}

export function pdfNameFromId(pdfId: string): string {
  return pdfId.replace(/\.pdf$/i, "");
}

export function toInvoicePdfFromId(pdfId: string): InvoicePdf {
  const uri = pdfUriFromId(pdfId);
  return {
    id: pdfId,
    uri,
    name: pdfNameFromId(pdfId),
  };
}
