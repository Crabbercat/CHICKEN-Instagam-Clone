import { View, Text, Image, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

import { VideoView, useVideoPlayer } from "expo-video";

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // 🔥 luôn gọi hook — KHÔNG điều kiện
  const player = useVideoPlayer("", (player) => {
    player.loop = true;
  });

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "posts", String(id)));
      if (!snap.exists()) return;

      const p = snap.data();
      setPost(p);

      const u = await getDoc(doc(db, "users", p.userId));
      if (u.exists()) setUser(u.data());

      // 🔥 khi post là video → load vào player
      if (p.isVideo) {
        player.replace(p.mediaUrl);
      }
    };

    load();
  }, [id]);

  if (!post || !user) return <Text>Loading...</Text>;

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: "#fff" }}>

      <View style={styles.row}>
        <Image source={{ uri: user.image }} style={styles.avatar} />
        <Text style={styles.username}>{user.username}</Text>
      </View>

      {post.isVideo ? (
        <VideoView
          player={player}
          style={{ width: "100%", height: 300, borderRadius: 10 }}
          nativeControls
        />
      ) : (
        <Image
          source={{ uri: post.mediaUrl }}
          style={styles.image}
        />
      )}

      <Text style={styles.caption}>{post.caption}</Text>

      <Text style={styles.time}>
        {post.creation?.seconds
          ? new Date(post.creation.seconds * 1000).toLocaleString()
          : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 10 },
  username: { fontSize: 18, fontWeight: "700" },
  image: { width: "100%", height: 300, borderRadius: 10 },
  caption: { marginTop: 12, fontSize: 18 },
  time: { marginTop: 5, color: "#777" },
});
