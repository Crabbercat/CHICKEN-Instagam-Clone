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
  doc,
  updateDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
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
import { db, auth } from "../../lib/firebase";

type User = {
  uid: string;
  name?: string;
  username?: string;
  image?: string;
};

export default function SearchScreen() {
  const [text, setText] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  // 🟦 Load lịch sử tìm kiếm
  useEffect(() => {
    if (!currentUid) return;

    const unsub = onSnapshot(doc(db, "users", currentUid), (snap) => {
      const data = snap.data();
      setHistory(data?.searchHistory || []);
    });

    return unsub;
  }, []);

  // 🟦 Khi user nhập -> search after delay
  useEffect(() => {
    if (!text.trim()) {
      setUsers([]);
      return;
    }
    const delay = setTimeout(() => searchUsers(text), 400);
    return () => clearTimeout(delay);
  }, [text]);

  // 🟦 SEARCH FIRESTORE
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

  // 🟦 Lưu lịch sử tìm kiếm
  const saveHistory = async (user: User) => {
    if (!currentUid) return;

    const userRef = doc(db, "users", currentUid);

    await updateDoc(userRef, {
      searchHistory: arrayUnion({
        uid: user.uid,
        username: user.username,
        image: user.image,
        at: Date.now(),
      }),
    });
  };

  // 🟦 Xoá 1 user khỏi lịch sử
  const removeHistoryItem = async (item: any) => {
    if (!currentUid) return;

    await updateDoc(doc(db, "users", currentUid), {
      searchHistory: arrayRemove(item),
    });
  };

  // 🟦 Xoá tất cả lịch sử
  const clearHistory = async () => {
    await updateDoc(doc(db, "users", currentUid), {
      searchHistory: [],
    });
  };

  // 🟦 Mở chat (giữ nguyên code bạn)
  const startChat = async (targetUid: string) => {
    if (targetUid === currentUid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUid)
    );

    const snap = await getDocs(q);
    let foundChatId = null;

    snap.forEach((docSnap) => {
      if (docSnap.data().participants.includes(targetUid)) {
        foundChatId = docSnap.id;
      }
    });

    if (foundChatId) {
      router.push(`/chat/${foundChatId}`);
      return;
    }

    const newChat = await addDoc(collection(db, "chats"), {
      participants: [currentUid, targetUid],
      createdAt: serverTimestamp(),
    });

    router.push(`/chat/${newChat.id}`);
  };

  const showingHistory = !text.trim();

  return (
    <View style={styles.container}>
      {/* INPUT */}
      <TextInput
        placeholder="Search name or username..."
        style={styles.input}
        value={text}
        onChangeText={setText}
      />

      {/* 🟦 Nếu không nhập -> hiện lịch sử */}
      {showingHistory ? (
        <View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700" }}>
              Recent searches
            </Text>
            {history.length > 0 && (
              <TouchableOpacity onPress={clearHistory}>
                <Text style={{ color: "red" }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={history.sort((a, b) => b.at - a.at)}
            keyExtractor={(item) => item.uid + item.at}
            renderItem={({ item }) => (
              <View style={styles.user}>
                <TouchableOpacity
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    flex: 1,
                  }}
                  onPress={() => {
                    saveHistory(item);
                    router.push({
                      pathname: "/user/profile",
                      params: { uid: item.uid },
                    });
                  }}
                >
                  <Image
                    source={{
                      uri: item.image || "https://i.imgur.com/7yUvePI.png",
                    }}
                    style={styles.avatar}
                  />
                  <Text style={styles.username}>{item.username}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => removeHistoryItem(item)}>
                  <Text style={{ color: "#999", fontSize: 18 }}>×</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </View>
      ) : (
        /* 🟦 Kết quả search */
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={({ item }) => (
            <View style={styles.user}>
              <TouchableOpacity
                style={{ flex: 1, flexDirection: "row", alignItems: "center" }}
                onPress={() => {
                  saveHistory(item);
                  router.push({
                    pathname: "/user/profile",
                    params: { uid: item.uid },
                  });
                }}
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

              {item.uid !== currentUid && (
                <TouchableOpacity
                  style={styles.chatBtn}
                  onPress={() => {
                    saveHistory(item);
                    startChat(item.uid);
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Chat</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
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
    borderRadius: 24,
    marginRight: 10,
  },
  username: { fontWeight: "700", fontSize: 16 },
  chatBtn: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
});
