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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { auth, db } from "../../lib/firebase";

// ===== TYPES =====
type Chat = {
  id: string;
  participants: string[];
  lastMessage?: string;
  lastMessageAt?: any;
};

type UserData = {
  name?: string;
  username?: string;
  image?: string;
};

//TIME FORMAT
function formatTime(ts: any) {
  if (!ts) return "";
  const date = ts.toDate();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

//COMPONENT
export default function ChatList() {
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<Record<string, UserData>>({});

  //LOAD CHAT LIST
  useEffect(() => {
    if (!currentUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUid),
      orderBy("lastMessageAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Chat));
      setChats(list);
    });

    return () => unsub();
  }, []);

  //LOAD USERS
  useEffect(() => {
    const loadUser = async (uid: string) => {
      if (users[uid]) return;
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        setUsers((prev) => ({ ...prev, [uid]: snap.data() as UserData }));
      }
    };

    chats.forEach((chat) => {
      const otherUid =
        chat.participants.length === 1
          ? currentUid
          : chat.participants.find((u) => u !== currentUid);

      if (otherUid) loadUser(otherUid);
    });
  }, [chats]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Messages</Text>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const otherUid =
            item.participants.length === 1
              ? currentUid
              : item.participants.find((u) => u !== currentUid);

          const u = users[otherUid!] || {};

          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/chat/${item.id}`)}
            >
              {/* Avatar */}
              <Image
                source={{
                  uri: u.image || "https://i.imgur.com/7yUvePI.png",
                }}
                style={styles.avatar}
              />

              {/* Name + last message */}
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{u.username || "User"}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {item.lastMessage || "No messages"}
                </Text>
              </View>

              {/* Time */}
              <Text style={styles.time}>
                {item.lastMessageAt ? formatTime(item.lastMessageAt) : ""}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 50,
    marginRight: 12,
  },
  username: { fontSize: 17, fontWeight: "700" },
  lastMessage: { fontSize: 14, color: "#777", marginTop: 2 },
  time: { fontSize: 12, color: "#888", marginLeft: 10 },
});
