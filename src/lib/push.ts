/**
 * Expo Push Notification helper.
 * Sends a push notification to an Expo push token.
 * Silently no-ops if the token is missing or invalid.
 */
export async function sendPush(
  token: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!token || !token.startsWith("ExponentPushToken[")) return;

  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: "default",
        priority: "high",
      }),
    });
  } catch {
    // Never throw — push failures are non-critical
  }
}
