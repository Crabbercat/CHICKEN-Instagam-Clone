import { use, useEffect, useState } from "react";
import { View, Image, FlatList, StyleSheet } from "react-native";
import { db } from "../firebase";
import { collection, orderBy, getDocs, query } from "firebase/firestore";

//test

type Post = {
  id: string;
  mediaUrl: string;
  userId: string;
  userID: string;
};

export default function ExploreScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    localPosts();
  }, []);

  const localPosts = async () => {
    const ref = collection(db, "posts");
    const q = query(ref, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Post, "id">) }));
    setPosts(data);
  };
    return (
    <FlatList
    data={posts}
    numColumns={2}
    keyExtractor={(item) => item.id}
    renderItem={({ item }: { item: Post }) => (
        <View style={styles.card}>
            <Image source={{ uri: item.mediaUrl }} style={styles.image} />
        </View>
        )}
    />
  );
}
    
const styles = StyleSheet.create({
    card: { width: '50%', margin: '1%' },
    image: { width: '100%', height: 150, borderRadius: 8 },
});