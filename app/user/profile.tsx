import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/authSlice';
import type { AppDispatch, RootState } from '../../redux/store';
import {
    fetchFollowStatus,
    fetchUserPosts,
    fetchUserProfile,
    PostItem,
    toggleFollowUser,
} from '../../redux/userSlice';

import { createOrGetChat } from "../../lib/chat";

type GridPostProps = {
  item: PostItem;
  size: number;
  spacing: number;
  onOpen: () => void;
};

function GridPost({ item, size, spacing, onOpen }: GridPostProps): React.ReactElement {
  const player = item.isVideo && item.mediaUrl
    ? useVideoPlayer(item.mediaUrl, (playerInstance) => {
        playerInstance.loop = true;
        playerInstance.pause();
      })
    : null;

  return (
    <Pressable onPress={onOpen} style={{ width: size, height: size, marginRight: spacing, marginBottom: spacing }}>
      {item.isVideo && player ? (
        <VideoView player={player} style={{ width: size, height: size, borderRadius: 4 }} contentFit="cover" />
      ) : item.mediaUrl ? (
        <Image source={{ uri: item.mediaUrl }} style={{ width: size, height: size }} />
      ) : (
        <View style={{ width: size, height: size, backgroundColor: '#eee' }} />
      )}
    </Pressable>
  );
}

export default function UserProfile(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const { user: authUser, loading: authLoading } = useSelector((s: RootState) => s.auth);
  const { profile, posts, loading, error, isFollowing, followLoading, followError } = useSelector((s: RootState) => s.user);

  const uid = typeof params?.uid === 'string' ? params.uid : authUser?.uid;

  useEffect(() => {
    if (!uid) return;
    dispatch(fetchUserProfile({ uid }));
    dispatch(fetchUserPosts({ uid }));
  }, [uid, dispatch]);

  useEffect(() => {
    if (!uid || !authUser?.uid) return;
    if (authUser.uid === uid) return;
    dispatch(fetchFollowStatus({ viewerUid: authUser.uid, targetUid: uid }));
  }, [uid, authUser?.uid, dispatch]);

  const isCurrent = authUser?.uid === uid;

  const handleFollowToggle = () => {
    if (!authUser?.uid || !uid || followLoading) return;
    dispatch(toggleFollowUser({ viewerUid: authUser.uid, targetUid: uid, shouldFollow: !isFollowing }));
  };

  const handleChatPress = async () => {
    if (!uid) return;
    const chatId = await createOrGetChat(uid);
    if (chatId) {
      router.push(`/chat/${chatId}`);
    }
  };

  const numColumns = 3;
  const screenW = Dimensions.get('window').width;
  const spacing = 2;
  const itemSize = Math.floor((screenW - spacing * (numColumns - 1)) / numColumns);

  const renderItem = ({ item }: { item: PostItem }) => (
    <GridPost
      item={item}
      size={itemSize}
      spacing={spacing}
      onOpen={() => router.push(`/tmp/post/${item.id}`)}
    />
  );

  return (
    <View style={styles.container}>
      {loading && !profile ? (
        <ActivityIndicator size="large" />
      ) : (
        <>
          <View style={styles.header}>
            <Image source={{ uri: profile?.image || 'https://via.placeholder.com/80' }} style={styles.avatar} />
            <View style={styles.info}>
              <Text style={styles.username}>{profile?.username ?? '—'}</Text>
              <View style={styles.countsRow}>
                <View style={styles.countItem}><Text style={styles.countNumber}>{posts?.length ?? 0}</Text><Text style={styles.countLabel}>Posts</Text></View>
                <View style={styles.countItem}><Text style={styles.countNumber}>{profile?.followersCount ?? 0}</Text><Text style={styles.countLabel}>Followers</Text></View>
                <View style={styles.countItem}><Text style={styles.countNumber}>{profile?.followingCount ?? 0}</Text><Text style={styles.countLabel}>Following</Text></View>
              </View>
              {profile?.name ? <Text style={styles.name}>{profile.name}</Text> : null}
              {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
            </View>
          </View>

          <View style={{ paddingHorizontal: 12, marginTop: 8 }}>
            {isCurrent ? (
              <Pressable style={styles.editButton} onPress={() => router.push('/user/edit')}>
                <Text style={styles.editText}>Edit Profile</Text>
              </Pressable>
            ) : authUser ? (
              <>
                <Pressable
                  style={[styles.followButton, isFollowing ? styles.followingButton : undefined]}
                  onPress={handleFollowToggle}
                  disabled={followLoading}
                >
                  <Text style={[styles.followText, isFollowing ? styles.followingText : undefined]}>
                    {followLoading ? 'Please wait…' : isFollowing ? 'Unfollow' : 'Follow'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.messageButton}
                  onPress={handleChatPress}
                >
                  <Text style={styles.messageText}>Nhắn tin</Text>
                </Pressable>

                {followError ? <Text style={styles.followError}>{followError}</Text> : null}
              </>
            ) : null}
          </View>

          <FlatList
            data={posts}
            keyExtractor={(i) => i.id}
            renderItem={renderItem}
            numColumns={numColumns}
            contentContainerStyle={{ padding: 2, paddingBottom: 90 }}
            ListEmptyComponent={() => (
              <View style={{ padding: 20 }}>
                <Text style={{ textAlign: 'center', color: '#666' }}>
                  {error ? error : 'No posts yet.'}
                </Text>
              </View>
            )}
            ListFooterComponent={() =>
              isCurrent ? (
                <View style={{ padding: 16 }}>
                  <Pressable
                    style={styles.logoutButton}
                    onPress={async () => {
                      if (authLoading) return;
                      try {
                        await dispatch(logoutUser()).unwrap();
                        router.replace('/auth/login');
                      } catch (err) {
                        console.warn('Logout failed', err);
                      }
                    }}
                    disabled={authLoading}
                  >
                    <Text style={styles.logoutText}>
                      {authLoading ? 'Logging out…' : 'Log out'}
                    </Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 12 },
  info: { flex: 1 },
  username: { fontSize: 18, fontWeight: '700' },
  countsRow: { flexDirection: 'row', marginTop: 8 },
  countItem: { alignItems: 'center', marginRight: 16 },
  countNumber: { fontWeight: '700' },
  countLabel: { color: '#666', fontSize: 12 },
  name: { fontWeight: '600', marginTop: 6 },
  bio: { color: '#444', marginTop: 4 },

  editButton: { marginTop: 8, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  editText: { fontWeight: '700' },

  followButton: { marginTop: 8, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#0095f6' },
  followText: { fontWeight: '700', color: '#fff' },
  followingButton: { backgroundColor: '#e5e5ea' },
  followingText: { color: '#111' },

  // ⭐ STYLE NÚT NHẮN TIN
  messageButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#34a853',
  },
  messageText: {
    fontWeight: '700',
    color: '#fff',
  },

  followError: { color: '#ef4444', marginTop: 6, textAlign: 'center' },

  logoutButton: { marginTop: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: '#ef4444' },
  logoutText: { fontWeight: '700', color: '#fff' },
});
