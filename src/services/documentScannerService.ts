import DocumentScanner, {
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin";

import { GALLERY_IMPORT_LIMIT, SAVE_JPEG_QUALITY } from "../constants/media";

export async function scanInvoiceDocuments(): Promise<string[]> {
  const result = await DocumentScanner.scanDocument({
    maxNumDocuments: GALLERY_IMPORT_LIMIT,
    croppedImageQuality: Math.round(SAVE_JPEG_QUALITY * 100),
  });

  if (result.status === ScanDocumentResponseStatus.Cancel) {
    return [];
  }

  return result.scannedImages ?? [];
}
