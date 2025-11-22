import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, User } from 'firebase/auth';
import { collection, doc, getDocs, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { getAuthInstance, getFirestoreInstance } from '../lib/firebase';

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}

function mapFirebaseError(e: any): string {
  const code = e?.code || '';
  switch (code) {
    case 'auth/weak-password':
      return 'Password is too weak (min 6 characters).';
    case 'auth/email-already-in-use':
      return 'Email already in use.';
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
    case 'auth/invalid-password':
    case 'auth/user-not-found':
      return 'Invalid email or password.';
    default:
      return e?.message ?? 'Authentication error.';
  }
}

function normalizePhone(value: string): string {
  return value.replace(/[^\d+]/g, '');
}

type IdentifierKind = 'email' | 'username' | 'phone';

function detectIdentifierKind(value: string): IdentifierKind {
  if (value.includes('@')) return 'email';
  const normalized = normalizePhone(value);
  if (normalized.length >= 6 && /^\+?\d+$/.test(normalized)) return 'phone';
  return 'username';
}

export const registerUser = createAsyncThunk<
  AuthUser,
  { email: string; password: string; username: string; fullName?: string; phone: string },
  { rejectValue: string }
>('auth/registerUser', async (args, { rejectWithValue }) => {
  try {
    const { email, password, username, fullName, phone } = args;
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    const uname = username.trim().toLowerCase();
    if (!uname) return rejectWithValue('Please enter a username');
    const normalizedPhone = normalizePhone(phone || '');
    if (!normalizedPhone) return rejectWithValue('Please enter a phone number');
    // username uniqueness
    const q = query(collection(db, 'users'), where('username', '==', uname));
    const snap = await getDocs(q);
    if (!snap.empty) return rejectWithValue('Username already taken');

    // phone uniqueness
    const phoneQuery = query(collection(db, 'users'), where('phone', '==', normalizedPhone));
    const phoneSnap = await getDocs(phoneQuery);
    if (!phoneSnap.empty) return rejectWithValue('Phone number already registered');

    // create user
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: username || fullName });

    // persist profile
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name: fullName || '',
      username: uname,
      email: email.trim(),
      phone: normalizedPhone,
      bio: '',
      image: 'default',
      followingCount: 0,
      followersCount: 0,
      createdAt: serverTimestamp(),
    });

    return toAuthUser(cred.user);
  } catch (e: any) {
    return rejectWithValue(mapFirebaseError(e));
  }
});

export type IdentifierErrorCode =
  | 'identifier/not-email'
  | 'identifier/not-username'
  | 'identifier/not-phone'
  | 'identifier/invalid'
  | 'identifier/unknown';

export const loginUser = createAsyncThunk<
  AuthUser,
  { identifier: string; password: string },
  { rejectValue: string | IdentifierErrorCode }
>('auth/loginUser', async ({ identifier, password }, { rejectWithValue }) => {
  try {
    const auth = getAuthInstance();
    const trimmed = identifier.trim();
    const kind = detectIdentifierKind(trimmed);
    let emailToUse = trimmed;

    if (kind === 'username') {
      const db = getFirestoreInstance();
      const usersRef = collection(db, 'users');
      const uname = trimmed.toLowerCase();
      const unameQuery = query(usersRef, where('username', '==', uname));
      const unameSnap = await getDocs(unameQuery);
      if (unameSnap.empty) {
        return rejectWithValue('identifier/not-username');
      }
      emailToUse = (unameSnap.docs[0].data()?.email as string) ?? '';
      if (!emailToUse) {
        return rejectWithValue('identifier/unknown');
      }
    } else if (kind === 'phone') {
      const normalizedPhone = normalizePhone(trimmed);
      if (!normalizedPhone) {
        return rejectWithValue('identifier/invalid');
      }
      const db = getFirestoreInstance();
      const usersRef = collection(db, 'users');
      const phoneQuery = query(usersRef, where('phone', '==', normalizedPhone));
      const phoneSnap = await getDocs(phoneQuery);
      if (phoneSnap.empty) {
        return rejectWithValue('identifier/not-phone');
      }
      emailToUse = (phoneSnap.docs[0].data()?.email as string) ?? '';
      if (!emailToUse) {
        return rejectWithValue('identifier/unknown');
      }
    }

    const cred = await signInWithEmailAndPassword(auth, emailToUse.trim(), password);
    return toAuthUser(cred.user);
  } catch (e: any) {
    return rejectWithValue(mapFirebaseError(e));
  }
});

export const sendPasswordReset = createAsyncThunk<
  void,
  { email: string },
  { rejectValue: string }
>('auth/sendPasswordReset', async ({ email }, { rejectWithValue }) => {
  try {
    const auth = getAuthInstance();
    await sendPasswordResetEmail(auth, email.trim());
    return;
  } catch (e: any) {
    return rejectWithValue(mapFirebaseError(e));
  }
});

export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      const auth = getAuthInstance();
      await signOut(auth);
    } catch (e: any) {
      return rejectWithValue(mapFirebaseError(e));
    }
  }
);

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Register failed';
      })
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        const payload = action.payload;
        if (typeof payload === 'string' && payload.startsWith('identifier/')) {
          state.error = null;
        } else {
          state.error = (payload as string) ?? 'Login failed';
        }
      })
      .addCase(sendPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendPasswordReset.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(sendPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to send reset email';
      })
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Logout failed';
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
