import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { I18nProvider } from "../src/i18n";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="pdfs" options={{ headerShown: true }} />
          <Stack.Screen name="pdf-preview" options={{ headerShown: true }} />
        </Stack>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
