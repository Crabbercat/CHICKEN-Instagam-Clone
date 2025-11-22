
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useRouter } from "expo-router";
import { Platform } from "react-native";
import { VideoView, useVideoPlayer} from "expo-video";


// Convert blob → base64 URI
const blobToDataURI = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject("Cannot read blob");
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

export default function CreatePost() {
  const [caption, setCaption] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  // Always call hook (Rules of Hooks)
  const player = useVideoPlayer(null, (player) => {
    player.loop = true;
  });

  // Whenever video is selected → update player
  useEffect(() => {
    if (mediaType === "video" && mediaUri) {
      player.replace(mediaUri);
    }
  }, [mediaType, mediaUri]);

  // Pick image or video
  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission required!");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 1,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      setMediaUri(file.uri);
      setMediaType(file.type === "video" ? "video" : "image");
    }
  };

  // Upload to Cloudinary
  const uploadToCloudinary = async () => {
    let fileToUpload: any = mediaUri;

    // If blob: convert to base64
    if (mediaUri!.startsWith("blob:")) {
      const resp = await fetch(mediaUri!);
      const blob = await resp.blob();
      fileToUpload = await blobToDataURI(blob);
    } else {
      fileToUpload = {
        uri: mediaUri!,
        name: mediaType === "video" ? "video.mp4" : "photo.jpg",
        type: mediaType === "video" ? "video/mp4" : "image/jpeg",
      } as any;
    }

    const form = new FormData();
    form.append("file", fileToUpload);
    form.append("upload_preset", "instagram_upload");

    const endpoint =
      mediaType === "video"
        ? "https://api.cloudinary.com/v1_1/dcf0q6azv/video/upload"
        : "https://api.cloudinary.com/v1_1/dcf0q6azv/image/upload";

    const res = await fetch(endpoint, { method: "POST", body: form });
    return await res.json();
  };

  // Create post
  const publishPost = async () => {
    if (!mediaUri) return Alert.alert("Please select media.");

    setUploading(true);

    try {
      const result = await uploadToCloudinary();

      if (!result.secure_url) throw new Error("Upload failed");
      await addDoc(collection(db, "posts"), {
        caption,
        mediaUrl: result.secure_url,
        isVideo: mediaType === "video",
        commentsCount: 0,
        likesCount: 0,
        creation: serverTimestamp(),
        userId: auth.currentUser?.uid,
      });

      Alert.alert("Post published!");
      setCaption("");
      setMediaUri(null);
      setMediaType(null);
      router.replace("/tmp/home");
    } catch (e) {
      Alert.alert("Error", String(e));
    }

    setUploading(false);
  };

  return (
    <View style={{ padding: 16, backgroundColor: "white", flex: 1 }}>

      {/* Preview Media */}
      {mediaUri && (
        mediaType === "video" ? (
          <VideoView
            player={player}
            style={{
              width: "100%",
              height: 300,
              marginTop: 14,
              borderRadius: 10,
              backgroundColor: "#ddd",
            }}
            nativeControls
          />
        ) : (
          <Image
            source={{ uri: mediaUri }}
            style={{
              width: "100%",
              height: 300,
              marginTop: 14,
              borderRadius: 10,
              backgroundColor: "#ddd",
            }}
          />
        )
      )}

      {/* Caption input */}
      {mediaUri && (
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
      )}

      {/* Buttons row */}
      <View style={{ flexDirection: "row", marginTop: 20, gap: 12 }}>

        <Pressable
          onPress={pickMedia}
          style={{
            flex: 1,
            backgroundColor: "#3b82f6",
            padding: 12,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Pick Media</Text>
        </Pressable>

        <Pressable
          onPress={publishPost}
          style={{
            flex: 1,
            backgroundColor: "#3b82f6",
            padding: 12,
            borderRadius: 8,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Share</Text>
        </Pressable>
      </View>

      {uploading && (
        <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />
      )}
    </View>
  );
}
