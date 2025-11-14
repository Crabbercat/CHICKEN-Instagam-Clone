import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TmpPost(): React.ReactElement {
  const params = useLocalSearchParams();
  const router = useRouter();
  const mediaUrl = typeof params?.mediaUrl === 'string' ? params.mediaUrl : '';
  const creation = typeof params?.creation === 'string' ? params.creation : '';
  const id = typeof params?.id === 'string' ? params.id : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Post Detail (tmp)</Text>
      <View style={{ height: 8 }} />
      {mediaUrl ? <Image source={{ uri: mediaUrl }} style={styles.image} /> : <View style={styles.placeholder} />}

      <View style={{ height: 12 }} />
      <Text style={styles.label}>ID:</Text>
      <Text selectable style={styles.value}>{id || '(none)'}</Text>

      <View style={{ height: 8 }} />
      <Text style={styles.label}>Media URL:</Text>
      <Text selectable style={styles.value}>{mediaUrl || '(none)'}</Text>

      <View style={{ height: 8 }} />
      <Text style={styles.label}>Creation:</Text>
      <Text selectable style={styles.value}>{creation || '(none)'}</Text>

      <View style={{ height: 16 }} />
      <Pressable style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Back</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  image: { width: '100%', height: 300, borderRadius: 8, backgroundColor: '#eee' },
  placeholder: { width: '100%', height: 300, borderRadius: 8, backgroundColor: '#ddd' },
  label: { marginTop: 6, fontWeight: '700' },
  value: { color: '#333', textAlign: 'center', marginTop: 4 },
  button: { marginTop: 16, backgroundColor: '#0095f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
