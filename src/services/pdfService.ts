import { PDF_EXTENSIONS } from "../constants/media";
import { getStrings } from "../i18n/getStrings";
import { buildInvoicePdf } from "../pdf/buildInvoicePdf";
import { listDirectoryFiles } from "../storage/listDirectoryFiles";
import { ensurePdfDir, pdfDir } from "../storage/paths";
import { writeBinaryFile } from "../storage/writeBinaryFile";
import type { InvoicePdf, InvoicePhoto } from "../types/invoice";
import { pdfFileName } from "../utils/fileNames";
import { savePdfMetadata } from "./pdfMetadataService";

function toInvoicePdf(uri: string): InvoicePdf {
  const name = uri.split("/").pop() ?? uri;
  return { id: name, uri, name: name.replace(/\.pdf$/i, "") };
}

export async function listPdfs(): Promise<InvoicePdf[]> {
  await ensurePdfDir();
  const uris = await listDirectoryFiles(pdfDir(), PDF_EXTENSIONS);
  return uris.map(toInvoicePdf);
}

export async function createPdfFromPhotos(
  selectedPhotos: InvoicePhoto[],
): Promise<string> {
  if (selectedPhotos.length === 0) {
    throw new Error(getStrings().selectAtLeastOnePhoto);
  }

  const ordered = [...selectedPhotos].reverse();
  const pdfBytes = await buildInvoicePdf(ordered);
  const destination = `${pdfDir()}${pdfFileName()}`;
  await writeBinaryFile(destination, pdfBytes);
  await savePdfMetadata(
    destination,
    ordered.map((photo) => photo.id),
  );
  return destination;
}
