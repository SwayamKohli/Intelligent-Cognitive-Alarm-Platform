import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainTabNavigator from './src/screens/MainTabNavigator';
import CreateAlarmScreen from './src/screens/CreateAlarmScreen';
import RingingScreen from './src/screens/RingingScreen';

// Import Admin and Coach Screens
import AdminScreen from './src/screens/AdminScreen';
import CoachScreen from './src/screens/CoachScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useNavigationContainerRef();
  const [isReady, setIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    // 1. Check for existing login session
    async function checkSession() {
      try {
        const token = await SecureStore.getItemAsync('access_token');
        if (token) {
          setInitialRoute('Dashboard');
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsReady(true);
      }
    }
    
    checkSession();

    // 2. Global Lock-Screen Interceptor
    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data && data.alarmId) {
        console.log(`[Notification Interceptor] Tapped alarm ID: ${data.alarmId}. Routing to RingingScreen...`);
        
        if (navigationRef.isReady()) {
          navigationRef.navigate('Ringing', { 
            alarmId: data.alarmId, 
            label: data.label || 'Cognitive Alarm' 
          });
        }
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, []);

  // Show a dark loading screen while checking the secure store
  if (!isReady) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        
        {/* Standard User Tabs */}
        <Stack.Screen name="Dashboard" component={MainTabNavigator} />
        
        {/* Dedicated Admin & Coach Portals */}
        <Stack.Screen name="AdminDashboard" component={AdminScreen} />
        <Stack.Screen name="CoachDashboard" component={CoachScreen} />
        
        {/* Modals */}
        <Stack.Screen name="CreateAlarm" component={CreateAlarmScreen} />
        <Stack.Screen name="Ringing" component={RingingScreen} options={{ gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}