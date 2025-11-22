const CLOUDINARY_UPLOAD_PRESET = 'instagram_upload';
const CLOUDINARY_CLOUD_NAME = 'dcf0q6azv';
const CLOUDINARY_ENDPOINT = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const blobToDataURI = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Cannot read blob'));
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

async function prepareUploadFile(uri: string, fileName = 'photo.jpg', mimeType = 'image/jpeg'): Promise<any> {
  if (uri.startsWith('blob:')) {
    const resp = await fetch(uri);
    const blob = await resp.blob();
    return blobToDataURI(blob);
  }
  return { uri, name: fileName, type: mimeType } as any;
}

export type UploadImageOptions = {
  uri: string;
  fileName?: string;
  mimeType?: string;
  uploadPreset?: string;
  cloudName?: string;
};

export async function uploadImageToCloudinary(options: UploadImageOptions): Promise<string> {
  const { uri, fileName, mimeType, uploadPreset = CLOUDINARY_UPLOAD_PRESET, cloudName = CLOUDINARY_CLOUD_NAME } = options;
  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const file = await prepareUploadFile(uri, fileName, mimeType);
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', uploadPreset);
  form.append('cloud_name', cloudName);

  const res = await fetch(endpoint, {
    method: 'POST',
    body: form,
  });

  const json = await res.json();
  if (!res.ok || !json.secure_url) {
    throw new Error(json?.error?.message ?? 'Upload failed');
  }
  return json.secure_url as string;
}
