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
import type { Moment, MomentGridProps } from '@/types/moment';

/**
 * MomentGrid component that displays moments in a responsive grid layout
 */
export function MomentGrid({ 
  moments, 
  onMomentClick, 
  onMomentEdit, 
  onMomentDelete,
  className 
}: MomentGridProps & { className?: string }) {
  // Sort moments by date (upcoming first, then past events)
  const sortedMoments = sortMomentsByDate(moments);

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

  // Separate moments by status for better organization
  // Repeating events are always considered "upcoming" since they repeat
  const futureMoments = sortedMoments.filter(m => 
    m.status === 'future' || m.isRepeating
  );
  const todayMoments = sortedMoments.filter(m => 
    m.status === 'today' && !m.isRepeating
  );
  const pastMoments = sortedMoments.filter(m => 
    m.status === 'past' && !m.isRepeating
  );

  const gridClasses = cn(
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
  );

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
}

/**
 * Demo component with sample data to showcase the grid layout
 */
export function MomentGridDemo() {
  // Sample moments with different dates to show sorting and states
  const sampleMoments: Moment[] = [
    {
      id: '1',
      title: 'Wedding Anniversary',
      date: new Date().toISOString().split('T')[0], // Today
      repeatFrequency: 'yearly',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 0,
      displayText: 'Today',
      status: 'today',
      nextOccurrence: new Date().toISOString().split('T')[0],
      isRepeating: true
    },
    {
      id: '2',
      title: 'Trip to Japan',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      repeatFrequency: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 30,
      displayText: '30 days until',
      status: 'future',
      isRepeating: false
    },
    {
      id: '3',
      title: 'Started New Job',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
      repeatFrequency: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -90,
      displayText: '90 days ago',
      status: 'past',
      isRepeating: false
    },
    {
      id: '4',
      title: 'Birthday Party',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      repeatFrequency: 'yearly',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 7,
      displayText: '7 days until',
      status: 'future',
      nextOccurrence: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isRepeating: true
    },
    {
      id: '5',
      title: 'Graduation Day',
      date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      repeatFrequency: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -365,
      displayText: '365 days ago',
      status: 'past',
      isRepeating: false
    },
    {
      id: '6',
      title: 'Summer Vacation',
      date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days from now
      repeatFrequency: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 120,
      displayText: '120 days until',
      status: 'future',
      isRepeating: false
    },
    {
      id: '7',
      title: 'First Date',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      repeatFrequency: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -30,
      displayText: '30 days ago',
      status: 'past',
      isRepeating: false
    },
    {
      id: '8',
      title: 'Marathon Race',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
      repeatFrequency: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 60,
      displayText: '60 days until',
      status: 'future',
      isRepeating: false
    }
  ];

  const handleMomentClick = (moment: Moment) => {
    console.log('Clicked moment:', moment.title);
  };

  return (
    <div className="w-full">
      <div className="mb-6 px-4">
        <h2 className="text-2xl font-semibold mb-2">Responsive Grid Demo</h2>
        <p className="text-muted-foreground">
          This grid adapts to different screen sizes: 1 column on mobile, 2-3 on tablet, and 3-4 on desktop.
        </p>
      </div>
      
      <MomentGrid
        moments={sampleMoments}
        onMomentClick={handleMomentClick}
      />
    </div>
  );
}

/**
 * Empty state demo component
 */
export function MomentGridEmptyDemo() {
  return (
    <div className="w-full">
      <div className="mb-6 px-4">
        <h2 className="text-2xl font-semibold mb-2">Empty State Demo</h2>
        <p className="text-muted-foreground">
          This shows what the grid looks like when there are no moments.
        </p>
      </div>
      
      <MomentGrid
        moments={[]}
        onMomentClick={() => {}}
      />
    </div>
  );
}