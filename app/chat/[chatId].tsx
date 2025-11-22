import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";

export default function ChatDetail() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);

  const flatListRef = useRef<any>(null);

  // Load messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    return () => unsub();
  }, [chatId]);

  // Load user info
  useEffect(() => {
    const loadPartner = async () => {
      const chatSnap = await getDoc(doc(db, "chats", chatId));
      if (!chatSnap.exists()) return;

      const participants = chatSnap.data().participants;
      const otherUid = participants.find((u: string) => u !== currentUid);

      const userSnap = await getDoc(doc(db, "users", otherUid));
      if (userSnap.exists()) {
        setOtherUser({
          id: otherUid,
          ...(userSnap.data() as any),
        });
      }
    };

    loadPartner();
  }, [chatId]);

  // Send message
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: currentUid,
      createdAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingBottom: 0 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingBottom: 60 }]}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>{"<"}</Text>
          </TouchableOpacity>

          <View style={styles.headerUser}>
            <Image
              source={{
                uri: otherUser?.image || "https://placekitten.com/200/200",
              }}
              style={styles.headerAvatar}
            />
            <Text style={styles.headerName}>
              {otherUser?.username || "Loading..."}
            </Text>
          </View>
        </View>

        {/* MESSAGES */}
        <FlatList
          ref={flatListRef}
          style={{ flex: 1 }}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => {
            const isMe = item.senderId === currentUid;

            return (
              <View
                style={[
                  styles.msgWrap,
                  { alignItems: isMe ? "flex-end" : "flex-start" },
                ]}
              >
                <View
                  style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}
                >
                  <Text style={{ color: isMe ? "#fff" : "#000" }}>
                    {item.text}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* INPUT */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            value={text}
            onChangeText={setText}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  back: { fontSize: 24, marginRight: 10 },
  headerUser: { flexDirection: "row", alignItems: "center" },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerName: { fontSize: 17, fontWeight: "700" },

  msgWrap: { marginVertical: 4 },
  msgBubble: {
    padding: 10,
    borderRadius: 18,
    maxWidth: "75%",
  },
  myMsg: { backgroundColor: "#0095f6" },
  theirMsg: { backgroundColor: "#e5e5ea" },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  sendBtn: {
    backgroundColor: "#0095f6",
    marginLeft: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: "center",
  },
});
