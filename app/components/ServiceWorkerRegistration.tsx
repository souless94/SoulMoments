'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function ServiceWorkerRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg);
          setRegistration(reg);
          
          // Check for updates immediately
          reg.update();
          
          // Handle service worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  
                  // Show update notification
                  toast.info('App update available', {
                    description: 'A new version is ready. Refresh to update.',
                    action: {
                      label: 'Update Now',
                      onClick: () => {
                        // Tell the new service worker to skip waiting
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      },
                    },
                    duration: 15000,
                  });
                } else if (newWorker.state === 'activated') {
                  setUpdateAvailable(false);
                  toast.success('App updated successfully');
                }
              });
            }
          });

          // Handle service worker state changes
          if (reg.waiting) {
            setUpdateAvailable(true);
          }

          // Listen for controlling service worker changes
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service worker controller changed');
            setUpdateAvailable(false);
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
          toast.error('Offline features unavailable', {
            description: 'Service worker registration failed. Some features may not work offline.',
            duration: 8000,
          });
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        const { data } = event;
        
        if (data?.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', data.payload);
        }
        
        if (data?.type === 'CACHE_STATUS') {
          console.log('Cache status:', data.caches);
        }
        
        if (data?.type === 'OFFLINE_READY') {
          toast.success('App ready for offline use', {
            description: 'All essential resources have been cached.',
            duration: 5000,
          });
        }
      });

      // Check for updates periodically (every 30 minutes)
      const updateInterval = setInterval(() => {
        if (registration) {
          registration.update().catch(error => {
            console.warn('Failed to check for updates:', error);
          });
        }
      }, 30 * 60 * 1000);

      return () => {
        clearInterval(updateInterval);
      };
    }
    
    return () => {
      // Cleanup function for when service worker is not supported
    };
  }, [registration]);

  // Separate effect for global functions to avoid dependency issues
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (false) {
      console.warn('Service Worker not supported');
      toast.warning('Limited offline support', {
        description: 'Your browser doesn\'t support service workers. Offline features will be limited.',
        duration: 8000,
      });
    }
  }, []);

  // Expose update function globally for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as unknown as { updateServiceWorker: () => void }).updateServiceWorker = () => {
        if (registration) {
          registration.update();
          toast.info('Checking for updates...');
        }
      };
      
      (window as unknown as { getCacheStatus: () => void }).getCacheStatus = () => {
        if (navigator.serviceWorker.controller) {
          const messageChannel = new MessageChannel();
          messageChannel.port1.onmessage = (event) => {
            console.log('Cache status:', event.data);
          };
          
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_CACHE_STATUS' },
            [messageChannel.port2]
          );
        }
      };
    }
  }, [registration]);

  return null;
}