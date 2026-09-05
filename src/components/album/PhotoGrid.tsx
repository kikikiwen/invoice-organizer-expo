import { memo, useCallback, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import type { InvoicePhoto } from "../../types/invoice";

type PhotoGridCellProps = {
  photo: InvoicePhoto;
  cellSize: number;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (photoId: string) => void;
  onOpenPhoto: (photoId: string) => void;
};

const PhotoGridCell = memo(function PhotoGridCell({
  photo,
  cellSize,
  selectionMode,
  selected,
  onToggleSelect,
  onOpenPhoto,
}: PhotoGridCellProps) {
  const handlePress = useCallback(() => {
    if (selectionMode) {
      onToggleSelect(photo.id);
      return;
    }
    onOpenPhoto(photo.id);
  }, [onOpenPhoto, onToggleSelect, photo.id, selectionMode]);

  return (
    <Pressable
      style={[styles.cell, { width: cellSize, height: cellSize }]}
      onPress={handlePress}
    >
      <Image
        source={{ uri: photo.uri }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={photo.id}
        transition={0}
      />
      {selectionMode ? (
        <View style={styles.checkWrap}>
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            size={28}
            color={selected ? "#2563EB" : "#FFFFFF"}
          />
        </View>
      ) : null}
    </Pressable>
  );
});

type PhotoGridProps = {
  photos: InvoicePhoto[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (photoId: string) => void;
  onOpenPhoto: (photoId: string) => void;
};

export function PhotoGrid({
  photos,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpenPhoto,
}: PhotoGridProps) {
  const { width } = useWindowDimensions();
  const columns = useMemo(() => Math.max(3, Math.floor(width / 120)), [width]);
  const cellSize = useMemo(
    () => (width - 6 - columns * 3) / columns,
    [columns, width],
  );

  const renderItem = useCallback(
    ({ item }: { item: InvoicePhoto }) => (
      <PhotoGridCell
        photo={item}
        cellSize={cellSize}
        selectionMode={selectionMode}
        selected={selectedIds.has(item.id)}
        onToggleSelect={onToggleSelect}
        onOpenPhoto={onOpenPhoto}
      />
    ),
    [cellSize, onOpenPhoto, onToggleSelect, selectedIds, selectionMode],
  );

  return (
    <FlatList
      data={photos}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      renderItem={renderItem}
      extraData={[selectionMode, selectedIds]}
      initialNumToRender={18}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 3,
    paddingBottom: 140,
  },
  row: {
    gap: 3,
  },
  cell: {
    padding: 1.5,
  },
  image: {
    flex: 1,
    borderRadius: 4,
    backgroundColor: "#E5E7EB",
  },
  checkWrap: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 14,
  },
});
