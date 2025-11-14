import React, { useEffect, useState } from "react";
import { View, Text, Image, FlatList, StyleSheet, Pressable } from "react-native";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toggleLike } from "../tmp/interation/like";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();   // <------ ĐÚNG CHỖ NÀY

  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("creation", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
      setPosts(list);
    });

    return () => unsubscribe();
  }, []);

  const renderPost = ({ item }: any) => (
    <View style={styles.post}>
      <Image source={{ uri: item.mediaUrl }} style={styles.image} />

      <Text style={styles.caption}>{item.caption}</Text>

      <View style={{ flexDirection: "row", marginTop: 8 }}>

        <Pressable onPress={() => toggleLike(item.id, item.userId)}>
          <Text style={styles.action}>❤️ {item.likesCount}</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/tmp/comments/${item.id}`)}
        >
          <Text style={styles.action}>💬 {item.commentsCount}</Text>
        </Pressable>

      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  post: { marginBottom: 20, backgroundColor: "#fff", padding: 10, borderRadius: 10 },
  image: { width: "100%", height: 260, borderRadius: 10 },
  caption: { marginTop: 8, fontSize: 16, fontWeight: "500" },
  action: { fontSize: 16, fontWeight: "600", marginRight: 12 },
});
