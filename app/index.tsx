import { Link, useRouter } from "expo-router";
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { ActivityIndicator, InteractionManager, Pressable, StyleSheet, Text, View } from "react-native";
import { getAuthInstance, isFirebaseConfigured } from '../lib/firebase';

export default function Index() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If Firebase is not configured, avoid initializing the SDK to prevent
    // runtime errors like auth/invalid-api-key. Redirect to login so the
    // app continues to function in dev without crashing.
    if (!isFirebaseConfigured()) {
      console.warn('Firebase not configured (EXPO_FIREBASE_API_KEY missing). Redirecting to /auth/login.');
      InteractionManager.runAfterInteractions(() => router.replace('/auth/login'));
      setChecking(false);
      return;
    }

    const auth = getAuthInstance();
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      if (!user) {
        // If not logged in, send to login after interactions finish so the
        // navigation system has mounted.
        InteractionManager.runAfterInteractions(() => router.replace('/auth/login'));
      }
      setChecking(false);
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          This is a small demo home screen. Use the button below to open the
          test page or the auth screens.
        </Text>

        <Link href="/test" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Open test page</Text>
          </Pressable>
        </Link>

        <View style={{ height: 12 }} />

        <Link href="/auth/login" asChild>
          <Pressable style={styles.buttonAlt}>
            <Text style={styles.buttonTextAlt}>Open Auth (Register / Login)</Text>
          </Pressable>
        </Link>
      </View>
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
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
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
});
