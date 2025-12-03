import { View, Text, Image, StyleSheet, Pressable, ScrollView } from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { VideoView, useVideoPlayer } from "expo-video";
import { toggleLike } from "../interation/like";
import { parseTime } from "../../../lib/parseTime";

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [post, setPost] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [userCache, setUserCache] = useState<any>({});

  // 🔥 KHỞI TẠO PLAYER MỘT LẦN – TRÁNH LỖI
  const player = useVideoPlayer(null, () => {
    // callback khi video load xong
  });

  // ---------------------- LOAD POST ----------------------
  useEffect(() => {
    const loadPost = async () => {
      const ref = doc(db, "posts", String(id));
      const snap = await getDoc(ref);

      if (!snap.exists()) return;

      const p = snap.data();
      setPost(p);

      // load user
      const u = await getDoc(doc(db, "users", p.userId));
      if (u.exists()) setUser(u.data());

      // setup video
      if (p.isVideo && p.mediaUrl) {
        setTimeout(() => {
          player.replace(p.mediaUrl); // tránh conflict
          player.loop = true;
        }, 100); // Delay nhỏ giúp tránh AbortError
      }
    };

    loadPost();
  }, [id]);

  // ---------------------- LOAD COMMENTS ----------------------
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "posts", String(id), "comments"),
      orderBy("creation")
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list: any[] = [];
      const cache = { ...userCache };

      for (const d of snap.docs) {
        const data = d.data();

        // lấy user nếu chưa có
        if (!cache[data.userId]) {
          const u = await getDoc(doc(db, "users", data.userId));
          if (u.exists()) cache[data.userId] = u.data();
        }

        list.push({
          id: d.id,
          ...data,
        });
      }

      setUserCache(cache);
      setComments(list);
    });

    return () => unsub();
  }, [id]);

  if (!post || !user) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.container}>

      {/* 🔙 BACK BUTTON — nằm riêng một dòng */}
      <View style={{ marginBottom: 10 }}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ fontSize: 26 }}>←</Text>
        </Pressable>
      </View>

      {/* HEADER USER */}
      <View style={styles.row}>
        <Image
        source={{
          uri: user?.image || "https://i.pravatar.cc/150?img=1",
        }}
        style={styles.avatar}
      />
        <Text style={styles.username}>{user.username}</Text>
      </View>

      {/* MEDIA */}
      {post.isVideo ? (
        <VideoView
          style={styles.media}
          player={player}
          nativeControls
        />
      ) : (
        <Image
      source={{
        uri: post.mediaUrl,
      }}
      style={styles.media}
    />
      )}

      {/* TIME */}
      <Text style={styles.time}>
          {parseTime(post.creation).toLocaleString()}
      </Text>
      
      {/* CAPTION */}
      <Text style={styles.caption}>{post.caption}</Text>

      {/* ACTION */}
      <View style={styles.actions}>
        <Pressable onPress={() => toggleLike(String(id), post.userId)}>
          <Text style={styles.actionBtn}>❤️ {post.likesCount}</Text>
        </Pressable>

        <Pressable>
          <Text style={styles.actionBtn}>💬 {comments.length}</Text>
        </Pressable>
      </View>

      {/* COMMENTS */}
      <Text style={styles.commentTitle}>Bình luận</Text>

      {comments.map((c) => {
        const u = userCache[c.userId];

        return (
          <View key={c.id} style={styles.commentBox}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: u?.image || "https://placekitten.com/200" }}
                style={styles.commentAvatar}
              />
              <Text style={styles.commentUser}>{u?.username || "User"}</Text>
            </View>
            <Text style={{ marginTop: 5 }}>{c.content}</Text>
          </View>
        );
      })}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 12 },

  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22, marginRight: 10 },
  username: { fontSize: 18, fontWeight: "700" },

  media: { width: "100%", height: 300, borderRadius: 10, backgroundColor: "#000" },

  time: { marginTop: 6, fontSize: 13, color: "#666" },

  caption: { marginTop: 12, fontSize: 18 },
  actions: { flexDirection: "row", marginTop: 10 },
  actionBtn: { marginRight: 20, fontSize: 18 },

  commentTitle: { marginTop: 20, fontSize: 20, fontWeight: "700" },

  commentBox: {
    backgroundColor: "#f4f4f4",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  commentAvatar: { width: 35, height: 35, borderRadius: 18, marginRight: 10 },
  commentUser: { fontWeight: "700" },
});
