import { Link, useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getAuthInstance } from '../../lib/firebase';

export default function RegisterPage(): React.ReactElement {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = !(emailOrPhone && username && password);

  const handleSignUp = async () => {
    setError(null);
    setLoading(true);
    try {
      const auth = getAuthInstance();
      // For simplicity we use emailOrPhone as email; if it's a phone you'd use phone auth flow.
      const userCred = await createUserWithEmailAndPassword(auth, emailOrPhone.trim(), password);
      // Optionally set displayName to username or fullName
      if (userCred.user) {
        await updateProfile(userCred.user, { displayName: username || fullName || undefined });
      }
      router.replace('/');
    } catch (e: any) {
      console.warn('signup error', e);
      setError(e?.message ?? 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Instagram</Text>

        <TextInput
          style={styles.input}
          placeholder="Mobile number or email"
          value={emailOrPhone}
          onChangeText={setEmailOrPhone}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Full name (optional)"
          value={fullName}
          onChangeText={setFullName}
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <Pressable style={[styles.button, (isDisabled || loading) && styles.buttonDisabled]} onPress={handleSignUp} disabled={isDisabled || loading}>
          <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Sign up'}</Text>
        </Pressable>

        {error ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{error}</Text> : null}

        <View style={styles.terms}>
          <Text style={styles.termsText}>By signing up, you agree to our Terms & Privacy Policy.</Text>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Have an account? </Text>
          <Link href="/auth/login" asChild>
            <Pressable>
              <Text style={styles.login}>Log in.</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24, alignItems: 'stretch' },
  logo: { fontSize: 40, fontWeight: '700', textAlign: 'center', marginBottom: 24 },
  input: {
    height: 44,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    height: 44,
    backgroundColor: '#0095f6',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#9bd3ff' },
  buttonText: { color: 'white', fontWeight: '700' },
  terms: { marginTop: 12, paddingHorizontal: 6 },
  termsText: { fontSize: 12, color: '#666', textAlign: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 16 },
  bottomText: { color: '#444' },
  login: { color: '#0095f6', fontWeight: '700' },
});
