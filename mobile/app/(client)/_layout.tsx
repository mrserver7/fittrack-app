import { Tabs } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { LayoutDashboard, Dumbbell, BarChart3, Apple, Compass, Trophy } from "lucide-react-native";
import { useAuthStore } from "@/src/store/auth-store";
import { api } from "@/src/api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await api.post("/api/mobile/push-token", { token });
  } catch {
    // Non-critical
  }

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
}

export default function ClientLayout() {
  const token = useAuthStore((s) => s.token);
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (token) registerPushToken();
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {});
    return () => { notificationListener.current?.remove(); };
  }, [token]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#059669",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: { borderTopColor: "#e5e7eb", paddingTop: 4 },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tabs.Screen name="workout" options={{ title: "Workout", tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} /> }} />
      <Tabs.Screen name="explore" options={{ title: "Explore", tabBarIcon: ({ color, size }) => <Compass color={color} size={size} /> }} />
      <Tabs.Screen name="nutrition" options={{ title: "Nutrition", tabBarIcon: ({ color, size }) => <Apple color={color} size={size} /> }} />
      <Tabs.Screen name="progress" options={{ title: "Progress", tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} /> }} />
      <Tabs.Screen name="challenges" options={{ title: "Challenges", tabBarIcon: ({ color, size }) => <Trophy color={color} size={size} /> }} />
      {/* Hidden screens */}
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="account" options={{ href: null }} />
      <Tabs.Screen name="checkins" options={{ href: null }} />
      <Tabs.Screen name="workouts" options={{ href: null }} />
      <Tabs.Screen name="workout-detail" options={{ href: null }} />
      <Tabs.Screen name="habits" options={{ href: null }} />
      <Tabs.Screen name="community" options={{ href: null }} />
    </Tabs>
  );
}
