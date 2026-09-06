import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { markAppLaunched } from "../src/constants/splash";
import { I18nProvider } from "../src/i18n";

markAppLaunched();
SplashScreen.preventAutoHideAsync();

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <I18nProvider>
        <StatusBar style="dark" />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="pdfs" options={{ headerShown: true }} />
          <Stack.Screen name="pdf-preview" options={{ headerShown: true }} />
          <Stack.Screen name="privacy-policy" options={{ headerShown: true }} />
        </Stack>
      </I18nProvider>
    </GestureHandlerRootView>
  );
}
