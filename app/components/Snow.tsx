import React, { useEffect, useRef } from "react";
import { Animated, Image, Dimensions, StyleSheet } from "react-native";

const { width, height } = Dimensions.get("window");

// Danh sách các icon hoa tuyết PNG
const snowImages = [
  require("../../assets/snow/s2.png"),
];

export default function Snowflake() {
  const x = Math.random() * width;
  const size = Math.random() * 30 + 20; // kích thước hoa tuyết PNG
  const duration = Math.random() * 6000 + 7000;
  const drift = Math.random() * 60 - 30; // trôi trái phải

  const translateY = useRef(new Animated.Value(-50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(Math.random() * 0.5 + 0.5)).current;

  const img = snowImages[Math.floor(Math.random() * snowImages.length)];

  useEffect(() => {
    const fall = () => {
      translateY.setValue(-50);
      translateX.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: height + 50,
          duration,
          useNativeDriver: true,
        }),

        Animated.timing(translateX, {
          toValue: drift,
          duration,
          useNativeDriver: true,
        }),

        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: true,
          })
        ]),
      ]).start(() => fall());
    };

    fall();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: x,
          opacity,
          transform: [
            { translateY: translateY },
            { translateX: translateX },
          ],
        },
      ]}
    >
      <Image
        source={img}
        style={{ width: size, height: size, tintColor: "#ffffffcc" }}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
  },
});
