/**
 * MomentGrid component with responsive CSS Grid layout
 * Displays moments in a responsive grid with proper spacing
 * Handles different screen sizes with appropriate column counts
 */

'use client';

import React from 'react';
import { MomentTile } from './MomentTile';
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

  return (
    <div className={cn(
      // Base grid layout
      "grid gap-3 w-full",
      // Responsive breakpoints
      // Mobile: 2 columns (as requested)
      "grid-cols-2",
      // Tablet: 3 columns
      "sm:grid-cols-3 md:grid-cols-4",
      // Desktop: 4-5 columns
      "lg:grid-cols-5 xl:grid-cols-6",
      // Spacing and padding
      "p-4",
      // Auto-fit for very large screens with smaller minimum width
      "2xl:grid-cols-[repeat(auto-fit,minmax(200px,1fr))]",
      className
    )}>
      {sortedMoments.map((moment) => (
        <MomentTile
          key={moment.id}
          moment={moment}
          onClick={onMomentClick}
          onEdit={onMomentEdit}
          onDelete={onMomentDelete}
        />
      ))}
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 0,
      displayText: 'Today',
      status: 'today'
    },
    {
      id: '2',
      title: 'Trip to Japan',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 30,
      displayText: '30 days until',
      status: 'future'
    },
    {
      id: '3',
      title: 'Started New Job',
      date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days ago
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -90,
      displayText: '90 days ago',
      status: 'past'
    },
    {
      id: '4',
      title: 'Birthday Party',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 7,
      displayText: '7 days until',
      status: 'future'
    },
    {
      id: '5',
      title: 'Graduation Day',
      date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -365,
      displayText: '365 days ago',
      status: 'past'
    },
    {
      id: '6',
      title: 'Summer Vacation',
      date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 120 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 120,
      displayText: '120 days until',
      status: 'future'
    },
    {
      id: '7',
      title: 'First Date',
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: -30,
      displayText: '30 days ago',
      status: 'past'
    },
    {
      id: '8',
      title: 'Marathon Race',
      date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
      createdAt: Date.now(),
      updatedAt: Date.now(),
      daysDifference: 60,
      displayText: '60 days until',
      status: 'future'
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