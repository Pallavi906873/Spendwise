import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { login, register } from '../api';

export default function HomeScreen() {
  const router = useRouter();

  const [isRegistering, setIsRegistering] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('test@spendwise.com');
  const [password, setPassword] = useState('123456');

  const [loading, setLoading] = useState(false);

  // ==================== LOGIN ====================

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing Details',
        'Please enter email and password.'
      );
      return;
    }

    try {
      setLoading(true);

      const result = await login(
        email.trim(),
        password
      );

      console.log('LOGIN SUCCESS:', result);

      router.replace({
        pathname: '/dashboard',
        params: {
          token: result.token,
        },
      });

    } catch (error: any) {
      console.error('LOGIN ERROR:', error);

      Alert.alert(
        'Login Failed',
        error.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==================== REGISTER ====================

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert(
        'Missing Name',
        'Please enter your name.'
      );
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        'Missing Email',
        'Please enter your email.'
      );
      return;
    }

    if (!password) {
      Alert.alert(
        'Missing Password',
        'Please enter a password.'
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters.'
      );
      return;
    }

    try {
      setLoading(true);

      const result = await register(
        email.trim(),
        password,
        name.trim()
      );

      console.log('REGISTER SUCCESS:', result);

      Alert.alert(
        'Registration Successful',
        'Your account has been created. Please login.',
        [
          {
            text: 'OK',
            onPress: () => {
              setIsRegistering(false);
              setName('');
              setPassword('');
            },
          },
        ]
      );

    } catch (error: any) {
      console.error('REGISTER ERROR:', error);

      Alert.alert(
        'Registration Failed',
        error.message || 'Something went wrong'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      {/* ================= LOGO ================= */}

      <Text style={styles.logo}>
        SpendWise
      </Text>

      <Text style={styles.subtitle}>
        Manage your expenses wisely
      </Text>

      {/* ================= CARD ================= */}

      <View style={styles.card}>

        <Text style={styles.welcome}>
          {isRegistering
            ? 'Create Account'
            : 'Welcome Back'}
        </Text>

        <Text style={styles.description}>
          {isRegistering
            ? 'Create your SpendWise account'
            : 'Login to manage your expenses'}
        </Text>

        {/* ================= NAME ================= */}

        {isRegistering && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        {/* ================= EMAIL ================= */}

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* ================= PASSWORD ================= */}

        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* ================= MAIN BUTTON ================= */}

        <Pressable
          style={[
            styles.button,
            loading && styles.disabledButton,
          ]}
          onPress={
            isRegistering
              ? handleRegister
              : handleLogin
          }
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>
              {isRegistering
                ? 'Create Account'
                : 'Login'}
            </Text>
          )}
        </Pressable>

        {/* ================= SWITCH LOGIN / SIGN UP ================= */}

        <View style={styles.switchRow}>

          <Text style={styles.switchText}>
            {isRegistering
              ? 'Already have an account?'
              : "Don't have an account?"}
          </Text>

          <Pressable
            onPress={() => {
              setIsRegistering(!isRegistering);
            }}
          >
            <Text style={styles.switchButton}>
              {isRegistering
                ? ' Login'
                : ' Sign Up'}
            </Text>
          </Pressable>

        </View>

      </View>

      {/* ================= FOOTER ================= */}

      <Text style={styles.footer}>
        © 2026 SpendWise
      </Text>

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  logo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 15,
    color: '#64748b',
    marginBottom: 30,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,

    elevation: 5,
  },

  welcome: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },

  description: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 22,
  },

  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 14,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },

  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 3,
  },

  disabledButton: {
    opacity: 0.7,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },

  switchText: {
    color: '#64748b',
    fontSize: 14,
  },

  switchButton: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: 'bold',
  },

  footer: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 25,
  },

});