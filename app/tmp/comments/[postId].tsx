import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { auth, db } from "../../../lib/firebase";
import { addComment } from "../interation/comment";

type Comment = {
  id: string;
  userId: string;
  content: string;
  creation: any;
};

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();
  const router = useRouter();

  const sheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["100%", "95%"], []);

  const [comments, setComments] = useState<Comment[]>([]);
  const [users, setUsers] = useState<any>({});
  const [comment, setComment] = useState("");

  // Load comments
  useEffect(() => {
    const q = query(
      collection(db, "posts", String(postId), "comments"),
      orderBy("creation", "asc")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list: Comment[] = [];
      const userCache: any = { ...users };

      for (const d of snap.docs) {
        const data = d.data() as any;

        if (!userCache[data.userId]) {
          const uref = doc(db, "users", data.userId);
          const usnap = await getDoc(uref);
          if (usnap.exists()) userCache[data.userId] = usnap.data();
        }

        list.push({
          id: d.id,
          userId: data.userId,
          content: data.content,
          creation: data.creation,
        });
      }

      setUsers(userCache);
      setComments(list);
    });

    return () => unsub();
  }, [postId]);

  // Submit comment
  const submitComment = async () => {
    if (!comment.trim()) return;

    await addComment(String(postId), {
      userId: auth.currentUser?.uid ?? "",
      content: comment.trim(),
      creation: new Date(),
    });

    setComment("");
  };

  const renderComment = ({ item }: { item: Comment }) => {
    const user = users[item.userId];

    return (
      <View style={styles.commentRow}>
        <Image
          source={{ uri: user?.image || "https://placekitten.com/100" }}
          style={styles.avatar}
        />

        <View style={{ flex: 1 }}>
          <Text style={styles.username}>{user?.username || "Unknown"}</Text>
          <Text>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Vuốt xuống để đóng sheet */}
      <Pressable
        onPress={() => router.back()}
        style={{ flex: 1, backgroundColor: "#fff" }}
      />

      <BottomSheet
        ref={sheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={() => router.back()}
      >
        <View style={styles.header}>
          <Text style={styles.headerText}>Bình luận</Text>
        </View>

        <BottomSheetScrollView style={{ paddingHorizontal: 16 }}>
          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            scrollEnabled={false}
          />
        </BottomSheetScrollView>

        {/* Input comment */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Thêm bình luận..."
            value={comment}
            onChangeText={setComment}
            style={styles.input}
          />

          <Pressable style={styles.sendBtn} onPress={submitComment}>
            <Text style={{ color: "white", fontWeight: "700" }}>Gửi</Text>
          </Pressable>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: 10,
    alignItems: "center",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "700",
  },
  commentRow: {
    flexDirection: "row",
    paddingVertical: 10,
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  username: {
    fontWeight: "700",
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  input: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f1f1f1",
    borderRadius: 20,
    paddingHorizontal: 14,
  },
  sendBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
    borderRadius: 18,
  },
});
