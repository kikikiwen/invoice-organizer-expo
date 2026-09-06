import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

const splashImage = require("../../../assets/splash.png");

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <Image source={splashImage} style={styles.logo} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    width: 280,
    height: 280,
  },
});
