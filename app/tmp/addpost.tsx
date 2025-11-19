import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";   // <-- Firebase config của bạn

// Helper convert blob → data URI (base64)
const blobToDataURI = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject("Cannot read blob");
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

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
      // ---- (1) Convert URI to base64 if needed ----
      let fileToUpload: any = image;

      if (image.startsWith("blob:")) {
        const resp = await fetch(image);
        const blob = await resp.blob();
        fileToUpload = await blobToDataURI(blob);
      } else {
        fileToUpload = {
          uri: image,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any;
      }

      // ---- (2) Upload to Cloudinary ----
      const form = new FormData();
      form.append("file", fileToUpload);
      form.append("upload_preset", "instagram_upload");
      form.append("cloud_name", "dcf0q6azv");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcf0q6azv/image/upload",
        {
          method: "POST",
          body: form,
        }
      );

      const result = await res.json();

      if (!result.secure_url) {
        throw new Error("Upload failed");
      }

      const mediaUrl = result.secure_url;

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
