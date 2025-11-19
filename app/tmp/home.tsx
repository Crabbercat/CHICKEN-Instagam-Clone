import React, { useEffect, useState } from "react";
import { View, FlatList } from "react-native";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import PostItem from "./components/postItems";

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("creation", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((doc) => arr.push({ id: doc.id, ...doc.data() }));
      setPosts(arr);
    });
    return () => unsub();
  }, []);

  return (
    <View style={{ flex: 1 , backgroundColor: 'white'}}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostItem post={item} />}
      />
    </View>
  );
}
