import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';
import AuthLayout from '../components/AuthLayout';
import AuthInput from '../components/AuthInput';
import { colors, radius, spacing, typography } from '../theme';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const formData = `username=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password)}`;
      const response = await api.post('/users/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      if (response.data.access_token) {
        await SecureStore.setItemAsync('access_token', response.data.access_token);

        const profileRes = await api.get('/users/profile');
        const userRole = profileRes.data.role?.toLowerCase();

        if (userRole === 'admin') {
          navigation.replace('AdminDashboard');
        } else if (userRole === 'wellness_coach') {
          navigation.replace('CoachDashboard');
        } else {
          navigation.replace('Dashboard');
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMsg('Invalid credentials or the server is unreachable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Sign in to your Cognitive Alarm Platform</Text>

      <View style={styles.card}>
        <AuthInput
          icon={<Mail color={colors.textDim} size={18} />}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <AuthInput
          icon={<Lock color={colors.textDim} size={18} />}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

        <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={[colors.accent, colors.accentDeep]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, loading && { opacity: 0.7 }]}
          >
            {loading ? (
              <ActivityIndicator color="#0A0A0B" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
          <Text style={styles.linkText}>
            Don't have an account? <Text style={styles.linkAccent}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h1, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { ...typography.caption, textAlign: 'center', marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  button: {
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  buttonText: { color: '#0A0A0B', fontWeight: '700', fontSize: 15 },
  linkText: { color: colors.textDim, textAlign: 'center', marginTop: spacing.lg, fontSize: 13 },
  linkAccent: { color: colors.accent, fontWeight: '600' },
  error: {
    color: colors.ember,
    backgroundColor: colors.emberBg,
    borderRadius: radius.sm,
    padding: 10,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
});