// Loads .env and exposes values under expo.extra so Constants.expoConfig.extra
// is available at runtime in managed Expo projects. This makes environment
// variables available to the app regardless of Metro's process.env behavior.

const fs = require('fs');
const path = require('path');

// Load .env early
try {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
} catch (e) {
  // ignore if dotenv is not available in the environment
}

const appJson = require('./app.json');

const extra = Object.assign({}, (appJson.expo && appJson.expo.extra) || {}, {
  EXPO_FIREBASE_API_KEY: process.env.EXPO_FIREBASE_API_KEY,
  EXPO_FIREBASE_AUTH_DOMAIN: process.env.EXPO_FIREBASE_AUTH_DOMAIN,
  EXPO_FIREBASE_PROJECT_ID: process.env.EXPO_FIREBASE_PROJECT_ID,
  EXPO_FIREBASE_STORAGE_BUCKET: process.env.EXPO_FIREBASE_STORAGE_BUCKET,
  EXPO_FIREBASE_MESSAGING_SENDER_ID: process.env.EXPO_FIREBASE_MESSAGING_SENDER_ID,
  EXPO_FIREBASE_APP_ID: process.env.EXPO_FIREBASE_APP_ID,
  EXPO_FIREBASE_MEASUREMENT_ID: process.env.EXPO_FIREBASE_MEASUREMENT_ID,
  REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REACT_NATIVE_PACKAGER_HOSTNAME,
});

module.exports = () => {
  return Object.assign({}, appJson, {
    expo: Object.assign({}, appJson.expo, { extra }),
  });
};
