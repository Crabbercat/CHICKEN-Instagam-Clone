import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function UserProfile(): React.ReactElement {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      <View style={{ height: 12 }} />
      <Text style={styles.subtitle}>This is the new user feature area. Build your profile UI here.</Text>

      <View style={{ height: 24 }} />
      <Pressable style={styles.button} onPress={() => router.push('/')}> 
        <Text style={styles.buttonText}>Back Home</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center', paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, color: '#444', textAlign: 'center', marginHorizontal: 12 },
  button: { backgroundColor: '#0095f6', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '700' },
});
