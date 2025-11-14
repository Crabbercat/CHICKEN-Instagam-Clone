import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ImageBackground,
  Animated,
  Easing
} from 'react-native';
import { Link } from 'expo-router';
import Snowflake from '../components/Snow'; // ❄ import hiệu ứng tuyết


export default function Onboarding(): React.ReactElement {
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Tách animated style riêng để tránh lỗi TS
  const animatedStyle = {
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  };

  return (
    <ImageBackground
      source={require('../../assets/images/bg_onboarding.png')}
      style={styles.background}
      blurRadius={5}  // nền mờ nhẹ
    >
      {/* Overlay tối giúp chữ nổi */}
      <View style={styles.overlay} />

      {/* ❄ Tuyết rơi */}
      {Array.from({ length: 35 }).map((_, i) => (
        <Snowflake key={i} />
      ))}

      {/* TEXT + NÚT */}
      <Animated.View style={[styles.content, animatedStyle]}>
        <Text
          style={[
            styles.title,
            {
              color: '#e8440eff',
              marginTop: 8,
              letterSpacing: 4,
              fontWeight: '900',
              fontFamily: 'Arial',
              textShadowColor: 'rgba(230, 42, 142, 0.4)',
              textShadowOffset: { width: 2, height: 2 },
              textShadowRadius: 6,
            }
          ]}
        >
          INSTAGRAM
        </Text>


        <Text style={[styles.subtitle, { color: '#f2f2f2' }]}>
          Cùng kết nối với bạn bè và thế giới xung quanh bạn trên Instagram.
        </Text>
        <Text style={[styles.subtitle, { color: '#edf10bff', fontSize:12 }]}>
            Ứng dụng được phát triển bởi Chicken Team.
        </Text>

        <View style={{ height: 28 }} />

        <Link href="/auth/login" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Bắt đầu</Text>
          </Pressable>
        </Link>


        <View style={{ height: 12 }} />

      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 17,
    color: '#f2f2f2',
    textAlign: 'center',
    maxWidth: 540,
  },

  button: {
  width: 110,
  height: 35,
  paddingVertical: 12,
  borderRadius: 30,
  alignItems: "center",
  justifyContent: "center",

  // ⭐ Gradient giả bằng overlay màu hồng tím
  backgroundColor: "#f96464ff",
  shadowColor: "#e1306c",
  shadowOpacity: 0.4,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },

  elevation: 6, // Android shadow
  },

  buttonText: {
  color: "#ffffffd8",
  fontWeight: "700",
  fontSize: 18,
  letterSpacing: 1,
  },
});
