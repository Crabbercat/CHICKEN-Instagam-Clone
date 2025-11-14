import React, { useState } from "react";
import {
  Text,
  View,
  Image,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// Convert blob to Base64 DataURI
const blobToDataURI = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.onloadend = () => {
      const result = reader.result as string | null;
      if (!result) reject(new Error("Cannot convert blob"));
      else resolve(result); // data:<mime>;base64,AAA...
    };
    reader.readAsDataURL(blob);
  });

export default function CreatePost(): React.ReactElement {
  const [caption, setCaption] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission to access gallery is required!");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log("Picked URI:", uri);
      setImage(uri);
    }
  };

  // Upload to Cloudinary (auto handles blob:// & file://)
  const uploadToCloudinary = async () => {
    if (!image) return;
    setUploading(true);

    try {
      let fileToUpload: string | Blob = image;

      // If it's a blob:// URI => convert to base64
      if (image.startsWith("blob:")) {
        console.log("Converting blob → base64...");
        const resp = await fetch(image);
        const blob = await resp.blob();
        fileToUpload = await blobToDataURI(blob); // yields base64 dataURI
      }

      const data = new FormData();

      if (typeof fileToUpload === "string" && fileToUpload.startsWith("data:")) {
        // Base64 mode
        data.append("file", fileToUpload as any);
      } else {
        // file:/// mode (native android / ios)
        data.append("file", {
          uri: image,
          name: "photo.jpg",
          type: "image/jpeg",
        } as any);
      }

      data.append("upload_preset", "instagram_upload");
      data.append("cloud_name", "dcf0q6azv");

      const res = await fetch(
        "https://api.cloudinary.com/v1_1/dcf0q6azv/image/upload",
        {
          method: "POST",
          body: data,
        }
      );

      const result = await res.json();
      console.log("Upload result:", result);

      if (result.secure_url) {
        setUploadedUrl(result.secure_url);
      } else {
        console.log("Cloudinary error: ", result);
      }
    } catch (error) {
      console.log("Upload error:", error);
    }

    setUploading(false);
  };

  return (
    <View style={{ padding: 12, alignItems: "center", flex: 1 }}>
      {/* Pick Image Button */}
      <Pressable
        onPress={pickImage}
        style={{
          backgroundColor: "#3b82f6",
          width: "100%",
          padding: 12,
          alignItems: "center",
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Pick Image</Text>
      </Pressable>

      {/* Selected Image */}
      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: 200,
            height: 280,
            borderRadius: 10,
            backgroundColor: "#ddd",
            marginBottom: 16,
          }}
        />
      )}

      {/* Caption */}
      <TextInput
        value={caption}
        onChangeText={setCaption}
        placeholder="What is on your mind?"
        style={{ width: "100%", padding: 10 }}
      />

      {/* Upload Button */}
      <Pressable
        onPress={uploadToCloudinary}
        style={{
          backgroundColor: "#3b82f6",
          width: "100%",
          padding: 12,
          alignItems: "center",
          borderRadius: 8,
          marginTop: 12,
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Share</Text>
      </Pressable>

      {/* Loading */}
      {uploading && (
        <ActivityIndicator
          size="large"
          color="blue"
          style={{ marginTop: 20 }}
        />
      )}

    </View>
  );
}
