import { View, Text, TextInput, FlatList, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { addComment } from "../interation/comment";

type Comment = {
  id: string;
  userId: string;
  content: string;
  creation: any;
};

export default function CommentsScreen() {
  const { postId } = useLocalSearchParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "posts", String(postId), "comments"),
      orderBy("creation", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Comment[] = [];

      snap.forEach((doc) =>
        list.push({
          id: doc.id,
          ...(doc.data() as Omit<Comment, "id">),
        })
      );

      setComments(list);
    });

    return unsub;
  }, [postId]);

  const submitComment = async () => {
    if (!comment.trim()) return;

    await addComment(String(postId), {
      userId: "NGP2F3Qu7MeafNbfrFl4qGW1LCs1",
      content: comment.trim(),
      creation: new Date(),
    });

    setComment("");
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontWeight: "700" }}>{item.userId}</Text>
            <Text>{item.content}</Text>
          </View>
        )}
      />

      <View style={{ flexDirection: "row", marginTop: "auto" }}>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Write a comment..."
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 8,
            borderRadius: 8,
          }}
        />

        <Pressable
          onPress={submitComment}
          style={{
            marginLeft: 10,
            padding: 12,
            backgroundColor: "#3b82f6",
            borderRadius: 8,
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white" }}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}
