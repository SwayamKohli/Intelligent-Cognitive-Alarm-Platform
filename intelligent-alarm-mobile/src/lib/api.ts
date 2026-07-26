import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

function resolveBaseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiBaseUrl;
  if (configured) return configured;

  // Fallback defaults if app.json isn't configured yet
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000'; // Android emulator loopback to host machine
  }
  return 'http://localhost:8000'; // iOS simulator
}

const BASE_URL = resolveBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from SecureStore:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;