import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { db, auth } from "../firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { useRouter } from "expo-router";

//test

type Chat = {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
};


export default function ChatListScreen() {
  const [chats, setChats] = useState<Chat[]>([]);
  const user = auth.currentUser;
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    const ref = collection(db, "chats");
    const q = query(
      ref,
      where("participants", "array-contains", user.uid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data: Chat[] = snap.docs.map((d) => ({id: d.id, ...(d.data() as Omit<Chat, "id">)}));
      setChats(data);   
    });

    return () => unsub();
  }, []);

  return (
    <View style={{ padding: 16 }}>
      <FlatList
        data={chats}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => {
          const otherId = item.participants.find((id) => id !== user.uid);

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <View style={styles.avatar} />
              <View>
                <Text style={styles.user}>{otherId}</Text>
                <Text>{item.lastMessage}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", marginBottom: 16, alignItems: "center" },
  avatar: {
    width: 40, height: 40, backgroundColor: "#ccc",
    borderRadius: 50, marginRight: 12
  },
  user: { fontWeight: "bold" }
});