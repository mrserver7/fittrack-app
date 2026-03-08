import { Redirect } from "expo-router";
import { useAuthStore } from "@/src/store/auth-store";

export default function Index() {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.isAdmin) return <Redirect href="/(admin)" />;
  if (user.role === "trainer") return <Redirect href="/(trainer)/dashboard" />;
  return <Redirect href="/(client)/home" />;
}
