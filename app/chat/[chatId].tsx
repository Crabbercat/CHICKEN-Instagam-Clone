import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../lib/firebase";

const formatTime = (ts: any) => {
  if (!ts) return "";
  const d = ts.toDate();
  return `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
};

export default function ChatDetail() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();
  const currentUid = auth.currentUser?.uid;

  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [menuMsg, setMenuMsg] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);

  const flatListRef = useRef<any>(null);

  // Load chat info
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "chats", chatId), (snap) => {
      if (snap.exists()) setChatInfo(snap.data());
    });
    return unsub;
  }, [chatId]);

  // Load partner
  useEffect(() => {
    if (!chatInfo) return;

    const otherUid =
      chatInfo.participants.find((u: string) => u !== currentUid) || currentUid;

    (async () => {
      const u = await getDoc(doc(db, "users", otherUid));
      if (u.exists()) setOtherUser({ id: otherUid, ...u.data() });
    })();
  }, [chatInfo]);

  // Load messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(list);
      flatListRef.current?.scrollToEnd({ animated: true });
    });

    return unsub;
  }, [chatId]);

  // SEND or EDIT
  const sendMessage = async () => {
    if (!text.trim()) return;

    // ----------------------
    //     EDIT LOGIC
    // ----------------------
    if (editing) {
      const msgRef = doc(db, "chats", chatId, "messages", editingId);
      const snap = await getDoc(msgRef);

      // Chỉ sửa được tin nhắn của chính mình
      if (snap.exists() && snap.data().senderId === currentUid) {
        await updateDoc(msgRef, {
          text,
          edited: true,
        });
      }

      setEditing(false);
      setEditingId("");
      setText("");
      return;
    }

    // ----------------------
    //     SEND NEW MSG
    // ----------------------
    await addDoc(collection(db, "chats", chatId, "messages"), {
      text,
      senderId: currentUid,
      createdAt: serverTimestamp(),
      replyTo: replyTo || null,
    });

    await updateDoc(doc(db, "chats", chatId), {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    });

    setText("");
    setReplyTo(null);
  };

  // DELETE logic
  const deleteMessage = async (item: any) => {
    const msgRef = doc(db, "chats", chatId, "messages", item.id);

    if (item.senderId === currentUid) {
      await deleteDoc(msgRef);
    } else {
      await updateDoc(msgRef, {
        deletedFor: item.deletedFor
          ? Array.from(new Set([...item.deletedFor, currentUid]))
          : [currentUid],
      });
    }

    setMenuMsg(null);
  };

  const renderMessage = ({ item, index }: any) => {
    if (item.deletedFor?.includes(currentUid)) return null;

    const isMe = item.senderId === currentUid;
    const next = messages[index + 1];
    const last = !next || next.senderId !== item.senderId;

    return (
      <View style={{ marginVertical: 4 }}>
        <View
          style={[
            styles.msgRow,
            { justifyContent: isMe ? "flex-end" : "flex-start" },
          ]}
        >
          <View style={{ flexDirection: isMe ? "row-reverse" : "row" }}>
            <TouchableOpacity
              style={[
                styles.msgBubble,
                isMe ? styles.myMsg : styles.theirMsg,
              ]}
              onLongPress={() => setMenuMsg(item)}
            >
              {item.replyTo && (
                <View style={styles.replyMini}>
                  <Text style={styles.replyMiniText} numberOfLines={1}>
                    Reply: {item.replyTo.text}
                  </Text>
                </View>
              )}

              <Text style={{ color: isMe ? "#fff" : "#000" }}>
                {item.text}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dotBtn}
              onPress={() => setMenuMsg(item)}
            >
              <Text style={styles.dotText}>⋮</Text>
            </TouchableOpacity>
          </View>
        </View>

        {last && (
          <View
            style={{
              width: "100%",
              marginTop: 6,
              marginBottom: 18,
              paddingHorizontal: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                opacity: 0.55,
                textAlign: isMe ? "right" : "left",
              }}
            >
              {formatTime(item.createdAt)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      <ImageBackground
        source={{ uri: chatInfo?.backgroundUrl }}
        style={{ flex: 1 }}
        resizeMode="cover"
      >
        <SafeAreaView style={{ flex: 1 }}>
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
                {otherUser?.username || "User"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push(`/chat/chatsettings?chatId=${chatId}`)
              }
            >
              <Text style={styles.settings}>...</Text>
            </TouchableOpacity>
          </View>

          {/* MESSAGE LIST */}
          <FlatList
            ref={flatListRef}
            data={messages}
            style={{ flex: 1 }}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 12,
              paddingBottom: 100,
            }}
            renderItem={renderMessage}
          />

          {/* MENU POPUP */}
          {menuMsg && (
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setMenuMsg(null)}
            >
              <View style={styles.menuBox}>
                {/* REPLY */}
                <TouchableOpacity
                  onPress={() => {
                    setReplyTo(menuMsg);
                    setMenuMsg(null);
                  }}
                >
                  <Text style={styles.menuText}>Reply</Text>
                </TouchableOpacity>

                {/* EDIT — chỉ hiện nếu là tin nhắn của mình */}
                {menuMsg.senderId === currentUid && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditing(true);
                      setEditingId(menuMsg.id);
                      setText(menuMsg.text);
                      setMenuMsg(null);
                    }}
                  >
                    <Text style={styles.menuText}>Edit</Text>
                  </TouchableOpacity>
                )}

                {/* DELETE */}
                <TouchableOpacity onPress={() => deleteMessage(menuMsg)}>
                  <Text style={styles.menuDelete}>
                    {menuMsg.senderId === currentUid
                      ? "Delete for everyone"
                      : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}

          {/* REPLY PREVIEW */}
          {replyTo && (
            <View style={styles.replyBox}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontWeight: "700" }}>Replying to:</Text>

                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Text
                    style={{
                      fontSize: 22,
                      fontWeight: "bold",
                      color: "#444",
                      marginRight: 5,
                      marginTop: -3,
                    }}
                  >
                    ×
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                numberOfLines={1}
                style={{ marginTop: 4, opacity: 0.8 }}
              >
                {replyTo.text}
              </Text>
            </View>
          )}

          {/* INPUT */}
          <View style={styles.inputRowFixed}>
            <TextInput
              style={styles.input}
              placeholder={editing ? "Editing..." : "Message..."}
              value={text}
              onChangeText={setText}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
              <Text
                style={{ color: "#fff", fontWeight: "700" }}
              >
                {editing ? "Save" : "Send"}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "white",
    zIndex: 10,
  },

  back: { fontSize: 24, marginRight: 10 },
  headerUser: { flexDirection: "row", alignItems: "center", flex: 1 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  headerName: { fontSize: 17, fontWeight: "700" },
  settings: { fontSize: 24 },

  msgRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
  },

  msgBubble: {
    padding: 10,
    borderRadius: 18,
    alignSelf: "flex-start",
    maxWidth: 150,
    flexShrink: 1,
  },
  myMsg: {
    backgroundColor: "#0095f6",
    alignSelf: "flex-end",
  },
  theirMsg: {
    backgroundColor: "#e5e5ea",
    alignSelf: "flex-start",
  },

  dotBtn: {
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  dotText: { opacity: 0.5, fontSize: 18 },

  replyMini: {
    borderLeftWidth: 3,
    borderColor: "#ccc",
    paddingLeft: 6,
    marginBottom: 4,
  },
  replyMiniText: { fontSize: 11, opacity: 0.7 },

  replyBox: {
    position: "absolute",
    bottom: 111,
    left: 0,
    right: 0,
    backgroundColor: "#eee",
    padding: 10,
    borderLeftWidth: 4,
    borderColor: "#0095f6",
    marginHorizontal: 10,
    borderRadius: 8,
    zIndex: 200,
    paddingTop: 12,
    paddingBottom: 12,
  },

  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 500,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },

  menuBox: {
    width: 180,
    backgroundColor: "#222",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 15,
    elevation: 4,
  },

  menuText: {
    fontSize: 16,
    color: "#fff",
    paddingVertical: 8,
  },

  menuDelete: {
    fontSize: 16,
    color: "#ff4d4d",
    paddingVertical: 8,
    fontWeight: "600",
  },

  inputRowFixed: {
    flexDirection: "row",
    padding: 5,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    position: "absolute",
    bottom: 63,
    left: 0,
    right: 0,
    zIndex: 100,
  },

  input: {
    flex: 1,
    backgroundColor: "#efefef",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sendBtn: {
    marginLeft: 8,
    backgroundColor: "#0095f6",
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});
