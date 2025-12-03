import { useRouter } from "expo-router";
import {
  collection,
  endAt,
  getDocs,
  orderBy,
  query,
  startAt,
  where,
  addDoc,
  serverTimestamp,
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
import { db, auth } from "../lib/firebase";
import { createOrGetChat } from "../lib/chat";

type User = {
  uid: string;
  name?: string;
  username?: string;
  image?: string;
};

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!text.trim()) {
      setUsers([]);
      return;
    }
    const delay = setTimeout(() => searchUsers(text), 400);
    return () => clearTimeout(delay);
  }, [text]);

  const searchUsers = async (searchText: string) => {
    const ref = collection(db, "users");

    const q = query(
      ref,
      orderBy("username"),
      startAt(searchText),
      endAt(searchText + "\uf8ff")
    );

    const querySnapshot = await getDocs(q);

    const mapped = querySnapshot.docs.map((d) => ({
      uid: d.id,
      ...(d.data() as Omit<User, "uid">),
    }));

    setUsers(mapped);
  };

  //TẠO / MỞ CHAT
  const startChat = async (targetUid: string) => {
    if (targetUid === currentUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUid)
    );

    const snap = await getDocs(q);

    let foundChatId = null;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.participants.includes(targetUid)) {
        foundChatId = docSnap.id;
      }
    });

    if (foundChatId) {
      router.push(`/chat/${foundChatId}`);
      return;
    }

    const newChatRef = await addDoc(collection(db, "chats"), {
      participants: [currentUid, targetUid],
      createdAt: serverTimestamp(),
    });

    router.push(`/chat/${newChatRef.id}`);
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Search name or username..."
        style={styles.input}
        value={text}
        onChangeText={setText}
      />

      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.user}>
            
            {/* Bấm vào user → MỞ PROFILE */}
            <TouchableOpacity
              style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
              onPress={() =>
                router.push({
                  pathname: "/user/profile",
                  params: { uid: item.uid },
                })
              }
            >
              <Image
                source={{
                  uri: item.image || "https://i.imgur.com/7yUvePI.png",
                }}
                style={styles.avatar}
              />
              <View>
                <Text style={styles.username}>
                  {item.uid === currentUid ? "You" : item.username}
                </Text>
                <Text style={{ color: "#777" }}>{item.name}</Text>
              </View>
            </TouchableOpacity>

            {/* Nút Chat */}
            {item.uid !== currentUid && (
              <TouchableOpacity
                style={styles.chatBtn}
                onPress={() => startChat(item.uid)}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Chat</Text>
              </TouchableOpacity>
            )}

          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, flex: 1, backgroundColor: "white" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 12,
    marginBottom: 12,
  },
  user: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: "#ccc",
    borderRadius: 30,
    marginRight: 10,
  },
  username: {
    fontWeight: "700",
    fontSize: 16,
  },
  chatBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
});
