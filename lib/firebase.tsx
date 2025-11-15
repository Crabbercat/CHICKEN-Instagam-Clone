// Lightweight Firebase initialization for Expo / React Native (modular SDK)
// Replace the environment variables in your local .env (or other secret store)
// with your Firebase project's values. This file intentionally reads from
// process.env so you can swap values at runtime (Expo config plugin, app.config, or .env).

import Constants from 'expo-constants';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { FirebaseStorage, getStorage } from 'firebase/storage';

// Prefer extras provided by Expo (app.config.js / app.json) at runtime,
// but fall back to process.env when needed. Use the modern Constants API
// when available (expoConfig).
const expoExtra = (Constants.expoConfig && (Constants.expoConfig as any).extra) || (Constants.manifest && (Constants.manifest as any).extra) || {};

function normalizeEnv(value: unknown): string {
  if (value === undefined || value === null) return '';
  let s = String(value).trim();
  // strip surrounding quotes if present
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

// Inline test config is disabled by default. If you need to quickly test the
// API key, set INLINE_TEST_CONFIG = true locally and fill INLINE_CONFIG.
const INLINE_TEST_CONFIG = false;
const INLINE_CONFIG = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
};


const firebaseConfig = INLINE_TEST_CONFIG
  ? (console.warn('Firebase: using INLINE_CONFIG for testing (remove before commit)'), INLINE_CONFIG)
  : {
      // Prefer expo extras first, then fall back to process.env
      apiKey: normalizeEnv(expoExtra.EXPO_FIREBASE_API_KEY ?? process.env.EXPO_FIREBASE_API_KEY),
      authDomain: normalizeEnv(expoExtra.EXPO_FIREBASE_AUTH_DOMAIN ?? process.env.EXPO_FIREBASE_AUTH_DOMAIN),
      projectId: normalizeEnv(expoExtra.EXPO_FIREBASE_PROJECT_ID ?? process.env.EXPO_FIREBASE_PROJECT_ID),
      storageBucket: normalizeEnv(expoExtra.EXPO_FIREBASE_STORAGE_BUCKET ?? process.env.EXPO_FIREBASE_STORAGE_BUCKET),
      messagingSenderId: normalizeEnv(expoExtra.EXPO_FIREBASE_MESSAGING_SENDER_ID ?? process.env.EXPO_FIREBASE_MESSAGING_SENDER_ID),
      appId: normalizeEnv(expoExtra.EXPO_FIREBASE_APP_ID ?? process.env.EXPO_FIREBASE_APP_ID),
      measurementId: normalizeEnv(expoExtra.EXPO_FIREBASE_MEASUREMENT_ID ?? process.env.EXPO_FIREBASE_MEASUREMENT_ID),
    };

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);   // <-- Quan trọng

export const auth = getAuth(app);

export function isFirebaseConfigured(): boolean {
  const key = firebaseConfig?.apiKey ?? '';
  // Basic sanity check: Firebase API keys for web projects commonly start with
  // 'AIza' and are around ~39 characters. This isn't foolproof but helps
  // detect obvious misconfiguration (empty or truncated values).
  if (!key || key.length < 20) return false;
  if (!key.startsWith('AIza')) return false;
  return true;
}

function maskKey(k: string) {
  if (!k) return '(empty)';
  if (k.length <= 10) return k;
  return `${k.slice(0, 6)}…${k.slice(-4)}`;
}

let appInstance: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    // In dev, provide a clear message instead of letting the SDK throw an
    // auth/invalid-api-key which is less actionable.
    const seen = firebaseConfig?.apiKey ?? '';
    console.warn('Firebase configuration is invalid or missing. Resolved apiKey:', maskKey(seen));
    throw new Error('Firebase not configured or invalid API key. Set EXPO_FIREBASE_API_KEY in .env or expo.extra and restart.');
  }

  if (!getApps().length) {
    appInstance = initializeApp(firebaseConfig);
  } else if (!appInstance) {
    appInstance = getApp();
  }
  return appInstance as FirebaseApp;
}

let authInstance: Auth | null = null;
export function getAuthInstance(): Auth {
  if (!authInstance) authInstance = getAuth(getFirebaseApp());
  return authInstance;
}

let firestoreInstance: Firestore | null = null;
export function getFirestoreInstance(): Firestore {
  if (!firestoreInstance) firestoreInstance = getFirestore(getFirebaseApp());
  return firestoreInstance;
}

let storageInstance: FirebaseStorage | null = null;
export function getStorageInstance(): FirebaseStorage {
  if (!storageInstance) storageInstance = getStorage(getFirebaseApp());
  return storageInstance;
}

// Export default for convenience
export default {
  getApp: getFirebaseApp,
  getAuth: getAuthInstance,
  getFirestore: getFirestoreInstance,
  getStorage: getStorageInstance,
};
