import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { uploadImageToCloudinary } from "../../lib/cloudinary";

export default function ChatSettings() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();

  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Load background hiện tại của người kia
  useEffect(() => {
    if (!chatId) return;

    (async () => {
      const chatSnap = await getDoc(doc(db, "chats", chatId));
      if (!chatSnap.exists()) return;

      const data = chatSnap.data();
      const otherId = data.participants.find((x: string) => x !== auth.currentUser?.uid);

      if (!otherId) return;

      const userSnap = await getDoc(doc(db, "users", otherId));
      if (userSnap.exists()) {
        setBackgroundUrl(userSnap.data().backgroundUrl || "");
      }
    })();
  }, [chatId]);

  // Chọn ảnh từ máy → upload Cloudinary
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.9,
    });

    if (result.canceled) return;

    const uri = result.assets[0].uri;

    setLoading(true);

    try {
      // ⬅⬅⬅ Upload theo đúng structure bạn gửi
      const uploadedUrl = await uploadImageToCloudinary({
        uri,
        fileName: "background.jpg",
        mimeType: "image/jpeg",
      });

      setBackgroundUrl(uploadedUrl);
    } catch (err) {
      console.log("Upload error:", err);
    }

    setLoading(false);
  };

  // LƯU BACKGROUND VÀO CHAT DOCUMENT
  const saveBackground = async () => {
    if (!chatId) return;

    await updateDoc(doc(db, "chats", chatId), {
      backgroundUrl: backgroundUrl,
    });

    router.back();
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Change Background</Text>
      </View>

      {/* PREVIEW */}
      <View style={styles.previewBox}>
        {backgroundUrl ? (
          <Image source={{ uri: backgroundUrl }} style={styles.previewImage} />
        ) : (
          <Text style={{ opacity: 0.5 }}>No background selected</Text>
        )}
      </View>

      {/* PICK BUTTON */}
      <TouchableOpacity style={styles.btn} onPress={pickImage}>
        <Text style={styles.btnText}>
          {loading ? "Uploading..." : "Choose Image"}
        </Text>
      </TouchableOpacity>

      {/* SAVE BUTTON */}
      <TouchableOpacity style={styles.saveBtn} onPress={saveBackground}>
        <Text style={styles.saveText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "white",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  back: {
    fontSize: 30,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  previewBox: {
    width: "100%",
    height: 220,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  btn: {
    backgroundColor: "#0a84ff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 15,
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
