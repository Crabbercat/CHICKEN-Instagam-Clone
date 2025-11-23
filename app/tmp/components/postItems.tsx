
import { useRouter } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, GestureResponderEvent, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../../../lib/firebase";
import { toggleLike } from "../interation/like";

export default function PostItem({ post }: { post: any }) {
  const router = useRouter();
  const [user, setUser] = useState<any>({});

  const player =
    post.isVideo
      ? useVideoPlayer(post.mediaUrl, (player) => {
          player.loop = true;
        })
      : null;

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, "users", post.userId));
      if (snap.exists()) setUser(snap.data());
    };
    load();
  }, []);

  const openProfile = (event?: GestureResponderEvent) => {
    event?.stopPropagation?.();
    if (!post.userId) return;
    router.push({ pathname: '/user/profile', params: { uid: post.userId } });
  };
const confirmDelete = (postId: string) => {
  Alert.alert(
    "Xác nhận",
    "Bạn có chắc muốn xóa bài đăng này?",
    [
      {
        text: "Yes",
        style: "destructive",
        onPress: () => deletePost(postId),
      },
      { text: "Cancel", style: "cancel" }
    ]
  );
};

const deletePost = async (postId: string) => {
  await deleteDoc(doc(db, "posts", postId));
  Alert.alert("Đã xóa bài đăng!");
};

const openMenu = (post: any) => {
  Alert.alert(
    "Tùy chọn bài đăng",
    "",
    [
      {
        text: "Xóa bài đăng",
        style: "destructive",
        onPress: () => confirmDelete(post.id),
      },
      { text: "Hủy", style: "cancel" }
    ]
  );
};

  return (
    <Pressable onPress={() => router.push(`/tmp/post/${post.id}`)}>
      <View style={styles.post}>
        <View style={styles.row}>
          <Image
            source={{
              uri:
                user.image ??
                "https://i.pravatar.cc/150?img=1",
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>{user.username}</Text>
         
      
        </View>   

        {post.isVideo ? (
          <VideoView
            player={player!}
            style={{ width: "100%", height: 300, borderRadius: 10 }}
            nativeControls
          />
        ) : (
          <Image
            source={{ uri: post.mediaUrl }}
            style={{ width: "100%", height: 300, borderRadius: 10 }}
          />
        )}
        
         {/* TIME ADDED HERE */}
        <Text style={styles.time}>
          {post.creation?.seconds
            ? new Date(post.creation.seconds * 1000).toLocaleString()
            : ""}
        </Text>

        <Text style={styles.caption}>{post.caption}</Text>

        <View style={styles.row}>
          <Pressable onPress={() => toggleLike(post.id, post.userId)}>
            <Text style={styles.action}>❤️ {post.likesCount}</Text>
          </Pressable>

          <Pressable
            onPress={() =>
              router.push({
                pathname: "/tmp/comments/[postId]",
                params: { postId: post.id },
              })
            }
          >
            <Text style={styles.action}>💬 {post.commentsCount}</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  post: {
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  username: { fontSize: 16, fontWeight: "700" },
  action: { marginRight: 20, fontSize: 16, fontWeight: "600" },
  caption: { marginTop: 10, fontSize: 16 },
  time: {
  marginTop: 6,
  color: "#666",
  fontSize: 13,
},

});
