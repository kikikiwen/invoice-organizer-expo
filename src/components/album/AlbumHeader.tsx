import { Pressable, StyleSheet, Text, View } from "react-native";

type AlbumHeaderProps = {
  title: string;
  topInset: number;
};

export function AlbumHeader({ title, topInset }: AlbumHeaderProps) {
  return (
    <View style={[styles.container, { paddingTop: topInset + 8 }]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
});
