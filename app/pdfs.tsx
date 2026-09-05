import { Stack } from "expo-router";

import { EmptyState } from "../src/components/common/EmptyState";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { PdfListView } from "../src/components/pdf/PdfListView";
import { usePdfListScreen } from "../src/features/pdf/usePdfListScreen";

export default function PdfListScreen() {
  const pdfList = usePdfListScreen();

  if (!pdfList.ready) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ title: pdfList.strings.pdfListTitle }} />

      {pdfList.pdfs.length === 0 ? (
        <EmptyState
          title={pdfList.strings.emptyPdfsTitle}
          description={pdfList.strings.emptyPdfsDescription}
        />
      ) : (
        <PdfListView
          pdfs={pdfList.pdfs}
          openLabel={pdfList.strings.preview}
          openingId={pdfList.openingId}
          onOpen={pdfList.openPdf}
        />
      )}
    </>
  );
}
