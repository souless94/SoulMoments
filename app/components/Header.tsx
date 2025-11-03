/**
 * Header component with app title and PWA install button
 * Responsive design with mobile-friendly navigation
 * Uses shadcn/ui Button component with proper accessibility
 */

'use client';

import React from 'react';

import { cn } from '@/lib/utils';

export interface HeaderProps {
  className?: string;
}

/**
 * Main header component for the Life Moments Tracker app
 */
export function Header({ className }: HeaderProps) {

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* App Title and Description */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight">
            Life Moments Tracker
          </h1>
          <p className="hidden sm:block text-sm text-muted-foreground">
            Track your important life events
          </p>
        </div>

        {/* README Link */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/souless94/SoulMoments#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-md border border-border/50 hover:border-border"
            title="View README documentation"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span className="hidden sm:inline">README</span>
          </a>
        </div>

      </div>
    </header>
  );
}
