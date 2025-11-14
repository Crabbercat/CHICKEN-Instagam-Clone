import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getFirestoreInstance } from '../lib/firebase';

export type UserProfile = {
  uid: string;
  username?: string;
  name?: string;
  bio?: string;
  image?: string;
  followersCount?: number;
  followingCount?: number;
};

export type PostItem = {
  id: string;
  mediaUrl?: string;
  [k: string]: any;
};

export const fetchUserProfile = createAsyncThunk<UserProfile, { uid: string }, { rejectValue: string }>(
  'user/fetchUserProfile',
  async ({ uid }, { rejectWithValue }) => {
    try {
      const db = getFirestoreInstance();
      const ref = doc(db, 'users', uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) return rejectWithValue('User not found');
      return { uid: snap.id, ...(snap.data() as any) } as UserProfile;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Failed to load profile');
    }
  }
);

export const fetchUserPosts = createAsyncThunk<PostItem[], { uid: string }, { rejectValue: string }>(
  'user/fetchUserPosts',
  async ({ uid }, { rejectWithValue }) => {
    try {
      const db = getFirestoreInstance();

      // Try common pattern: posts collection with userId field (order by 'creation' field)
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('userId', '==', uid), orderBy('creation', 'desc'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      }

      return [];
    } catch (e: any) {
        console.log("FIRESTORE ERROR:", e);
        return rejectWithValue(e?.message ?? 'Failed to load posts');
    }
  }
);

type UserState = {
  profile: UserProfile | null;
  posts: PostItem[];
  loading: boolean;
  error: string | null;
};

const initialState: UserState = {
  profile: null,
  posts: [],
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.posts = [];
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load profile';
      })
      .addCase(fetchUserPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserPosts.fulfilled, (state, action: PayloadAction<PostItem[]>) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchUserPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load posts';
      });
  },
});

export const { clearProfile } = userSlice.actions;
export default userSlice.reducer;
