import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { uploadImageToCloudinary } from "../../lib/cloudinary";
import { db } from "../../lib/firebase"; // <-- Firebase config của bạn

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🔹 Pick image
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // 🔹 Upload image then save post to Firestore
  const publishPost = async () => {
    if (!image) {
      Alert.alert("Please select an image.");
      return;
    }

    setUploading(true);

    try {
      const mediaUrl = await uploadImageToCloudinary({ uri: image, fileName: 'post-photo.jpg', mimeType: 'image/jpeg' });

      // ---- (3) Save Post to Firestore ----
      await addDoc(collection(db, "posts"), {
        caption,
        commentsCount: 0,
        likesCount: 0,
        creation: serverTimestamp(),
        mediaUrl,
        userId: "NGP2F3Qu7MeafNbfrFl4qGW1LCs1", // TODO: lấy user login
      });

      Alert.alert("Post published!");
      setCaption("");
      setImage(null);

    } catch (error) {
      Alert.alert("Error", String(error));
    }

    setUploading(false);
  };

  return (
    <View style={{ padding: 16, backgroundColor: "white", flex: 1 }}>
      {/* Pick Image */}
      <Pressable
        onPress={pickImage}
        style={{ backgroundColor: "#3b82f6", padding: 12, borderRadius: 8, justifyContent: "center", alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "600"}}>Pick Image</Text>
      </Pressable>

      {/* Preview */}
      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: "100%",
            height: 300,
            marginTop: 14,
            borderRadius: 10,
            backgroundColor: "#ddd",
          }}
        />
      )}

      {/* Caption */}
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="Say something..."
        style={{
          backgroundColor: "#f1f1f1",
          padding: 10,
          marginTop: 14,
          borderRadius: 8,
        }}
      />

      {/* Share */}
      <Pressable
        onPress={publishPost}
        style={{
          marginTop: 20,
          backgroundColor: "#3b82f6",
          padding: 14,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Share</Text>
      </Pressable>

      {uploading && (
        <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />
      )}
    </View>
  );
}
