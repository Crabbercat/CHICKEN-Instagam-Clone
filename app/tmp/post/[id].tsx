import { View, Text, Image, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "posts", String(id));
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const p = snap.data();
        setPost(p);

        // Load user
        const u = await getDoc(doc(db, "users", p.userId));
        if (u.exists()) setUser(u.data());
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

      <Image source={{ uri: post.mediaUrl }} style={styles.image} />

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
  row: { flexDirection: "row", alignItems: "center", },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 10 },
  username: { fontSize: 18, fontWeight: "700" },
  image: { width: "100%", height: 200, borderRadius: 10 },
  caption: { marginTop: 12, fontSize: 18 },
  time: { marginTop: 5, color: "#777" },
});
