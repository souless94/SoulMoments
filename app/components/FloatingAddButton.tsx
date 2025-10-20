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
        // Fixed positioning at bottom-right
        "fixed bottom-6 right-6 z-50",
        // Circular button styling
        "h-14 w-14 rounded-full shadow-lg",
        // Hover and focus effects
        "hover:shadow-xl hover:scale-110 active:scale-95",
        // Smooth transitions
        "transition-all duration-200",
        // Ensure good contrast and visibility
        "bg-primary text-primary-foreground",
        // Touch-friendly sizing for mobile
        "md:h-12 md:w-12",
        className
      )}
      aria-label="Add new moment"
    >
      <Plus className="h-6 w-6 md:h-5 md:w-5" />
    </Button>
  );
}