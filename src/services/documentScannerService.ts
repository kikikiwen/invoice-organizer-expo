import DocumentScanner, {
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin";

import { SAVE_JPEG_QUALITY } from "../constants/media";

export async function scanInvoiceDocument(): Promise<string | null> {
  const result = await DocumentScanner.scanDocument({
    maxNumDocuments: 1,
    croppedImageQuality: Math.round(SAVE_JPEG_QUALITY * 100),
  });

  if (result.status === ScanDocumentResponseStatus.Cancel) {
    return null;
  }

  return result.scannedImages?.[0] ?? null;
}
