import { useRouter } from "expo-router";
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../lib/firebase";
import { createOrGetChat } from "../lib/chat";
type User = {
  id: string;
  name?: string;
  username?: string;
  image?: string;
};

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!text.trim()) {
      setUsers([]);
      return;
    }

    const delay = setTimeout(() => searchUsers(text.trim().toLowerCase()), 350);
    return () => clearTimeout(delay);
  }, [text]);

  const searchUsers = async (searchText: string) => {
    const ref = collection(db, "users");

    // ---- Search by USERNAME ----
    const qUsername = query(
      ref,
      orderBy("username"),
      startAt(searchText),
      endAt(searchText + "\uf8ff")
    );

    const snap1 = await getDocs(qUsername);

    // ---- Search by NAME ----
    const qName = query(
      ref,
      orderBy("name"),
      startAt(searchText),
      endAt(searchText + "\uf8ff")
    );

    const snap2 = await getDocs(qName);

    // Merge 2 kết quả, tránh duplicate
    const map = new Map<string, User>();

    snap1.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));
    snap2.docs.forEach((d) => map.set(d.id, { id: d.id, ...(d.data() as any) }));

    setUsers([...map.values()]);
  };

  const openChat = async (userId: string) => {
    const chatId = await createOrGetChat(userId);
    if (chatId) router.push(`/chat/${chatId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: "#fff" }]}>

      <TextInput
        placeholder="Search username or name..."
        style={styles.input}
        value={text}
        onChangeText={setText}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            {/* Avatar */}
            <Image
              source={{ uri: item.image || "https://placekitten.com/200/200" }}
              style={styles.avatar}
            />

            {/* Info (bấm vào → mở profile) */}
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                router.push({
                  pathname: "/user/profile",
                  params: { uid: item.id },
                })
              }
            >
              <Text style={styles.username}>{item.username}</Text>
              <Text style={styles.name}>{item.name || "No name"}</Text>
            </TouchableOpacity>

            {/* Chat Button */}
            <TouchableOpacity
              style={styles.chatBtn}
              onPress={() => openChat(item.id)}
            >
              <Text style={styles.chatBtnText}>Chat</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1 },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.3,
    borderColor: "#eee",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: "#ccc",
  },

  username: {
    fontSize: 16,
    fontWeight: "600",
  },

  name: {
    color: "#666",
    fontSize: 13,
  },

  chatBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },

  chatBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
