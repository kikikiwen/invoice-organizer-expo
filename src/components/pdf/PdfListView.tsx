import { memo, useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import type { InvoicePdf } from "../../types/invoice";

type PdfListRowProps = {
  pdf: InvoicePdf;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
};

const PdfListRow = memo(function PdfListRow({
  pdf,
  selectionMode,
  selected,
  onToggleSelect,
  onOpen,
}: PdfListRowProps) {
  const handlePress = useCallback(() => {
    if (selectionMode) {
      onToggleSelect(pdf.id);
      return;
    }
    onOpen(pdf.id);
  }, [onOpen, onToggleSelect, pdf.id, selectionMode]);

  return (
    <Pressable style={styles.row} onPress={handlePress}>
      {selectionMode ? (
        <View style={styles.checkWrap}>
          <Ionicons
            name={selected ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={selected ? "#2563EB" : "#9CA3AF"}
          />
        </View>
      ) : null}
      <Text style={styles.rowTitle}>{pdf.name}</Text>
    </Pressable>
  );
});

type PdfListViewProps = {
  pdfs: InvoicePdf[];
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpen: (id: string) => void;
};

export function PdfListView({
  pdfs,
  selectionMode,
  selectedIds,
  onToggleSelect,
  onOpen,
}: PdfListViewProps) {
  const renderItem = useCallback(
    ({ item }: { item: InvoicePdf }) => (
      <PdfListRow
        pdf={item}
        selectionMode={selectionMode}
        selected={selectedIds.has(item.id)}
        onToggleSelect={onToggleSelect}
        onOpen={onOpen}
      />
    ),
    [onOpen, onToggleSelect, selectedIds, selectionMode],
  );

  return (
    <FlatList
      data={pdfs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[
        styles.list,
        selectionMode ? styles.listWithFooter : undefined,
      ]}
      renderItem={renderItem}
      extraData={[selectionMode, selectedIds]}
      initialNumToRender={16}
      maxToRenderPerBatch={12}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  listWithFooter: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  checkWrap: {
    marginRight: 12,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
});
