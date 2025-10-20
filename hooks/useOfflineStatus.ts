'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface OfflineStatus {
  isOnline: boolean;
  isOfflineCapable: boolean;
  hasServiceWorker: boolean;
  storageEstimate: StorageEstimate | null;
  connectionType: string | null;
}

export function useOfflineStatus() {
  const [status, setStatus] = useState<OfflineStatus>({
    isOnline: true, // Default to true for SSR
    isOfflineCapable: false,
    hasServiceWorker: false,
    storageEstimate: null,
    connectionType: null,
  });

  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Check offline capabilities
  const checkOfflineCapabilities = useCallback(async () => {
    const hasServiceWorker = 'serviceWorker' in navigator;
    let storageEstimate: StorageEstimate | null = null;
    let connectionType: string | null = null;

    // Get storage estimate
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        storageEstimate = await navigator.storage.estimate();
      } catch (error) {
        console.warn('Could not get storage estimate:', error);
      }
    }

    // Get connection type (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connectionType = connection?.effectiveType || connection?.type || null;
    }

    const isOfflineCapable = hasServiceWorker && 'indexedDB' in window;

    setStatus(prev => ({
      ...prev,
      isOfflineCapable,
      hasServiceWorker,
      storageEstimate,
      connectionType,
    }));
  }, []);

  // Handle online/offline events
  useEffect(() => {
    // Set client flag and initial state
    setIsClient(true);
    setStatus(prev => ({ ...prev, isOnline: navigator.onLine }));

    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      setShowOfflineToast(false);
      
      // Show brief "back online" notification
      if (isClient) {
        toast.success('Back online!', {
          description: 'Your data is synced and ready.',
          duration: 3000,
        });
      }
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
      setShowOfflineToast(true);
      
      // Show offline notification with reassurance
      if (isClient) {
        toast.info('You\'re offline', {
          description: 'Don\'t worry, your data is saved locally and will sync when you\'re back online.',
          duration: 8000,
        });
      }
    };

    // Add listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check capabilities on mount
    checkOfflineCapabilities();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkOfflineCapabilities, isClient]);

  // Monitor connection changes
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        setStatus(prev => ({
          ...prev,
          connectionType: connection?.effectiveType || connection?.type || null,
        }));
      };

      connection?.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  return {
    ...status,
    showOfflineToast,
    refreshCapabilities: checkOfflineCapabilities,
  };
}

// Hook for storage management
export function useStorageManagement() {
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    quota: number;
    usagePercentage: number;
    isNearLimit: boolean;
  } | null>(null);

  const checkStorageUsage = useCallback(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const usagePercentage = quota > 0 ? (used / quota) * 100 : 0;
        const isNearLimit = usagePercentage > 80; // Warn at 80% usage

        setStorageInfo({
          used,
          quota,
          usagePercentage,
          isNearLimit,
        });

        // Show warning if near storage limit
        if (isNearLimit && usagePercentage > 90) {
          toast.warning('Storage almost full', {
            description: `You're using ${usagePercentage.toFixed(1)}% of available storage. Consider deleting old moments.`,
            duration: 10000,
          });
        }
      } catch (error) {
        console.warn('Could not check storage usage:', error);
      }
    }
  }, []);

  const clearStorageCache = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        
        toast.success('Cache cleared', {
          description: 'App cache has been cleared to free up storage space.',
        });
        
        // Refresh storage info
        await checkStorageUsage();
      } catch (error) {
        console.error('Failed to clear cache:', error);
        toast.error('Failed to clear cache');
      }
    }
  }, [checkStorageUsage]);

  useEffect(() => {
    checkStorageUsage();
    
    // Check storage usage periodically
    const interval = setInterval(checkStorageUsage, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [checkStorageUsage]);

  return {
    storageInfo,
    checkStorageUsage,
    clearStorageCache,
  };
}