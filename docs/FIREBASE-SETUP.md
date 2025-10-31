Firebase setup for this project
=================================

This project includes a minimal Firebase initialization helper at `lib/firebase.tsx` that uses the modular Firebase JS SDK.

Steps to configure Firebase locally:

1. Copy `.env.example` to `.env`:

```powershell
cp .env.example .env
```

2. Fill in your Firebase project's values in `.env`.

3. Restart the Expo dev server so new environment variables are picked up.

How to use the helper in a screen or service:

```ts
import { getAuthInstance } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuthInstance();
await signInWithEmailAndPassword(auth, email, password);
```

The `lib/firebase.tsx` file also exports getters for Firestore and Storage:
- `getFirestoreInstance()`
- `getStorageInstance()`

Notes:
- Keep real credentials out of source control; use `.env` or your CI secret store.
- If you prefer the React Native native SDKs (react-native-firebase), feel free to swap the implementation.

App runtime note (Expo):

- Metro / process.env is not always available inside the running app in managed Expo. To ensure your Firebase keys are available at runtime, this repository includes `app.config.js` which loads `.env` (using `dotenv`) and injects your keys into `expo.extra` so `Constants.manifest.extra` / `Constants.expoConfig.extra` will contain the values.

- After editing `.env` restart the Expo server. If you still see the "not configured" message, ensure `.env` values are correctly formatted (no surrounding quotes, no extra spaces) or let `app.config.js` populate them by restarting with `npx expo start --clear`.
