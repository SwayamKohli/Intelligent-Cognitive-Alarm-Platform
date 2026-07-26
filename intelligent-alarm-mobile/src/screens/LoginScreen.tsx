import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import api from '../lib/api';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      // FastAPI OAuth2 strictly requires form-urlencoded data
      const formData = `username=${encodeURIComponent(email.trim())}&password=${encodeURIComponent(password)}`;
      
      const response = await api.post('/users/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      if (response.data.access_token) {
        await SecureStore.setItemAsync('access_token', response.data.access_token);
        
        // Check RBAC Role from Profile
        const profileRes = await api.get('/users/profile');
        const userRole = profileRes.data.role?.toLowerCase();

        if (userRole === 'admin') {
          Alert.alert("Admin Access", "Welcome to the Admin Console.");
          navigation.replace('AdminDashboard');
        } else if (userRole === 'wellness_coach') {
          Alert.alert("Coach Portal", "Welcome, Coach! Loading client rosters.");
          navigation.replace('CoachDashboard');
        } else {
          Alert.alert("Success", "Welcome back to your Cognitive Alarm!");
          navigation.replace('Dashboard');
        }
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      Alert.alert("Login Failed", "Invalid credentials or network issue. Make sure your local server is running!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Welcome Back</Text>
      
      <TextInput 
        style={styles.input} 
        placeholder="Email" 
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <TextInput 
        style={styles.input} 
        placeholder="Password" 
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && { opacity: 0.7 }]} 
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={loading}>
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#121212' },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFD700', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#1E1E1E', color: '#FFF', padding: 15, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#333', fontSize: 16 },
  button: { backgroundColor: '#FFD700', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  linkText: { color: '#FFD700', textAlign: 'center', marginTop: 25, fontSize: 14 }
});