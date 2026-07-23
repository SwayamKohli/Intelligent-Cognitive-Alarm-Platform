import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Use 10.0.2.2 for Android Emulator, localhost for iOS Simulator
const BASE_URL = "http://192.168.1.10:8000";
// const BASE_URL = "http://10.196.126.173:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token into every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token from SecureStore:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;