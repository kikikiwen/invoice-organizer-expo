import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlbumFooter } from "../src/components/album/AlbumFooter";
import { AlbumHeader } from "../src/components/album/AlbumHeader";
import { AlbumToolbar } from "../src/components/album/AlbumToolbar";
import { PhotoGrid } from "../src/components/album/PhotoGrid";
import { EmptyState } from "../src/components/common/EmptyState";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { PhotoViewer } from "../src/components/viewer/PhotoViewer";
import { useAlbumScreen } from "../src/features/album/useAlbumScreen";
import { useLocale } from "../src/i18n";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { locale, toggleLocale } = useLocale();
  const album = useAlbumScreen();

  if (!album.ready) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <AlbumHeader
        title={album.strings.albumTitle}
        topInset={insets.top}
        locale={locale}
        onToggleLanguage={toggleLocale}
      />

      <AlbumToolbar
        historyLabel={album.strings.history}
        selectLabel={album.strings.select}
        cancelLabel={album.strings.cancel}
        selectionMode={album.selectionMode}
        onToggleSelection={album.toggleSelectionMode}
      />

      {album.photos.length === 0 ? (
        <EmptyState
          title={album.strings.emptyPhotosTitle}
          description={album.strings.emptyPhotosDescription}
        />
      ) : (
        <PhotoGrid
          photos={album.photos}
          selectionMode={album.selectionMode}
          selectedIds={album.selectedIds}
          onToggleSelect={album.toggleSelect}
          onOpenPhoto={album.openPhoto}
        />
      )}

      <AlbumFooter
        scanLabel={album.strings.scan}
        galleryLabel={album.strings.gallery}
        deleteLabel={album.strings.delete}
        previewLabel={album.strings.preview}
        doneLabel={album.strings.done(album.selectedCount)}
        generatingLabel={album.strings.generating}
        privacyPolicyLabel={album.strings.privacyPolicy}
        selectionMode={album.selectionMode}
        selectedCount={album.selectedCount}
        working={album.working}
        bottomInset={insets.bottom}
        onScan={album.handleScan}
        onPickFromGallery={album.handlePickFromGallery}
        onDeleteSelected={album.handleDeleteSelected}
        onPreviewPdf={album.handlePreviewPdf}
        onMakePdf={album.handleMakePdf}
      />

      <PhotoViewer
        photos={album.photos}
        initialIndex={album.viewerInitialIndex}
        visible={album.viewerVisible}
        onClose={album.closePhoto}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
