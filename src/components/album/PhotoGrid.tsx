import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";

import type { InvoicePhoto } from "../../types/invoice";

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
  const columns = Math.max(3, Math.floor(width / 120));
  const cellSize = (width - 6 - columns * 3) / columns;

  return (
    <FlatList
      data={photos}
      key={columns}
      numColumns={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={columns > 1 ? styles.row : undefined}
      renderItem={({ item }) => {
        const selected = selectedIds.has(item.id);
        return (
          <Pressable
            style={[styles.cell, { width: cellSize, height: cellSize }]}
            onPress={() => {
              if (selectionMode) {
                onToggleSelect(item.id);
                return;
              }
              onOpenPhoto(item.id);
            }}
          >
            <Image source={{ uri: item.uri }} style={styles.image} />
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
      }}
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
