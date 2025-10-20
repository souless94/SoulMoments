'use client';

import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  WifiOff, 
  Wifi, 
  Database, 
  HardDrive, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { useOfflineStatus, useStorageManagement } from '@/hooks/useOfflineStatus';
import { cn } from '@/lib/utils';

export default function OfflineIndicator() {
  const { 
    isOnline, 
    isOfflineCapable, 
    hasServiceWorker, 
    storageEstimate,
    connectionType,
    refreshCapabilities 
  } = useOfflineStatus();
  
  const { storageInfo, clearStorageCache } = useStorageManagement();
  
  const [showDetails, setShowDetails] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Fix hydration mismatch by only showing content after client-side hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show alert when going offline or when storage is near limit
  useEffect(() => {
    if (!isClient) return;
    
    if (!isOnline || (storageInfo?.isNearLimit && storageInfo.usagePercentage > 90)) {
      setShowAlert(true);
    } else if (isOnline) {
      // Auto-hide after 3 seconds when back online
      const timer = setTimeout(() => setShowAlert(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isClient, isOnline, storageInfo?.isNearLimit, storageInfo?.usagePercentage]);

  // Don't render anything during SSR or if online and no issues
  if (!isClient || (isOnline && !showAlert && !showDetails && !storageInfo?.isNearLimit)) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getConnectionBadge = () => {
    if (!isOnline) return <Badge variant="destructive">Offline</Badge>;
    if (connectionType) {
      const variant = connectionType.includes('4g') || connectionType.includes('wifi') ? 'default' : 'secondary';
      return <Badge variant={variant}>{connectionType.toUpperCase()}</Badge>;
    }
    return <Badge variant="default">Online</Badge>;
  };

  const getStorageBadge = () => {
    if (!storageInfo) return null;
    
    const { usagePercentage, isNearLimit } = storageInfo;
    const variant = isNearLimit ? 'destructive' : usagePercentage > 50 ? 'secondary' : 'default';
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <HardDrive className="h-3 w-3" />
        {usagePercentage.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
      <Alert className={cn(
        "transition-all duration-300",
        !isOnline ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 
        storageInfo?.isNearLimit ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' :
        'border-green-500 bg-green-50 dark:bg-green-950/20'
      )}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            {!isOnline ? (
              <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            ) : storageInfo?.isNearLimit ? (
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            
            <div className="flex-1">
              <AlertTitle className={cn(
                "text-sm font-medium",
                !isOnline ? 'text-orange-800 dark:text-orange-200' :
                storageInfo?.isNearLimit ? 'text-yellow-800 dark:text-yellow-200' :
                'text-green-800 dark:text-green-200'
              )}>
                {!isOnline ? 'Offline Mode' : 
                 storageInfo?.isNearLimit ? 'Storage Warning' : 
                 'All Systems Ready'}
              </AlertTitle>
              
              <AlertDescription className={cn(
                "text-xs mt-1",
                !isOnline ? 'text-orange-700 dark:text-orange-300' :
                storageInfo?.isNearLimit ? 'text-yellow-700 dark:text-yellow-300' :
                'text-green-700 dark:text-green-300'
              )}>
                {!isOnline ? 
                  'Your data is saved locally and will sync when you\'re back online.' :
                  storageInfo?.isNearLimit ?
                  `Storage is ${storageInfo.usagePercentage.toFixed(1)}% full. Consider clearing cache.` :
                  'Offline-ready with local data storage.'
                }
              </AlertDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2">
            {getConnectionBadge()}
            {getStorageBadge()}
            
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowDetails(!showDetails)}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-current/20">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-medium mb-1">Offline Capabilities</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-3 w-3" />
                    <span className={isOfflineCapable ? 'text-green-600' : 'text-red-600'}>
                      {isOfflineCapable ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wifi className="h-3 w-3" />
                    <span className={hasServiceWorker ? 'text-green-600' : 'text-red-600'}>
                      Service Worker: {hasServiceWorker ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {storageEstimate && (
                <div>
                  <div className="font-medium mb-1">Storage Usage</div>
                  <div className="space-y-1">
                    <div>Used: {formatBytes(storageEstimate.usage || 0)}</div>
                    <div>Available: {formatBytes(storageEstimate.quota || 0)}</div>
                    {storageInfo?.isNearLimit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 text-xs mt-2"
                        onClick={clearStorageCache}
                      >
                        Clear Cache
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => {
                  refreshCapabilities();
                  setShowDetails(false);
                }}
              >
                Refresh Status
              </Button>
            </div>
          </div>
        )}
      </Alert>
    </div>
  );
}