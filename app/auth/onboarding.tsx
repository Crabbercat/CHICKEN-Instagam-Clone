import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ImageBackground,
  Animated,
  Image,
 
  Easing
} from 'react-native';
import { Link } from 'expo-router';
import Snowflake from '../components/Snow'; // ❄ import hiệu ứng tuyết
import { LinearGradient } from 'expo-linear-gradient';




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
        <Image
          source={require('../../assets/images/logo_insta.png')}
          style={{ width: 150, height: 150, marginBottom:10}}
        />
        <Text style={[styles.subtitle, { color: '#edf10bff', fontSize:12 }]}>
            Ứng dụng được phát triển bởi Chicken Team.
        </Text>

        <View style={{ height: 20 }} />

      <Link href="/auth/login" asChild>
      <Pressable style={styles.buttonWrapper}>
        <LinearGradient
          colors={['#833AB4', '#FD1D1D', '#FCB045']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonGradientText}>Bắt đầu</Text>
        </LinearGradient>
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

  subtitle: {
    fontSize: 17,
    color: '#f2f2f2',
    textAlign: 'center',
    maxWidth: 540,
  },

  buttonGradient: {
  width: 95,
  height: 40,
  paddingVertical: 14,
  borderRadius: 14,
  alignItems: 'center',
  justifyContent: 'center',
  display: 'flex',

  shadowColor: '#000',
  shadowOpacity: 0.2,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 4,
  },

  buttonGradientText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonWrapper: {
  width: '100%',
  alignItems: 'center',   // ⭐ Căn giữa Pressable
},
});
