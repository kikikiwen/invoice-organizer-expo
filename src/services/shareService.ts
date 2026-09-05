import { Alert } from "react-native";
import * as Sharing from "expo-sharing";

import type { Strings } from "../i18n/types";

const PDF_SHARE_OPTIONS = {
  mimeType: "application/pdf",
  UTI: "com.adobe.pdf",
} as const;

export async function sharePdfFile(
  uri: string,
  strings: Strings,
): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, PDF_SHARE_OPTIONS);
    return;
  }

  Alert.alert(strings.shareUnavailable, uri);
}

export async function sharePdfOrNotifyGenerated(
  uri: string,
  strings: Strings,
): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, PDF_SHARE_OPTIONS);
    return;
  }

  Alert.alert(strings.pdfGenerated, uri);
}
