import { PDFDocument } from "pdf-lib";

import {
  PAGE_LANDSCAPE,
  PAGE_PORTRAIT,
  PDF_PAGE_MARGIN,
} from "../constants/pdfLayout";
import { getStrings } from "../i18n/getStrings";
import { readFileBytes } from "../storage/readFileBytes";
import { writeBinaryFile } from "../storage/writeBinaryFile";
import type { InvoicePhoto } from "../types/invoice";
import { compressForPdf } from "../services/pdfImageCompression";

export async function buildInvoicePdf(
  photos: InvoicePhoto[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setCreator(getStrings().pdfCreator);

  for (const photo of photos) {
    const compressedUri = await compressForPdf(photo.uri);
    const imageBytes = await readFileBytes(compressedUri);
    const image = await pdfDoc.embedJpg(imageBytes);
    const portrait = image.height >= image.width;
    const pageSize = portrait ? PAGE_PORTRAIT : PAGE_LANDSCAPE;
    const page = pdfDoc.addPage([pageSize.width, pageSize.height]);

    const availableWidth = page.getWidth() - PDF_PAGE_MARGIN * 2;
    const availableHeight = page.getHeight() - PDF_PAGE_MARGIN * 2;
    const scale = Math.min(
      availableWidth / image.width,
      availableHeight / image.height,
    );
    const width = image.width * scale;
    const height = image.height * scale;
    const x = (page.getWidth() - width) / 2;
    const y = (page.getHeight() - height) / 2;

    page.drawImage(image, { x, y, width, height });
  }

  return pdfDoc.save();
}
