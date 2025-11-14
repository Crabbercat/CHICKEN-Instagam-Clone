import { Link, useRouter } from "expo-router";
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, Pressable, StyleSheet, Text, View } from "react-native";
import { useDispatch } from 'react-redux';
import { getAuthInstance, isFirebaseConfigured } from '../lib/firebase';
import { logoutUser } from '../redux/authSlice';
import type { AppDispatch } from '../redux/store';

export default function Index() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Nếu Firebase chưa cấu hình → chuyển đến onboarding
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured — redirecting to /auth/onboarding.');
      InteractionManager.runAfterInteractions(() => router.replace('/auth/onboarding'));
      setChecking(false);
      return;
    }

    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        // Chưa đăng nhập → chuyển đến Onboarding
        InteractionManager.runAfterInteractions(() => router.replace('/auth/onboarding'));
      }
      setChecking(false);
    });
    return unsub;
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Instagram Clone</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome</Text>
        <Text style={styles.cardText} numberOfLines={3}>
          This is a small demo home screen.
        </Text>

        <View style={{ height: 12 }} />

        {/* Chuyển đến Onboarding ngay trong App */}
        <Link href="/auth/onboarding" asChild>
          <Pressable style={styles.buttonAlt}>
            <Text style={styles.buttonTextAlt}>Go to Onboarding</Text>
          </Pressable>
        </Link>
      </View>

      <View style={{ height: 12 }} />

      <Pressable
        onPress={() => {
          dispatch(logoutUser());
        }}
        style={styles.logoutButton}
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#f6f6f8",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 12,
  },
  buttonAlt: {
    backgroundColor: "#fff",
    borderColor: "#007AFF",
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  buttonTextAlt: {
    color: "#007AFF",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
});
