import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
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
  phone?: string;
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

export const updateUserProfile = createAsyncThunk<
  UserProfile,
  { uid: string; data: Partial<UserProfile> },
  { rejectValue: string }
>('user/updateUserProfile', async ({ uid, data }, { rejectWithValue }) => {
  try {
    const db = getFirestoreInstance();
    const ref = doc(db, 'users', uid);
    // update only provided fields
    await updateDoc(ref, data as any);
    const snap = await getDoc(ref);
    if (!snap.exists()) return rejectWithValue('User not found after update');
    return { uid: snap.id, ...(snap.data() as any) } as UserProfile;
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Failed to update profile');
  }
});

type UserState = {
  profile: UserProfile | null;
  posts: PostItem[];
  loading: boolean;
  error: string | null;
  followLoading: boolean;
  followError: string | null;
  isFollowing: boolean | null;
};

const initialState: UserState = {
  profile: null,
  posts: [],
  loading: false,
  error: null,
  followLoading: false,
  followError: null,
  isFollowing: null,
};

export const fetchFollowStatus = createAsyncThunk<
  { targetUid: string; isFollowing: boolean },
  { viewerUid: string; targetUid: string },
  { rejectValue: string }
>('user/fetchFollowStatus', async ({ viewerUid, targetUid }, { rejectWithValue }) => {
  try {
    if (viewerUid === targetUid) return { targetUid, isFollowing: false };
    const db = getFirestoreInstance();
    const relRef = doc(db, 'follows', `${viewerUid}_${targetUid}`);
    const snap = await getDoc(relRef);
    return { targetUid, isFollowing: snap.exists() };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Failed to check follow status');
  }
});

export const toggleFollowUser = createAsyncThunk<
  { targetUid: string; isFollowing: boolean },
  { viewerUid: string; targetUid: string; shouldFollow?: boolean },
  { rejectValue: string }
>('user/toggleFollowUser', async ({ viewerUid, targetUid, shouldFollow }, { rejectWithValue }) => {
  try {
    if (viewerUid === targetUid) return rejectWithValue('You cannot follow yourself');
    const db = getFirestoreInstance();
    const followId = `${viewerUid}_${targetUid}`;
    const followRef = doc(db, 'follows', followId);
    const viewerRef = doc(db, 'users', viewerUid);
    const targetRef = doc(db, 'users', targetUid);
    let nextFollowState = shouldFollow;
    if (typeof nextFollowState !== 'boolean') {
      const existing = await getDoc(followRef);
      nextFollowState = !existing.exists();
    }

    const batch = writeBatch(db);
    if (nextFollowState) {
      batch.set(followRef, {
        followerId: viewerUid,
        followingId: targetUid,
        createdAt: serverTimestamp(),
      });
      batch.update(viewerRef, { followingCount: increment(1) });
      batch.update(targetRef, { followersCount: increment(1) });
    } else {
      batch.delete(followRef);
      batch.update(viewerRef, { followingCount: increment(-1) });
      batch.update(targetRef, { followersCount: increment(-1) });
    }

    await batch.commit();
    return { targetUid, isFollowing: nextFollowState };
  } catch (e: any) {
    return rejectWithValue(e?.message ?? 'Failed to update follow');
  }
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.posts = [];
      state.error = null;
      state.loading = false;
      state.followLoading = false;
      state.followError = null;
      state.isFollowing = null;
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
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to update profile';
      });
    builder
      .addCase(fetchFollowStatus.pending, (state) => {
        state.followLoading = true;
        state.followError = null;
      })
      .addCase(fetchFollowStatus.fulfilled, (state, action) => {
        state.followLoading = false;
        state.isFollowing = action.payload.isFollowing;
      })
      .addCase(fetchFollowStatus.rejected, (state, action) => {
        state.followLoading = false;
        state.followError = action.payload ?? 'Failed to check follow status';
      })
      .addCase(toggleFollowUser.pending, (state) => {
        state.followLoading = true;
        state.followError = null;
      })
      .addCase(toggleFollowUser.fulfilled, (state, action) => {
        state.followLoading = false;
        state.isFollowing = action.payload.isFollowing;
        if (state.profile?.uid === action.payload.targetUid) {
          const delta = action.payload.isFollowing ? 1 : -1;
          const next = (state.profile.followersCount ?? 0) + delta;
          state.profile.followersCount = next < 0 ? 0 : next;
        }
      })
      .addCase(toggleFollowUser.rejected, (state, action) => {
        state.followLoading = false;
        state.followError = action.payload ?? 'Failed to update follow';
      });
  },
});

export const { clearProfile } = userSlice.actions;
export default userSlice.reducer;
