import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Note: Replace these with your actual Firebase Project config from the Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "dummy-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dummy-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dummy-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dummy-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "dummy-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "dummy-app-id"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Replace VAPID_KEY with your Web Push certificate key from Firebase Settings > Cloud Messaging
      const token = await getToken(messaging, { 
          vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "dummy-vapid-key" 
      });
      return token;
    } else {
      console.warn("Notification permission denied by user.");
      return null;
    }
  } catch (error) {
    console.error("Error requesting Firebase notification permission:", error);
    return null;
  }
};