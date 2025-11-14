import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { sendPasswordReset } from '../../redux/authSlice';
import type { AppDispatch, RootState } from '../../redux/store';

export default function ForgotPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((s: RootState) => s.auth);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setSent(false);
    try {
      await dispatch(sendPasswordReset({ email })).unwrap();
      setSent(true);
    } catch (e) {
      // error will be populated in Redux state; no-op here
    }
  };

  useEffect(() => {
    // optional: if user is already signed in, go home
    // leaving as-is
  }, []);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.desc}>Enter the email for your account and we'll send a password reset link.</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <Pressable style={[styles.button, (loading || !email) && styles.buttonDisabled]} onPress={handleSend} disabled={loading || !email}>
          <Text style={styles.buttonText}>{loading ? 'Sending...' : 'Send reset email'}</Text>
        </Pressable>

        {sent && <Text style={styles.success}>Check your email for the password reset link.</Text>}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Remembered your password? </Text>
          <Link href="/auth/login" asChild>
            <Pressable>
              <Text style={styles.login}>Log in.</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#fff', paddingBottom: 80 },
  inner: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 14, color: '#444', marginBottom: 12 },
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
  success: { color: 'green', marginTop: 10 },
  error: { color: 'red', marginTop: 10 },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 16 },
  bottomText: { color: '#444' },
  login: { color: '#0095f6', fontWeight: '700' },
});
