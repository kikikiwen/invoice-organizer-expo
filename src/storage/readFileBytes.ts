import * as FileSystem from "expo-file-system/legacy";

import { base64ToBytes } from "../utils/bytes";

export async function readFileBytes(uri: string): Promise<Uint8Array> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64ToBytes(base64);
}
