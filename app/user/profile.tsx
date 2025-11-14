import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../redux/store';
import { fetchUserPosts, fetchUserProfile, PostItem } from '../../redux/userSlice';

export default function UserProfile(): React.ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((s: RootState) => s.auth.user);
  const { profile, posts, loading, error } = useSelector((s: RootState) => s.user);

  // Allow opening `/user/profile?uid=...` otherwise show current user
  const uid = typeof params?.uid === 'string' ? params.uid : authUser?.uid;

  useEffect(() => {
    if (!uid) return;
    dispatch(fetchUserProfile({ uid }));
    dispatch(fetchUserPosts({ uid }));
  }, [uid, dispatch]);

  const isCurrent = authUser?.uid === uid;

  const numColumns = 3;
  const screenW = Dimensions.get('window').width;
  const spacing = 2;
  const itemSize = Math.floor((screenW - spacing * (numColumns - 1)) / numColumns);

  const renderItem = ({ item }: { item: PostItem }) => {
    const url = item.mediaUrl || item.image || item.photo || item.url;
    const creation = item.creation ?? item.createdAt ?? '';
    return (
      <Pressable
        onPress={() => {
          // navigate to tmp post page passing mediaUrl and creation as params
          router.push({ pathname: '/tmp/post', params: { mediaUrl: url ?? '', creation: String(creation), id: item.id } });
        }}
        style={{ width: itemSize, height: itemSize, marginRight: spacing, marginBottom: spacing }}
      >
        {url ? (
          <Image source={{ uri: url }} style={{ width: itemSize, height: itemSize }} />
        ) : (
          <View style={{ width: itemSize, height: itemSize, backgroundColor: '#eee' }} />
        )}
      </Pressable>
    );
  };

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
              <Pressable style={styles.editButton} onPress={() => router.push('/user/edit') }>
                <Text style={styles.editText}>Edit Profile</Text>
              </Pressable>
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
                <Text style={{ textAlign: 'center', color: '#666' }}>{error ? error : 'No posts yet.'}</Text>
              </View>
            )}
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
});
