import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import type { InvoicePdf } from "../../types/invoice";

type PdfListViewProps = {
  pdfs: InvoicePdf[];
  openLabel: string;
  openingId: string | null;
  onOpen: (id: string) => void;
};

export function PdfListView({
  pdfs,
  openLabel,
  openingId,
  onOpen,
}: PdfListViewProps) {
  return (
    <FlatList
      data={pdfs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => onOpen(item.id)}
          disabled={openingId === item.id}
        >
          <Text style={styles.rowTitle}>{item.name}</Text>
          {openingId === item.id ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.rowAction}>{openLabel}</Text>
          )}
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    marginRight: 12,
  },
  rowAction: {
    color: "#2563EB",
    fontWeight: "600",
  },
});
