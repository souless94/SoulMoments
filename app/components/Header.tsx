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

        {/* Add Moment Button */}
        <Button
          onClick={handleAddClick}
          size="default"
          className={cn(
            // Ensure minimum touch target size (44px)
            "min-h-[44px] min-w-[44px]",
            // Mobile-specific adjustments
            "text-sm sm:text-base",
            // Focus and hover states
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
          aria-label="Add new moment"
        >
          <PlusIcon className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Moment</span>
        </Button>
      </div>
    </header>
  );
}

/**
 * Simple Plus icon component (inline SVG for better performance)
 */
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

/**
 * Demo component showing the header in different states
 */
export function HeaderDemo() {
  const [clickCount, setClickCount] = React.useState(0);

  const handleAddMoment = () => {
    setClickCount(prev => prev + 1);
    console.log('Add moment clicked!', clickCount + 1);
  };

  return (
    <div className="w-full">
      <Header onAddMoment={handleAddMoment} />
      
      {/* Demo content to show sticky behavior */}
      <div className="p-8 space-y-4">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Header Demo</h2>
          <p className="text-muted-foreground mb-4">
            The header is sticky and will remain at the top when scrolling. 
            The add button has been clicked {clickCount} times.
          </p>
          <p className="text-sm text-muted-foreground">
            On mobile devices, the header shows only the icon. On larger screens, 
            it shows both the icon and &ldquo;Add Moment&rdquo; text.
          </p>
        </div>
        
        {/* Spacer content to demonstrate sticky behavior */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} className="bg-muted/30 p-4 rounded border">
            <p className="text-muted-foreground">
              Demo content block {i + 1} - scroll to see the sticky header behavior
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}