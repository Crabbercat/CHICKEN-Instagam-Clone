import { useLocalSearchParams, useRouter } from "expo-router";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
} from "react-native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useState } from "react";

export default function ChatSettings() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const router = useRouter();

  const backgrounds = [
    "https://i.imgur.com/UY7cN6F.jpeg",
    "https://i.imgur.com/afFC0y1.jpeg",
    "https://i.imgur.com/Ko3E9Sj.jpeg",
    "https://i.imgur.com/7yUvePI.png",
  ];

  const [customUrl, setCustomUrl] = useState("");

  const saveBackground = async (url: string) => {
    await updateDoc(doc(db, "chats", chatId), {
      backgroundUrl: url,
    });
    router.back(); // Quay lại chat ngay
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customize Chat</Text>

      {/* SECTION: QUICK BACKGROUND */}
      <Text style={styles.sub}>Choose Background</Text>

      <View style={styles.bgList}>
        {backgrounds.map((bg) => (
          <TouchableOpacity
            key={bg}
            onPress={() => saveBackground(bg)}
            style={styles.bgItem}
          >
            <Image source={{ uri: bg }} style={styles.bgImage} />
          </TouchableOpacity>
        ))}
      </View>

      {/* SECTION: CUSTOM URL */}
      <Text style={[styles.sub, { marginTop: 25 }]}>Custom Background URL</Text>

      <TextInput
        value={customUrl}
        onChangeText={setCustomUrl}
        placeholder="Enter image URL..."
        style={styles.input}
      />

      <TouchableOpacity
        style={[styles.saveBtn, { opacity: customUrl ? 1 : 0.5 }]}
        disabled={!customUrl}
        onPress={() => saveBackground(customUrl)}
      >
        <Text style={{ color: "#fff", fontWeight: "700" }}>Save</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "white" },

  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },

  sub: { fontSize: 18, fontWeight: "600", marginBottom: 12 },

  bgList: { flexDirection: "row", flexWrap: "wrap", gap: 12 },

  bgItem: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: "hidden",
  },
  bgImage: {
    width: "100%",
    height: "100%",
  },

  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  saveBtn: {
    backgroundColor: "#0095f6",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
});
