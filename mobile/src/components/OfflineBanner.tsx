/**
 * Offline status banner. Shows at the top of screens when device is offline
 * or has pending sync items.
 *
 * Usage:
 *   <OfflineBanner />
 *
 * Place this inside screens that support offline functionality.
 */

import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { WifiOff, RefreshCw, CloudOff } from "lucide-react-native";
import { useOfflineSync } from "@/src/hooks/useOfflineSync";

export default function OfflineBanner() {
  const { isOnline, pendingCount, isSyncing, syncNow } = useOfflineSync();

  // Nothing to show when online with no pending items
  if (isOnline && pendingCount === 0) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: isOnline ? "#fef3c7" : "#fee2e2",
        borderRadius: 10,
        marginBottom: 8,
      }}
    >
      {isOnline ? (
        <CloudOff color="#d97706" size={16} />
      ) : (
        <WifiOff color="#dc2626" size={16} />
      )}

      <Text style={{ flex: 1, fontSize: 12, color: isOnline ? "#92400e" : "#991b1b" }}>
        {isOnline
          ? `${pendingCount} item${pendingCount !== 1 ? "s" : ""} waiting to sync`
          : "You're offline — changes will sync when connected"}
      </Text>

      {isOnline && pendingCount > 0 && (
        <TouchableOpacity
          onPress={syncNow}
          disabled={isSyncing}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingHorizontal: 8,
            paddingVertical: 4,
            backgroundColor: "#fbbf24",
            borderRadius: 6,
          }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#92400e" />
          ) : (
            <RefreshCw color="#92400e" size={12} />
          )}
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#92400e" }}>
            {isSyncing ? "Syncing..." : "Sync"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
