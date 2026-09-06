import { PDFDocument } from "pdf-lib";

import {
  PAGE_LANDSCAPE,
  PAGE_PORTRAIT,
  PDF_PAGE_MARGIN,
} from "../constants/pdfLayout";
import { PDF_COMPRESSION_CONCURRENCY } from "../constants/media";
import { getStrings } from "../i18n/getStrings";
import { readFileBytes } from "../storage/readFileBytes";
import { deleteTempFile } from "../storage/deleteTempFile";
import type { InvoicePhoto } from "../types/invoice";
import { compressForPdf } from "../services/pdfImageCompression";
import { mapWithConcurrency } from "../utils/mapWithConcurrency";

export async function buildInvoicePdf(
  photos: InvoicePhoto[],
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setCreator(getStrings().pdfCreator);

  const preparedImages = await mapWithConcurrency(
    photos,
    PDF_COMPRESSION_CONCURRENCY,
    async (photo) => {
      const compressedUri = await compressForPdf(photo.uri);
      try {
        return await readFileBytes(compressedUri);
      } finally {
        await deleteTempFile(compressedUri);
      }
    },
  );

  for (const imageBytes of preparedImages) {
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
