/**
 * MomentTile component using shadcn/ui Card
 * Displays a single moment with title, day count, and date
 * Supports different visual states for past/today/future moments
 */

'use client';

import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDisplayDate } from '@/lib/date-utils';
import type { Moment, MomentTileProps } from '@/types/moment';

/**
 * Tile variant styles for different moment states
 */
const tileVariants = {
  past: "bg-muted/50 text-muted-foreground border-muted hover:bg-muted/70",
  today: "bg-accent text-accent-foreground border-accent ring-2 ring-primary/20 hover:bg-accent/90",
  future: "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
} as const;

/**
 * MomentTile component that displays a single moment as a card
 */
export function MomentTile({ moment, onClick, onEdit }: MomentTileProps) {
  // Use the pre-calculated values from the moment object for consistency
  const { status } = moment;
  
  // Format the date for display
  const formattedDate = formatDisplayDate(moment.date);
  
  // Handle tile click - prioritize onClick, then onEdit
  const handleClick = () => {
    if (onClick) {
      onClick(moment);
    } else if (onEdit) {
      onEdit(moment);
    }
  };
  
  // Handle keyboard interaction
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Card
      className={cn(
        // Base styles
        "transition-all duration-200 cursor-pointer select-none",
        // Hover effects
        "hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01]",
        // Focus styles for accessibility
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        // Smaller, more compact sizing
        "min-h-[100px] active:scale-[0.99]",
        // Variant-specific styles
        tileVariants[status]
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${moment.title}${moment.description ? `, ${moment.description}` : ''}, ${formattedDate}`}
    >
      <CardHeader className="pb-1 px-3 pt-3">
        <CardTitle className={cn(
          "text-sm font-semibold leading-tight line-clamp-2",
          status === 'today' && "text-accent-foreground",
          status === 'future' && "text-primary",
          status === 'past' && "text-muted-foreground"
        )}>
          {moment.title}
          {status === 'today' && <span className="ml-1">🎉</span>}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 px-3 py-1">
        {moment.description && (
          <p className={cn(
            "text-xs leading-relaxed line-clamp-2",
            status === 'today' && "text-accent-foreground/80",
            status === 'future' && "text-primary/80",
            status === 'past' && "text-muted-foreground/80"
          )}>
            {moment.description}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-1 pb-3 px-3">
        <p className={cn(
          "text-xs font-medium w-full text-center",
          status === 'today' && "text-accent-foreground/70",
          status === 'future' && "text-primary/70",
          status === 'past' && "text-muted-foreground/70"
        )}>
          {formattedDate}
        </p>
      </CardFooter>
    </Card>
  );
}

/**
 * Static MomentTile component for demo purposes with sample data
 */
export function MomentTileDemo() {
  const sampleMoments: Moment[] = [
    {
      id: '1',
      title: 'Wedding Anniversary',
      date: '2024-06-15',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 0,
      displayText: 'Today',
      status: 'today'
    },
    {
      id: '2', 
      title: 'Trip to Japan',
      date: '2024-12-25',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 30,
      displayText: '30 days until',
      status: 'future'
    },
    {
      id: '3',
      title: 'Started New Job',
      date: '2024-01-15',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -90,
      displayText: '90 days ago',
      status: 'past'
    }
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
      {sampleMoments.map((moment) => (
        <MomentTile
          key={moment.id}
          moment={moment}
          onClick={(m) => console.log('Clicked moment:', m.title)}
        />
      ))}
    </div>
  );
}