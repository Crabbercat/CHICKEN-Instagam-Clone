import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
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
import { auth, db } from "../../lib/firebase";

type Chat = {
  id: string;
  participants?: string[];
  lastMessage?: string;
  lastMessageAt?: any;
};

type User = {
  id: string;
  username?: string;
  name?: string;
  image?: string;
};

export default function ChatList() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [search, setSearch] = useState("");

  // Load danh sách chat
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setChats(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      );
    });

    return () => unsub();
  }, [currentUid]);

  // Load thông tin user còn lại
  useEffect(() => {
    chats.forEach(async (chat) => {
      // FIX self-chat
      const otherUid =
        chat.participants?.length === 1
          ? currentUid
          : chat.participants?.find((u) => u !== currentUid);

      if (otherUid && !users[otherUid]) {
        const snap = await getDoc(doc(db, "users", otherUid));
        if (snap.exists()) {
          setUsers((prev) => ({
            ...prev,
            [otherUid]: { id: otherUid, ...(snap.data() as any) },
          }));
        }
      }
    });
  }, [chats]);

  // Filter ChatList theo search
  const filtered = chats.filter((chat) => {
    const otherUid =
      chat.participants?.length === 1
        ? currentUid
        : chat.participants?.find((u) => u !== currentUid);

    const user = otherUid ? users[otherUid] : null;
    if (!user) return false;

    const keyword = search.toLowerCase();

    return (
      user.username?.toLowerCase().includes(keyword) ||
      user.name?.toLowerCase().includes(keyword)
    );
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 12 }}>
      {/* Search */}
      <TextInput
        placeholder="Search name or username..."
        style={styles.searchBox}
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const otherUid =
            item.participants?.length === 1
              ? currentUid
              : item.participants?.find((u) => u !== currentUid);

          const user = otherUid ? users[otherUid] : null;
          if (!user) return null;

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              <Image
                source={{
                  uri: user.image || "https://placekitten.com/200/200",
                }}
                style={styles.avatar}
              />

              <View>
                <Text style={styles.username}>
                  {otherUid === currentUid ? "You" : user.username}
                </Text>
                <Text style={styles.lastMsg}>
                  {item.lastMessage || "No messages yet"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.4,
    borderColor: "#ddd",
  },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  username: { fontSize: 16, fontWeight: "700" },
  lastMsg: { color: "#777" },
});
