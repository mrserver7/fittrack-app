import { Slot, SplashScreen, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Notifications from "expo-notifications";
import { useAuthStore } from "@/src/store/auth-store";
import { registerForPushNotifications, savePushTokenToServer } from "@/src/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function PushSetup() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (!user) return;

    // Register for push and save token
    registerForPushNotifications().then((token) => {
      if (token) savePushTokenToServer(token);
    });

    // Handle notification taps (app opened from notification)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, string>;
      const screen = data?.screen;

      if (screen === "messages") {
        if (user.role === "trainer") {
          router.push("/(trainer)/messages" as never);
        } else {
          router.push("/(client)/messages" as never);
        }
      } else if (screen === "clients" && user.role === "trainer") {
        router.push("/(trainer)/clients" as never);
      } else if (screen === "home" && user.role === "client") {
        router.push("/(client)/home" as never);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user, router]);

  return null;
}

export default function RootLayout() {
  const hydrated = useAuthStore((s) => s.hydrated);

  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync();
  }, [hydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PushSetup />
          <Slot />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
