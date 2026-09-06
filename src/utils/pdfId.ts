import * as FileSystem from "expo-file-system/legacy";

import { pdfDir } from "../storage/paths";

/** Matches app-generated PDF names: prefix_yyyyMMdd_HHmmss.pdf */
const PDF_ID_PATTERN = /^[A-Za-z0-9_\u4e00-\u9fff-]+\.pdf$/;

export function isValidPdfId(pdfId: string): boolean {
  if (!PDF_ID_PATTERN.test(pdfId) || pdfId.includes("..")) {
    return false;
  }

  const basename = pdfId.split(/[/\\]/).pop();
  return basename === pdfId;
}

export function resolvePdfUriFromId(pdfId: string): string | null {
  if (!isValidPdfId(pdfId)) {
    return null;
  }

  const uri = `${pdfDir()}${pdfId}`;
  const dir = pdfDir();
  if (!uri.startsWith(dir)) {
    return null;
  }

  return uri;
}

export async function pdfFileExists(uri: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(uri);
  return info.exists && !info.isDirectory;
}
