import * as ImageManipulator from "expo-image-manipulator";

import { SAVE_JPEG_QUALITY } from "../constants/media";

export async function compressForSave(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(uri, [], {
    compress: SAVE_JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}
