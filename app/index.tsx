import { StyleSheet, View } from "react-native";
import { Stack } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlbumFooter } from "../src/components/album/AlbumFooter";
import { AlbumHeader } from "../src/components/album/AlbumHeader";
import { AlbumToolbar } from "../src/components/album/AlbumToolbar";
import { PhotoGrid } from "../src/components/album/PhotoGrid";
import { CameraCaptureModal } from "../src/components/camera/CameraCaptureModal";
import { PhotoCaptureReview } from "../src/components/camera/PhotoCaptureReview";
import { EmptyState } from "../src/components/common/EmptyState";
import { LoadingScreen } from "../src/components/common/LoadingScreen";
import { PhotoViewer } from "../src/components/viewer/PhotoViewer";
import { useAlbumScreen } from "../src/features/album/useAlbumScreen";
import { useLocale } from "../src/i18n";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { languageButtonLabel, toggleLocale } = useLocale();
  const album = useAlbumScreen();

  if (!album.ready) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <AlbumHeader title={album.strings.albumTitle} topInset={insets.top} />

      <AlbumToolbar
        pdfLabel="PDF"
        languageLabel={languageButtonLabel}
        selectLabel={album.strings.select}
        cancelLabel={album.strings.cancel}
        selectionMode={album.selectionMode}
        onToggleLanguage={toggleLocale}
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
        photoLabel={album.strings.photo}
        deleteLabel={album.strings.delete}
        previewLabel={album.strings.preview}
        doneLabel={album.strings.done(album.selectedCount)}
        generatingLabel={album.strings.generating}
        selectionMode={album.selectionMode}
        selectedCount={album.selectedCount}
        working={album.working}
        bottomInset={insets.bottom}
        onOpenCamera={album.handleOpenCamera}
        onDeleteSelected={album.handleDeleteSelected}
        onPreviewPdf={album.handlePreviewPdf}
        onMakePdf={album.handleMakePdf}
      />

      <CameraCaptureModal
        visible={album.showCamera}
        onClose={() => album.setShowCamera(false)}
        onCapture={album.handleCaptured}
      />

      <PhotoCaptureReview
        visible={album.pendingCaptureUri !== null}
        uri={album.pendingCaptureUri}
        retakeLabel={album.strings.retake}
        usePhotoLabel={album.strings.usePhoto}
        onRetake={album.handleRetake}
        onUsePhoto={album.handleUsePhoto}
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
