'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration);
          
          // Handle service worker updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New service worker is available
                  toast.info('App update available', {
                    description: 'Refresh to get the latest version',
                    action: {
                      label: 'Refresh',
                      onClick: () => window.location.reload(),
                    },
                    duration: 10000,
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'CACHE_UPDATED') {
          console.log('Cache updated:', event.data.payload);
        }
      });
    } else {
      console.log('Service Worker not supported');
    }
  }, []);

  return null;
}