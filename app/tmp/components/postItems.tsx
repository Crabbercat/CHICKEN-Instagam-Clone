import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../../../lib/firebase";
import { toggleLike } from "../interation/like";

export default function PostItem({ post }: { post: any }) {
  const router = useRouter();
  const [user, setUser] = useState<any>({});

  useEffect(() => {
    const loadUser = async () => {
      const ref = doc(db, "users", post.userId);
      const snap = await getDoc(ref);
      if (snap.exists()) setUser(snap.data());
    };
    loadUser();
  }, [post.userId]);

  const openProfile = (event?: GestureResponderEvent) => {
    event?.stopPropagation?.();
    if (!post.userId) return;
    router.push({ pathname: '/user/profile', params: { uid: post.userId } });
  };

  return (
    <Pressable onPress={() => router.push(`/tmp/post/${post.id}`)}>
      <View style={styles.post}>

        {/* USER INFO */}
        <Pressable style={styles.row} onPress={openProfile}>
          <Image source={{ uri: user.image ?? "" }} style={styles.avatar} />
          <Text style={styles.username}>{user.username ?? 'User'}</Text>
        </Pressable>

        {/* IMAGE */}
        <Image source={{ uri: post.mediaUrl }} style={styles.image} />

        {/* CAPTION */}
        <Text style={styles.caption}>{post.caption}</Text>

        {/* TIME */}
        <Text style={styles.time}>
          {post.creation?.seconds
            ? new Date(post.creation.seconds * 1000).toLocaleString()
            : ""}
        </Text>

        {/* ACTIONS */}
        <View style={styles.row}>
          <Pressable onPress={() => toggleLike(post.id, post.userId)}>
            <Text style={styles.action}>❤️ {post.likesCount}</Text>
          </Pressable>

          <Pressable onPress={() => router.push(`/tmp/comments/${post.id}`)}>
            <Text style={styles.action}>💬 {post.commentsCount}</Text>
          </Pressable>
        </View>

      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  post: {
    marginBottom: 20,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: "700",
  },
  image: {
    width: "100%",
    height: 260,
    borderRadius: 10,
  },
  caption: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: "500",
  },
  time: {
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },
  action: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 20,
  },
});
