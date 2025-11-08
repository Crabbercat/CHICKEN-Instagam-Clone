import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from 'firebase/auth';
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

export const registerUser = createAsyncThunk<
  AuthUser,
  { email: string; password: string; username: string; fullName?: string },
  { rejectValue: string }
>('auth/registerUser', async (args, { rejectWithValue }) => {
  try {
    const { email, password, username, fullName } = args;
    const auth = getAuthInstance();
    const db = getFirestoreInstance();

    const uname = username.trim().toLowerCase();
    if (!uname) return rejectWithValue('Please enter a username');
    // username uniqueness
    const q = query(collection(db, 'users'), where('username', '==', uname));
    const snap = await getDocs(q);
    if (!snap.empty) return rejectWithValue('Username already taken');

    // create user
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: username || fullName });

    // persist profile
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name: fullName || '',
      username: uname,
      email: email.trim(),
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

export const loginUser = createAsyncThunk<
  AuthUser,
  { email: string; password: string },
  { rejectValue: string }
>('auth/loginUser', async ({ email, password }, { rejectWithValue }) => {
  try {
    const auth = getAuthInstance();
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return toAuthUser(cred.user);
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
        state.error = action.payload ?? 'Login failed';
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
