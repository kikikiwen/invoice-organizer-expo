import * as ImagePicker from "expo-image-picker";

import { GALLERY_IMPORT_LIMIT } from "../constants/media";

export async function pickPhotosFromGallery(): Promise<string[] | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: true,
    selectionLimit: GALLERY_IMPORT_LIMIT,
    quality: 1,
  });

  if (result.canceled) {
    return [];
  }

  return result.assets.map((asset) => asset.uri);
}
