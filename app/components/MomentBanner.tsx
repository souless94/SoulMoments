/**
 * MomentBanner component that displays a summary banner
 * Shows upcoming and past moments with day counts
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Moment } from '@/types/moment';

export interface MomentBannerProps {
  moments: Moment[];
  className?: string;
}

/**
 * Banner component showing moment statistics and highlights
 */
export function MomentBanner({ moments, className }: MomentBannerProps) {
  // Calculate statistics
  const todayMoments = moments.filter(m => m.status === 'today');
  const futureMoments = moments.filter(m => m.status === 'future').sort((a, b) => a.daysDifference - b.daysDifference);
  const pastMoments = moments.filter(m => m.status === 'past').sort((a, b) => b.daysDifference - a.daysDifference);

  // Get next upcoming moment
  const nextMoment = futureMoments[0];
  // Get most recent past moment
  const recentMoment = pastMoments[0];

  if (moments.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border rounded-lg p-4 mb-6",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Today's moments */}
        {todayMoments.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-accent-foreground">
                {todayMoments.length === 1 ? 'Today!' : `${todayMoments.length} moments today!`}
              </p>
              <p className="text-sm text-muted-foreground">
                {todayMoments.map(m => m.title).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Next upcoming moment */}
        {nextMoment && (
          <div className="flex items-center gap-2">
            <span className="text-xl">⏰</span>
            <div>
              <p className="font-medium text-primary">
                {nextMoment.displayText}
              </p>
              <p className="text-sm text-muted-foreground">
                {nextMoment.title}
              </p>
            </div>
          </div>
        )}

        {/* Recent past moment */}
        {recentMoment && !todayMoments.length && (
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <p className="font-medium text-muted-foreground">
                {recentMoment.displayText}
              </p>
              <p className="text-sm text-muted-foreground">
                {recentMoment.title}
              </p>
            </div>
          </div>
        )}

        {/* Summary stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {futureMoments.length > 0 && (
            <span>{futureMoments.length} upcoming</span>
          )}
          {pastMoments.length > 0 && (
            <span>{pastMoments.length} past</span>
          )}
        </div>
      </div>
    </div>
  );
}