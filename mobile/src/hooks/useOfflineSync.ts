/**
 * Hook for monitoring network status and triggering offline sync.
 *
 * Usage:
 *   const { isOnline, pendingCount, syncNow } = useOfflineSync();
 *
 * SETUP: npm install @react-native-community/netinfo
 */

import { useEffect, useState, useCallback, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { syncEngine } from "@/src/db/sync";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const syncInProgress = useRef(false);

  // Monitor network status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = !!(state.isConnected && state.isInternetReachable);
      setIsOnline(online);

      // Auto-sync when coming back online
      if (online && !syncInProgress.current) {
        syncNow();
      }
    });

    return () => unsubscribe();
  }, []);

  // Check pending count periodically
  useEffect(() => {
    const check = () => {
      syncEngine.getPendingCount().then(setPendingCount).catch(() => {});
    };
    check();
    const interval = setInterval(check, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  const syncNow = useCallback(async () => {
    if (syncInProgress.current || !isOnline) return;
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const result = await syncEngine.flushQueue();
      const newCount = await syncEngine.getPendingCount();
      setPendingCount(newCount);

      if (result.synced > 0) {
        console.log(`[Sync] Synced ${result.synced} items, ${result.failed} failed`);
      }
    } catch (error) {
      console.error("[Sync] Error:", error);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, [isOnline]);

  return { isOnline, pendingCount, isSyncing, syncNow };
}
