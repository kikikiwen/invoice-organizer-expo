import * as ImageManipulator from "expo-image-manipulator";
import type { Action } from "expo-image-manipulator";

import {
  PDF_FALLBACK_LONG_EDGE,
  PDF_IMAGE_MAX_BYTES,
  PDF_MAX_LONG_EDGE,
  PDF_QUALITY_MAX,
  PDF_QUALITY_MIN,
  PDF_QUALITY_PRECISION,
} from "../constants/media";
import { deleteTempFile, deleteTempFiles } from "../storage/deleteTempFile";
import { getFileSize } from "../storage/getFileSize";
import { getImageSize, resizeActions } from "../utils/imageResize";

async function encodeJpeg(
  uri: string,
  actions: Action[],
  quality: number,
): Promise<{ uri: string; size: number }> {
  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  const size = await getFileSize(result.uri);
  return { uri: result.uri, size };
}

async function compressToBudget(
  uri: string,
  actions: Action[],
): Promise<string> {
  let bestUri: string | null = null;
  const tempUris: string[] = [];
  let low = PDF_QUALITY_MIN;
  let high = PDF_QUALITY_MAX;

  while (high - low >= PDF_QUALITY_PRECISION) {
    const quality = (low + high) / 2;
    const encoded = await encodeJpeg(uri, actions, quality);
    tempUris.push(encoded.uri);

    if (encoded.size <= PDF_IMAGE_MAX_BYTES) {
      bestUri = encoded.uri;
      low = quality;
    } else {
      high = quality;
    }
  }

  const resultUri = bestUri ?? (await encodeJpeg(uri, actions, PDF_QUALITY_MIN)).uri;
  if (!bestUri) {
    tempUris.push(resultUri);
  }

  await deleteTempFiles(tempUris.filter((tempUri) => tempUri !== resultUri));
  return resultUri;
}

/**
 * Resize for PDF display, then pick the highest JPEG quality that stays ≤ 500 KB.
 */
export async function compressForPdf(uri: string): Promise<string> {
  const { width, height } = await getImageSize(uri);
  const primaryActions = resizeActions(width, height, PDF_MAX_LONG_EDGE);
  const primary = await compressToBudget(uri, primaryActions);
  const primarySize = await getFileSize(primary);

  if (primarySize <= PDF_IMAGE_MAX_BYTES) {
    return primary;
  }

  await deleteTempFile(primary);
  const fallbackActions = resizeActions(width, height, PDF_FALLBACK_LONG_EDGE);
  return compressToBudget(uri, fallbackActions);
}
