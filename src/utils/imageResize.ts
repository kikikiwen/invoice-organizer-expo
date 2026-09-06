import { Image } from "react-native";
import type { Action } from "expo-image-manipulator";

export function getImageSize(
  uri: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

export function resizeActions(
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
