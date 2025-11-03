/**
 * MomentGrid component with responsive CSS Grid layout
 * Displays moments in a responsive grid with proper spacing
 * Handles different screen sizes with appropriate column counts
 */

'use client';

import React from 'react';
import { MomentTile } from './MomentTile';
import { Separator } from '@/components/ui/separator';
import { sortMomentsByDate } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import type { MomentGridProps } from '@/types/moment';

/**
 * MomentGrid component that displays moments in a responsive grid layout
 */
export const MomentGrid = React.memo(function MomentGrid({ 
  moments, 
  onMomentClick, 
  onMomentEdit, 
  onMomentDelete,
  className 
}: MomentGridProps & { className?: string }) {
  // Sort moments by date (upcoming first, then past events) - memoized for performance
  const sortedMoments = React.useMemo(() => sortMomentsByDate(moments), [moments]);

  // Separate moments by status for better organization - memoized for performance
  // Repeating events are always considered "upcoming" since they repeat
  const { futureMoments, todayMoments, pastMoments } = React.useMemo(() => ({
    futureMoments: sortedMoments.filter(m => 
      m.status === 'future' || m.isRepeating
    ),
    todayMoments: sortedMoments.filter(m => 
      m.status === 'today' && !m.isRepeating
    ),
    pastMoments: sortedMoments.filter(m => 
      m.status === 'past' && !m.isRepeating
    )
  }), [sortedMoments]);

  // Memoize grid classes to prevent recalculation
  const gridClasses = React.useMemo(() => cn(
    // Base grid layout
    "grid gap-3 w-full",
    // Responsive breakpoints
    // Mobile: 2 columns (as requested)
    "grid-cols-2",
    // Tablet: 3 columns
    "sm:grid-cols-3 md:grid-cols-4",
    // Desktop: 4-5 columns
    "lg:grid-cols-5 xl:grid-cols-6",
    // Auto-fit for very large screens with smaller minimum width
    "2xl:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
  ), []);

  // Handle empty state
  if (moments.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}>
        <div className="text-6xl mb-4 opacity-50">📅</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          No moments yet
        </h3>
        <p className="text-muted-foreground max-w-md">
          Start tracking your life moments by adding your first memory, event, or milestone.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("w-full p-4", className)}>
      {/* Future and Today moments */}
      {(futureMoments.length > 0 || todayMoments.length > 0) && (
        <div className={gridClasses}>
          {[...todayMoments, ...futureMoments].map((moment) => (
            <MomentTile
              key={moment.id}
              moment={moment}
              onClick={onMomentClick}
              onEdit={onMomentEdit}
              onDelete={onMomentDelete}
            />
          ))}
        </div>
      )}

      {/* Separator for past moments */}
      {pastMoments.length > 0 && (futureMoments.length > 0 || todayMoments.length > 0) && (
        <div className="my-8">
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-sm text-muted-foreground font-medium">Past Moments</span>
            <Separator className="flex-1" />
          </div>
        </div>
      )}

      {/* Past moments */}
      {pastMoments.length > 0 && (
        <div className={gridClasses}>
          {pastMoments.map((moment) => (
            <MomentTile
              key={moment.id}
              moment={moment}
              onClick={onMomentClick}
              onEdit={onMomentEdit}
              onDelete={onMomentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
});

