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
  SafeAreaView,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "../../lib/firebase";

// Format time
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
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const flatListRef = useRef<any>(null);

  // Load chat info
  useEffect(() => {
    const loadChatInfo = async () => {
      const snap = await getDoc(doc(db, "chats", chatId));
      if (snap.exists()) setChatInfo(snap.data());
    };
    loadChatInfo();
  }, [chatId]);

  // Load partner info
  useEffect(() => {
    const loadPartner = async () => {
      if (!chatInfo || !chatInfo.participants) return;

      const otherUid =
        chatInfo.participants.find((u: string) => u !== currentUid) ||
        currentUid;

      const userSnap = await getDoc(doc(db, "users", otherUid));
      if (userSnap.exists()) {
        setOtherUser({
          id: otherUid,
          ...(userSnap.data() as any),
        });
      }
    };

    loadPartner();
  }, [chatInfo]);

  // Load messages realtime
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 80);
    });

    return unsub;
  }, [chatId]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: currentUid,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    });

    setText("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>

        {/* Background image */}
        {chatInfo?.backgroundUrl && (
          <Image
            source={{ uri: chatInfo.backgroundUrl }}
            style={styles.bgImage}
            resizeMode={
              chatInfo?.backgroundMode === "auto"
                ? "cover"
                : chatInfo?.backgroundMode
            }
          />
        )}

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

          <TouchableOpacity
            onPress={() => router.push(`/chat/chatsettings?chatId=${chatId}`)}
          >
            <Text style={styles.settings}>...</Text>
          </TouchableOpacity>
        </View>

        {/* MESSAGES */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 12,
            paddingBottom: 120, // tăng padding để tránh bị BottomBar che
          }}
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
                <View
                  style={[
                    styles.msgBubble,
                    isMe ? styles.myMsg : styles.theirMsg,
                  ]}
                >
                  <Text style={{ color: isMe ? "#fff" : "#000" }}>
                    {item.text}
                  </Text>
                </View>

                {isLastOfGroup && (
                  <Text style={styles.msgTime}>
                    {formatTime(item.createdAt)}
                  </Text>
                )}
              </View>
            );
          }}
        />

        {/* INPUT BAR */}
        <SafeAreaView style={styles.inputRow}>
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
        </SafeAreaView>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingBottom: 70,
  },

  bgImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
    opacity: 0.25,
    top: 0,
    left: 0,
    zIndex: -1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "rgba(255,255,255,0.8)",
  },
  back: { fontSize: 24, marginRight: 10 },
  headerUser: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerName: { fontSize: 17, fontWeight: "700" },
  settings: { fontSize: 24, marginLeft: 10 },

  msgWrap: { marginVertical: 4 },
  msgBubble: {
    padding: 10,
    borderRadius: 18,
    maxWidth: "75%",
  },
  myMsg: { backgroundColor: "#0095f6" },
  theirMsg: { backgroundColor: "#e5e5ea" },

  msgTime: {
    fontSize: 11,
    marginTop: 3,
    color: "#777",
    alignSelf: "center",
  },

  inputRow: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "white",
    marginBottom: -5,
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
