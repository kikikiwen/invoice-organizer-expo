import { Pressable, StyleSheet, Text, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "../src/components/common/EmptyState";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { PdfListFooter } from "../src/components/pdf/PdfListFooter";
import { PdfListView } from "../src/components/pdf/PdfListView";
import { usePdfListScreen } from "../src/features/pdf/usePdfListScreen";

export default function PdfListScreen() {
  const insets = useSafeAreaInsets();
  const pdfList = usePdfListScreen();

  if (!pdfList.ready) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: pdfList.strings.pdfListTitle,
          headerRight: () => (
            <Pressable
              style={styles.headerButton}
              onPress={pdfList.toggleSelectionMode}
            >
              <Text style={styles.headerButtonText}>
                {pdfList.selectionMode
                  ? pdfList.strings.cancel
                  : pdfList.strings.select}
              </Text>
            </Pressable>
          ),
        }}
      />

      {pdfList.pdfs.length === 0 ? (
        <EmptyState
          title={pdfList.strings.emptyPdfsTitle}
          description={pdfList.strings.emptyPdfsDescription}
        />
      ) : (
        <PdfListView
          pdfs={pdfList.pdfs}
          selectionMode={pdfList.selectionMode}
          selectedIds={pdfList.selectedIds}
          onToggleSelect={pdfList.toggleSelect}
          onOpen={pdfList.openPdf}
        />
      )}

      {pdfList.selectionMode ? (
        <PdfListFooter
          deleteLabel={pdfList.strings.delete}
          selectedCount={pdfList.selectedCount}
          working={pdfList.working}
          bottomInset={insets.bottom}
          onDeleteSelected={pdfList.handleDeleteSelected}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButtonText: {
    color: "#2563EB",
    fontSize: 16,
    fontWeight: "600",
  },
});
