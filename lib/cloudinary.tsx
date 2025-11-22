export const uploadToCloudinary = async (imageUri: string): Promise<string | null> => {
  const data = new FormData();

  data.append("file", {
    uri: imageUri,
    type: "image/jpeg",
    name: "photo.jpg"
  } as any);

  data.append("upload_preset", "instagram_upload");

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/dcf0q6azv/image/upload", {
      method: "POST",
      body: data,
    });

    const result = await res.json();
    console.log("Cloudinary Response:", result);

    if (result.secure_url) {
      return result.secure_url;
    } else {
      console.log("Cloudinary Error:", result);
      return null;
    }
  } catch (err) {
    console.log("Upload error:", err);
    return null;
  }
};
