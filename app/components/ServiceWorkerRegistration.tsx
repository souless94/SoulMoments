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
                        // Tell the new service worker to skip waiting with proper validation
                        if (newWorker && newWorker.state === 'installed') {
                          newWorker.postMessage({ 
                            type: 'SKIP_WAITING',
                            timestamp: Date.now(),
                            origin: window.location.origin
                          });
                          window.location.reload();
                        }
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

      // Listen for service worker messages with proper validation
      navigator.serviceWorker.addEventListener('message', (event) => {
        // Validate message origin and source
        if (event.origin !== window.location.origin) {
          console.warn('Ignoring message from untrusted origin:', event.origin);
          return;
        }

        // Ensure message comes from our service worker
        if (!event.source || event.source !== navigator.serviceWorker.controller) {
          console.warn('Ignoring message from unknown source');
          return;
        }

        const { data } = event;
        
        // Validate message structure
        if (!data || typeof data !== 'object' || typeof data.type !== 'string') {
          console.warn('Ignoring invalid message format:', data);
          return;
        }

        // Define allowed message types for security
        const allowedMessageTypes = ['CACHE_UPDATED', 'CACHE_STATUS', 'OFFLINE_READY'];
        
        if (!allowedMessageTypes.includes(data.type)) {
          console.warn('Ignoring unknown message type:', data.type);
          return;
        }
        
        // Handle validated messages
        switch (data.type) {
          case 'CACHE_UPDATED':
            if (data.payload && typeof data.payload === 'object') {
              console.log('Cache updated:', data.payload);
            }
            break;
            
          case 'CACHE_STATUS':
            if (Array.isArray(data.caches)) {
              console.log('Cache status:', data.caches);
            }
            break;
            
          case 'OFFLINE_READY':
            toast.success('App ready for offline use', {
              description: 'All essential resources have been cached.',
              duration: 5000,
            });
            break;
            
          default:
            // This should never happen due to allowedMessageTypes check above
            console.warn('Unhandled message type:', data.type);
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
    
    if (!('serviceWorker' in navigator)) {
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
          
          // Validate response from service worker
          messageChannel.port1.onmessage = (event) => {
            const { data } = event;
            
            // Validate response structure
            if (data && typeof data === 'object' && data.type === 'CACHE_STATUS' && Array.isArray(data.caches)) {
              console.log('Cache status:', data.caches);
            } else {
              console.warn('Invalid cache status response:', data);
            }
          };
          
          navigator.serviceWorker.controller.postMessage(
            { 
              type: 'GET_CACHE_STATUS',
              timestamp: Date.now(),
              origin: window.location.origin
            },
            [messageChannel.port2]
          );
        }
      };
    }
  }, [registration]);

  return null;
}