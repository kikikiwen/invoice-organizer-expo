import { Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

import { getPrivacyPolicyUrl } from "../src/constants/legal";
import { useLocale, useI18n } from "../src/i18n";

export default function PrivacyPolicyScreen() {
  const { locale } = useLocale();
  const strings = useI18n();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: strings.privacyPolicy }} />
      <WebView
        source={{ uri: getPrivacyPolicyUrl(locale) }}
        style={styles.webview}
        startInLoadingState
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  webview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
