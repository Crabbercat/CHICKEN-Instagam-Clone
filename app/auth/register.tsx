import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../../redux/authSlice';
import type { AppDispatch, RootState } from '../../redux/store';
// Firebase direct calls are handled inside Redux thunks (registerUser).

export default function RegisterPage(): React.ReactElement {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading, error } = useSelector((s: RootState) => s.auth);

  const isDisabled = !(email && phone && username && password);

  const handleRegister = () => {
    dispatch(registerUser({
      email: email.trim(),
      phone: phone.trim(),
      password,
      username: username.trim(),
      fullName: fullName.trim() || undefined,
    }));
  };

  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Instagram</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor="#999"
        />

        <TextInput
          style={styles.input}
          placeholder="Phone number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
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

        <Pressable
          style={[styles.button, (isDisabled || loading) && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isDisabled || loading}
        >
          <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Register'}</Text>
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
  container: { padding: 24, alignItems: 'stretch', paddingBottom: 80 },
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
