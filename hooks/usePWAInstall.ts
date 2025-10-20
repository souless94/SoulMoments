'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Check if app is already installed/running in standalone mode
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://');
      
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      console.log('PWA install prompt available');
      
      // Show a subtle notification that the app can be installed
      toast.info('Install app available', {
        description: 'You can install this app for a better experience.',
        duration: 8000,
        action: {
          label: 'Install',
          onClick: () => promptInstall(),
        },
      });
    };

    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      
      toast.success('App installed successfully!', {
        description: 'You can now use the app from your home screen.',
        duration: 5000,
      });
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log('No install prompt available');
      
      // Show manual installation instructions
      toast.info('Manual installation', {
        description: 'Use your browser\'s menu to install this app.',
        duration: 10000,
      });
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Error showing install prompt:', error);
      toast.error('Installation failed', {
        description: 'Could not show install prompt. Try using your browser\'s menu.',
      });
      return false;
    }
  }, [deferredPrompt]);

  const getInstallInstructions = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        instructions: 'Click the three dots menu → "Install Life Moments Tracker"',
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        instructions: 'Click the address bar install icon or three lines menu → "Install"',
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        instructions: 'Tap the share button → "Add to Home Screen"',
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        instructions: 'Click the three dots menu → "Apps" → "Install this site as an app"',
      };
    } else {
      return {
        browser: 'Browser',
        instructions: 'Look for an install option in your browser\'s menu',
      };
    }
  }, []);

  const showManualInstructions = useCallback(() => {
    const { browser, instructions } = getInstallInstructions();
    
    toast.info(`Install on ${browser}`, {
      description: instructions,
      duration: 15000,
    });
  }, [getInstallInstructions]);

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    promptInstall,
    showManualInstructions,
    canInstall: isInstallable || (!isInstalled && !isStandalone),
  };
}