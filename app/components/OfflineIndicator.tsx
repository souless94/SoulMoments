'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    // Set initial online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-hide offline alert after 5 seconds when back online
  useEffect(() => {
    if (isOnline && showOfflineAlert) {
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showOfflineAlert]);

  if (!showOfflineAlert && isOnline) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className={isOnline ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription className={isOnline ? 'text-green-800' : 'text-orange-800'}>
            {isOnline 
              ? 'Back online! Your data is synced.' 
              : 'You\'re offline. Don\'t worry, your data is saved locally.'
            }
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}