import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { AlarmClock, BarChart3, User } from "lucide-react-native";
import DashboardScreen from "./DashboardScreen";
import AnalyticsScreen from "./AnalyticsScreen";
import ProfileScreen from "./ProfileScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgElevated,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textDim,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarIcon: ({ focused, color }) => {
          const size = 22;
          const strokeWidth = focused ? 2.2 : 1.8;
          if (route.name === "Alarms") {
            return (
              <AlarmClock color={color} size={size} strokeWidth={strokeWidth} />
            );
          }
          if (route.name === "Analytics") {
            return (
              <BarChart3 color={color} size={size} strokeWidth={strokeWidth} />
            );
          }
          return <User color={color} size={size} strokeWidth={strokeWidth} />;
        },
      })}
    >
      <Tab.Screen name="Alarms" component={DashboardScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
