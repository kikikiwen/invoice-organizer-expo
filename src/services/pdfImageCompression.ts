import { Image } from "react-native";
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
import { getFileSize } from "../storage/getFileSize";

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

function resizeActions(
  width: number,
  height: number,
  maxLongEdge: number,
): Action[] {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return [];
  }

  if (width >= height) {
    return [{ resize: { width: maxLongEdge } }];
  }

  return [{ resize: { height: maxLongEdge } }];
}

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
  let low = PDF_QUALITY_MIN;
  let high = PDF_QUALITY_MAX;

  while (high - low >= PDF_QUALITY_PRECISION) {
    const quality = (low + high) / 2;
    const encoded = await encodeJpeg(uri, actions, quality);

    if (encoded.size <= PDF_IMAGE_MAX_BYTES) {
      bestUri = encoded.uri;
      low = quality;
    } else {
      high = quality;
    }
  }

  if (bestUri) {
    return bestUri;
  }

  const fallback = await encodeJpeg(uri, actions, PDF_QUALITY_MIN);
  return fallback.uri;
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

  const fallbackActions = resizeActions(width, height, PDF_FALLBACK_LONG_EDGE);
  return compressToBudget(uri, fallbackActions);
}
