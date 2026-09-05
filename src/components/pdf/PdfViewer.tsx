import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { WebView } from "react-native-webview";

import { LoadingScreen } from "../common/LoadingScreen";

type PdfViewerProps = {
  uri: string;
};

type WebViewSource =
  | { uri: string }
  | { html: string; baseUrl: string };

function buildPdfHtml(base64: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        background: #525659;
        overflow: hidden;
      }
      embed {
        width: 100%;
        height: 100%;
        border: 0;
      }
    </style>
  </head>
  <body>
    <embed type="application/pdf" src="data:application/pdf;base64,${base64}" />
  </body>
</html>`;
}

async function loadBase64Source(uri: string): Promise<WebViewSource> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    html: buildPdfHtml(base64),
    baseUrl: "",
  };
}

export function PdfViewer({ uri }: PdfViewerProps) {
  const [source, setSource] = useState<WebViewSource | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      if (Platform.OS === "android" && !useFallback) {
        if (!cancelled) {
          setSource({ uri });
        }
        return;
      }

      const nextSource = await loadBase64Source(uri);
      if (!cancelled) {
        setSource(nextSource);
      }
    };

    setSource(null);
    void loadPdf();

    return () => {
      cancelled = true;
    };
  }, [uri, useFallback]);

  const handleWebViewError = () => {
    if (Platform.OS === "android" && !useFallback) {
      setUseFallback(true);
    }
  };

  if (!source) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <WebView
        key={useFallback ? "fallback" : "primary"}
        style={styles.webview}
        source={source}
        originWhitelist={["*"]}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        startInLoadingState
        renderLoading={() => <LoadingScreen />}
        scalesPageToFit
        onError={handleWebViewError}
        onHttpError={handleWebViewError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#525659",
  },
  webview: {
    flex: 1,
    backgroundColor: "#525659",
  },
});
