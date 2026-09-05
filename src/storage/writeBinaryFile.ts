import * as FileSystem from "expo-file-system/legacy";

import { bytesToBase64 } from "../utils/bytes";

export async function writeBinaryFile(
  uri: string,
  bytes: Uint8Array,
): Promise<void> {
  await FileSystem.writeAsStringAsync(uri, bytesToBase64(bytes), {
    encoding: FileSystem.EncodingType.Base64,
  });
}
