'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Info, X, BookOpen } from 'lucide-react';

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem('welcome-banner-dismissed');
    }
    return true;
  });

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('welcome-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="border-b bg-blue-50/50 dark:bg-blue-950/20">
      <div className="container mx-auto px-4 py-3">
        <Alert className="border-blue-200 dark:border-blue-800 bg-transparent">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1 pr-4">
              <span className="text-blue-900 dark:text-blue-100">
                <strong>Welcome to SoulMoments!</strong> This is a demo of an offline-first life moments tracker.{' '}
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-blue-700 dark:text-blue-300 underline hover:no-underline"
                  asChild
                >
                  <a
                    href="https://github.com/souless94/SoulMoments#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="h-3 w-3 mr-1" />
                    Read the documentation
                  </a>
                </Button>{' '}
                to learn more about features and limitations.
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-auto p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              aria-label="Dismiss welcome banner"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}