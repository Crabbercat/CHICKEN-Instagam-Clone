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
  updateDoc,
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

// Format giờ
const formatTime = (ts: any) => {
  if (!ts) return "";
  const date = ts.toDate();
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
};

export default function ChatDetail() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);

  const flatListRef = useRef<any>(null);

  // Load messages realtime
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

    return unsub;
  }, [chatId]);

  // Load the other user's info
  useEffect(() => {
    const loadPartner = async () => {
      const chatSnap = await getDoc(doc(db, "chats", chatId));
      if (!chatSnap.exists()) return;

      const participants = chatSnap.data().participants;

      let otherUid = participants.find((u: string) => u !== currentUid);
      if (!otherUid) otherUid = currentUid;

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

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!text.trim()) return;

    // 1) thêm message vào subcollection
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: currentUid,
      createdAt: serverTimestamp(),
    });

    // cập nhật lastMessage + lastMessageAt cho ChatList
    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, paddingBottom: 60 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container]}>
        
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
              {otherUser
                ? otherUser.id === currentUid
                  ? "You"
                  : otherUser.username || otherUser.name || "Unknown"
                : "Loading..."}
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
          renderItem={({ item, index }) => {
            const isMe = item.senderId === currentUid;

            const nextMsg = messages[index + 1];
            const isLastOfGroup =
              !nextMsg || nextMsg.senderId !== item.senderId;

            return (
              <View
                style={[
                  styles.msgWrap,
                  { alignItems: isMe ? "flex-end" : "flex-start" },
                ]}
              >
                {/* Bubble */}
                <View
                  style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}
                >
                  <Text style={{ color: isMe ? "#fff" : "#000" }}>
                    {item.text}
                  </Text>
                </View>

                {/* chỉ hiện khi là tin cuối nhóm */}
                {isLastOfGroup && (
                  <Text
                    style={{
                      fontSize: 11,
                      marginTop: 3,
                      color: "#777",
                      alignSelf: "center",
                    }}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                )}
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