/**
 * Header component with app title and add moment button
 * Responsive design with mobile-friendly navigation
 * Uses shadcn/ui Button component with proper accessibility
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface HeaderProps {
  onAddMoment?: () => void;
  className?: string;
}

/**
 * Main header component for the Life Moments Tracker app
 */
export function Header({ onAddMoment, className }: HeaderProps) {
  const handleAddClick = () => {
    if (onAddMoment) {
      onAddMoment();
    } else {
      console.log('Add moment clicked');
    }
  };

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

      </div>
    </header>
  );
}
