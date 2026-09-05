import * as FileSystem from "expo-file-system/legacy";

export async function getFileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || typeof info.size !== "number") {
    return 0;
  }
  return info.size;
}
