import * as FileSystem from "expo-file-system/legacy";

export const PHOTOS_FOLDER = "photos";
export const PDF_FOLDER = "pdfs";

export function photosDir(): string {
  return `${FileSystem.documentDirectory}${PHOTOS_FOLDER}/`;
}

export function pdfDir(): string {
  return `${FileSystem.documentDirectory}${PDF_FOLDER}/`;
}

export async function ensurePhotosDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(photosDir(), { intermediates: true });
}

export async function ensurePdfDir(): Promise<void> {
  await FileSystem.makeDirectoryAsync(pdfDir(), { intermediates: true });
}

export async function ensureStorageDirs(): Promise<void> {
  await Promise.all([ensurePhotosDir(), ensurePdfDir()]);
}
