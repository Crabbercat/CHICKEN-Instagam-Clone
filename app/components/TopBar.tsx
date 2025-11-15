import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function TopBar() {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/header_home.png")} // đặt logo vào assets
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  logo: {
    width: 140,
    height: 40,
  },
});
