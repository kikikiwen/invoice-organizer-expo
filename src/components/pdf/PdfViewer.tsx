import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { WebView } from "react-native-webview";

import { PDF_MAX_BASE64_PREVIEW_BYTES } from "../../constants/media";
import { useI18n } from "../../i18n";
import { getFileSize } from "../../storage/getFileSize";
import { EmptyState } from "../common/EmptyState";
import { LoadingScreen } from "../common/LoadingScreen";
import { measureAsync } from "../../utils/perf";

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
  const size = await getFileSize(uri);
  if (size > PDF_MAX_BASE64_PREVIEW_BYTES) {
    throw new Error("PDF too large for inline preview");
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    html: buildPdfHtml(base64),
    baseUrl: "about:blank",
  };
}

export function PdfViewer({ uri }: PdfViewerProps) {
  const strings = useI18n();
  const [source, setSource] = useState<WebViewSource | null>(null);
  const [useBase64Fallback, setUseBase64Fallback] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      try {
        if (!useBase64Fallback) {
          if (!cancelled) {
            setSource({ uri });
            setFailed(false);
          }
          return;
        }

        const nextSource = await measureAsync("pdfViewer.loadBase64", () =>
          loadBase64Source(uri),
        );
        if (!cancelled) {
          setSource(nextSource);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setSource(null);
          setFailed(true);
        }
      }
    };

    setFailed(false);
    setSource(null);
    void loadPdf();

    return () => {
      cancelled = true;
    };
  }, [uri, useBase64Fallback]);

  const handleWebViewError = () => {
    if (!useBase64Fallback) {
      setUseBase64Fallback(true);
      return;
    }

    setSource(null);
    setFailed(true);
  };

  if (failed) {
    return (
      <View style={styles.errorContainer}>
        <EmptyState
          title={strings.pdfPreviewFailed}
          description={strings.emptyPdfsDescription}
        />
      </View>
    );
  }

  if (!source) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <WebView
        key={useBase64Fallback ? "fallback" : "primary"}
        style={styles.webview}
        source={source}
        originWhitelist={["file://", "about:blank"]}
        allowFileAccess
        javaScriptEnabled={false}
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
  errorContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  webview: {
    flex: 1,
    backgroundColor: "#525659",
  },
});
