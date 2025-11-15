import { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { db, auth } from "../../firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, doc} from "firebase/firestore";

//test

type Message = {
  id: string;
  text: string;
  senderId: string;
  createdAt: any;
};

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const user = auth.currentUser;

  useEffect(() => {
    const ref = collection(db, "chats", chatId as string, "messages");
    const q = query(ref, orderBy("createdAt", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const data: Message[] = snap.docs.map((d) => ({id: d.id, ...(d.data() as Omit<Message, "id">)}));
        setMessages(data);
    });

    return () => unsub();
  }, []);

  const send = async () => {
    if (!text.trim()) return;

    await addDoc(collection(db, "chats", chatId as string, "messages"), {
      text,
      senderId: user.uid,
      createdAt: serverTimestamp(),
    });

    await setDoc(
      doc(db, "chats", chatId as string),
      {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );

    setText("");
  };

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        style={{ padding: 10 }}
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.msg,
              item.senderId === user.uid ? styles.me : styles.them
            ]}
          >
            <Text>{item.text}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message..."
        />
        <TouchableOpacity style={styles.btn} onPress={send}>
          <Text style={{ color: "white" }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  msg: {
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    maxWidth: "70%"
  },
  me: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  them: { alignSelf: "flex-start", backgroundColor: "#eee" },

  inputRow: { flexDirection: "row", padding: 10 },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#ccc",
    borderRadius: 20, paddingHorizontal: 12
  },
  btn: {
    marginLeft: 10, backgroundColor: "#000",
    paddingHorizontal: 16, justifyContent: "center",
    borderRadius: 20
  }
});