import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import MainTabNavigator from './src/screens/MainTabNavigator';
import CreateAlarmScreen from './src/screens/CreateAlarmScreen';
import RingingScreen from './src/screens/RingingScreen';

// Import Admin and Coach Screens!
import AdminScreen from './src/screens/AdminScreen';
import CoachScreen from './src/screens/CoachScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
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