import * as ImageManipulator from "expo-image-manipulator";

import { PDF_MAX_LONG_EDGE, SAVE_JPEG_QUALITY } from "../constants/media";
import { getImageSize, resizeActions } from "../utils/imageResize";

export async function compressForSave(uri: string): Promise<string> {
  const { width, height } = await getImageSize(uri);
  const actions = resizeActions(width, height, PDF_MAX_LONG_EDGE);
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: SAVE_JPEG_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return result.uri;
}
