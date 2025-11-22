import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  startAt,
  endAt,
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
import { createOrGetChat } from "../../lib/chat";

// -----------------------------
// TYPES
// -----------------------------
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

// -----------------------------
// MAIN SCREEN
// -----------------------------
export default function ChatList() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [mode, setMode] = useState<"chat" | "search">("chat");

  const [text, setText] = useState("");
  const [searchUsers, setSearchUsers] = useState<User[]>([]);

  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});

  // -----------------------------
  // LOAD CHAT LIST
  // -----------------------------
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...(d.data() as Omit<Chat, "id">) }) as Chat
      );
      setChats(data);
    });

    return () => unsub();
  }, []);

  // -----------------------------
  // LOAD USER INFO FOR CHAT LIST
  // -----------------------------
  useEffect(() => {
    chats.forEach((chat) => {
      const otherUid = chat.participants?.find((u) => u !== currentUid);
      if (otherUid && !users[otherUid]) {
        getDoc(doc(db, "users", otherUid)).then((snap) => {
          if (snap.exists()) {
            const data = snap.data() as User;

            setUsers((prev) => ({
              ...prev,
              [otherUid]: {
                id: otherUid,
                username: data.username,
                name: data.name,
                image: data.image,
              },
            }));
          }
        });
      }
    });
  }, [chats]);

  // -----------------------------
  // SEARCH USERS
  // -----------------------------
  useEffect(() => {
    if (!text.trim()) {
      setSearchUsers([]);
      setMode("chat");
      return;
    }

    setMode("search");

    const delay = setTimeout(() => searchUser(text.trim()), 400);
    return () => clearTimeout(delay);
  }, [text]);

  const searchUser = async (keyword: string) => {
    const ref = collection(db, "users");
    const q = query(
      ref,
      orderBy("username"),
      startAt(keyword.toLowerCase()),
      endAt(keyword.toLowerCase() + "\uf8ff")
    );

    const snap = await getDocs(q);
    setSearchUsers(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<User, "id">) }))
    );
  };

  // -----------------------------
  // OPEN CHAT
  // -----------------------------
  const openChat = async (otherUid: string) => {
    const chatId = await createOrGetChat(otherUid);
    if (chatId) router.push(`/chat/${chatId}`);
  };

  // -----------------------------
  // RENDER UI
  // -----------------------------
  return (
    <View style={{ flex: 1, backgroundColor: "#fff", padding: 12 }}>
      {/* TITLE */}
      <Text style={styles.title}>Messages</Text>

      {/* SEARCH */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search username…"
        value={text}
        onChangeText={setText}
      />

      {/* SEARCH RESULTS */}
      {mode === "search" ? (
        <FlatList
          data={searchUsers}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Image
                source={{
                  uri: item.image || "https://placekitten.com/200/200",
                }}
                style={styles.avatar}
              />

              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.subtitle}>{item.name}</Text>
              </View>

              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => openChat(item.id)}
              >
                <Text style={styles.chatBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      ) : (
        /* CHAT LIST */
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const otherUid =
              item.participants?.find((u) => u !== currentUid) || "";
            const other = users[otherUid];

            return (
              <TouchableOpacity
                style={styles.row}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                <Image
                  source={{
                    uri: other?.image || "https://placekitten.com/200/200",
                  }}
                  style={styles.avatar}
                />

                <View>
                  <Text style={styles.username}>
                    {other?.username || otherUid}
                  </Text>
                  <Text style={styles.subtitle}>
                    {item.lastMessage || "No messages yet"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

// -----------------------------
// STYLES
// -----------------------------
const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.3,
    borderColor: "#ddd",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  username: { fontSize: 16, fontWeight: "700" },
  subtitle: { color: "#777", fontSize: 13, marginTop: 2 },

  chatBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  chatBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});
