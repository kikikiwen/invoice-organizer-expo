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
  shareLabel: string;
  sharingId: string | null;
  onShare: (uri: string, id: string) => void;
};

export function PdfListView({
  pdfs,
  shareLabel,
  sharingId,
  onShare,
}: PdfListViewProps) {
  return (
    <FlatList
      data={pdfs}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.row}
          onPress={() => onShare(item.uri, item.id)}
          disabled={sharingId === item.id}
        >
          <Text style={styles.rowTitle}>{item.name}</Text>
          {sharingId === item.id ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.rowAction}>{shareLabel}</Text>
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
