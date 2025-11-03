/**
 * FloatingAddButton component
 * Floating action button positioned at bottom-right for adding new moments
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FloatingAddButtonProps {
  onClick: () => void;
  className?: string;
}

/**
 * Floating add button component
 */
export function FloatingAddButton({ onClick, className }: FloatingAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        // Fixed positioning at bottom-right with optimal mobile UX
        "fixed bottom-10 right-10 z-50",
        // Responsive positioning - closer on larger screens
        "sm:bottom-8 sm:right-8 md:bottom-6 md:right-6",
        // Circular button styling with optimal touch target
        "h-16 w-16 rounded-full shadow-lg",
        // Smaller on larger screens
        "sm:h-14 sm:w-14 md:h-12 md:w-12",
        // Hover and focus effects
        "hover:shadow-xl hover:scale-110 active:scale-95",
        // Smooth transitions
        "transition-all duration-200",
        // Ensure good contrast and visibility
        "bg-primary text-primary-foreground",

        className
      )}
      aria-label="Add new moment"
    >
      <Plus className="h-7 w-7 sm:h-6 sm:w-6 md:h-5 md:w-5" />
    </Button>
  );
}