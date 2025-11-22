import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import type { AppDispatch, RootState } from '../../redux/store';
import { updateUserProfile } from '../../redux/userSlice';

export default function EditProfile(): React.ReactElement {
  const params = useLocalSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const authUser = useSelector((s: RootState) => s.auth.user);
  const userProfile = useSelector((s: RootState) => s.user.profile);
  const loading = useSelector((s: RootState) => s.user.loading);
  const error = useSelector((s: RootState) => s.user.error);

  const uid = typeof params?.uid === 'string' ? params.uid : authUser?.uid;

  const [name, setName] = useState(userProfile?.name ?? '');
  const [bio, setBio] = useState(userProfile?.bio ?? '');
  const [image, setImage] = useState(userProfile?.image ?? '');
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    // If profile updated elsewhere, keep inputs in sync
    setName(userProfile?.name ?? '');
    setBio(userProfile?.bio ?? '');
    setImage(userProfile?.image ?? '');
  }, [userProfile]);

  const handleSave = async () => {
    if (!uid || avatarUploading) return;
    setSaving(true);
    try {
      await dispatch(updateUserProfile({ uid, data: { name: name || '', bio: bio || '', image: image || '' } })).unwrap();
      // navigate back to profile
      router.replace(`/user/profile?uid=${uid}`);
    } catch (e) {
      // error stored in redux; we can also show it here
      console.warn('update failed', e);
    } finally {
      setSaving(false);
    }
  };

  const pickAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Media permission is required to select a photo.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri) return;
      setAvatarUploading(true);
      const uploadedUrl = await uploadImageToCloudinary({
        uri: asset.uri,
        fileName: 'avatar.jpg',
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
      setImage(uploadedUrl);
    } catch (err: any) {
      Alert.alert('Upload failed', err?.message ?? 'Unable to upload photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  if (!uid) {
    return (
      <View style={styles.center}>
        <Text>No user specified</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      <View style={styles.avatarRow}>
        <Image source={{ uri: image || 'https://via.placeholder.com/120' }} style={styles.avatar} />
        <Pressable style={styles.avatarButton} onPress={pickAvatar} disabled={avatarUploading || loading}>
          {avatarUploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.avatarButtonText}>Change Photo</Text>}
        </Pressable>
      </View>

      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" />

      <Text style={styles.label}>Bio</Text>
      <TextInput style={[styles.input, { height: 80 }]} value={bio} onChangeText={setBio} placeholder="Bio" multiline />  

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, (saving || loading || avatarUploading) && styles.buttonDisabled]} onPress={handleSave} disabled={saving || loading || avatarUploading}>
        {saving || loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
      </Pressable>

      <View style={{ height: 12 }} />
      <Pressable onPress={() => router.back()}>
        <Text style={styles.cancel}>Cancel</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  label: { fontSize: 13, color: '#444', marginTop: 12 },
  input: { height: 44, borderColor: '#ddd', borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, marginTop: 6 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginRight: 12, backgroundColor: '#eee' },
  avatarButton: { backgroundColor: '#0095f6', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  avatarButtonText: { color: '#fff', fontWeight: '700' },
  helperText: { fontSize: 12, color: '#555', marginTop: 6 },
  button: { marginTop: 16, backgroundColor: '#0095f6', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#9bd3ff' },
  buttonText: { color: '#fff', fontWeight: '700' },
  cancel: { color: '#007AFF', textAlign: 'center' },
  error: { color: 'red', marginTop: 8 },
});
