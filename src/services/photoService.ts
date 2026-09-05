import * as FileSystem from "expo-file-system/legacy";

import { PHOTO_EXTENSIONS } from "../constants/media";
import { listDirectoryFiles } from "../storage/listDirectoryFiles";
import { ensurePhotosDir, photosDir } from "../storage/paths";
import type { InvoicePhoto } from "../types/invoice";
import { photoFileName } from "../utils/fileNames";
import { compressForSave } from "./imageCompression";

function toInvoicePhoto(uri: string): InvoicePhoto {
  const name = uri.split("/").pop() ?? uri;
  return { id: name, uri, name };
}

export async function listPhotos(): Promise<InvoicePhoto[]> {
  await ensurePhotosDir();
  const uris = await listDirectoryFiles(photosDir(), PHOTO_EXTENSIONS);
  return uris.map(toInvoicePhoto);
}

export async function savePhoto(captureUri: string): Promise<void> {
  const compressedUri = await compressForSave(captureUri);
  const destination = `${photosDir()}${photoFileName()}`;
  await FileSystem.copyAsync({ from: compressedUri, to: destination });
}

export async function deletePhotos(photos: InvoicePhoto[]): Promise<void> {
  await Promise.all(
    photos.map((photo) =>
      FileSystem.deleteAsync(photo.uri, { idempotent: true }),
    ),
  );
}
