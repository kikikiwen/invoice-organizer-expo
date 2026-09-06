import * as FileSystem from "expo-file-system/legacy";

export async function deleteTempFile(uri: string): Promise<void> {
  const cacheDirectory = FileSystem.cacheDirectory;
  if (!cacheDirectory || !uri.startsWith(cacheDirectory)) {
    return;
  }

  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function deleteTempFiles(uris: string[]): Promise<void> {
  await Promise.all(uris.map((uri) => deleteTempFile(uri)));
}
