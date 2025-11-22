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
import type { IdentifierErrorCode } from '../../redux/authSlice';
import { loginUser } from '../../redux/authSlice';
import type { AppDispatch, RootState } from '../../redux/store';
// Redux-based authentication now; direct Firebase calls moved into thunks.

const identifierMessages: Record<IdentifierErrorCode, string> = {
  'identifier/not-email': 'No account matches that email address.',
  'identifier/not-username': 'No account matches that username.',
  'identifier/not-phone': 'No account matches that phone number.',
  'identifier/invalid': 'Please enter a valid email, username, or phone number.',
  'identifier/unknown': 'We could not resolve that account identifier.',
};

export default function LoginPage(): React.ReactElement {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState('');

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((s: RootState) => s.auth);

  const handleLogin = () => {
    setIdentifierError('');
    dispatch(loginUser({ identifier: identifier.trim(), password }))
      .unwrap()
      .catch((err) => {
        if (typeof err === 'string' && err.startsWith('identifier/')) {
          const key = err as IdentifierErrorCode;
          setIdentifierError(identifierMessages[key] ?? identifierMessages['identifier/unknown']);
        }
      });
  };

  useEffect(() => {
    if (user) router.replace('/tmp/home');

  }, [user, router]);

  const isDisabled = !(identifier && password);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>Instagram</Text>

        <TextInput
          style={styles.input}
          placeholder="Phone number, username or email"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          placeholderTextColor="#999"
        />
        {identifierError ? <Text style={styles.fieldError}>{identifierError}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor="#999"
        />

        <Pressable
          style={[styles.button, (isDisabled || loading) && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isDisabled || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Log In'}</Text>
        </Pressable>

        {error ? <Text style={{ color: 'red', textAlign: 'center', marginTop: 8 }}>{error}</Text> : null}

        <Link href="/auth/forgot" asChild>
          <Pressable style={styles.centerLink}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </Pressable>
        </Link>

        <View style={styles.dividerRow}>
          <View style={styles.line} />
          <Text style={styles.or}>OR</Text>
          <View style={styles.line} />
        </View>

        <Link href="/" asChild>
          <Pressable>
            <Text style={styles.facebook}>Log in with Facebook</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Don't have an account? </Text>
        <Link href="/auth/register" asChild>
          <Pressable>
            <Text style={styles.signup}>Sign up.</Text>
          </Pressable>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#fff', paddingBottom: 80 },
  inner: { padding: 24 },
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
  forgot: { color: '#0095f6', textAlign: 'center', marginTop: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  line: { flex: 1, height: 1, backgroundColor: '#e6e6e6' },
  or: { marginHorizontal: 12, color: '#999', fontWeight: '600' },
  facebook: { color: '#385185', textAlign: 'center', fontWeight: '700' },
  centerLink: { alignItems: 'center' },
  bottomRow: { flexDirection: 'row', justifyContent: 'center', padding: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  bottomText: { color: '#444' },
  signup: { color: '#0095f6', fontWeight: '700' },
  fieldError: { color: '#ef4444', fontSize: 12, marginBottom: 8 },
});
