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
  focusedMoment?: Moment | null;
  className?: string;
}

/**
 * Banner component showing moment statistics and highlights
 */
export function MomentBanner({ moments, focusedMoment, className }: MomentBannerProps) {
  // Calculate statistics - treat repeat events as upcoming
  const todayMoments = moments.filter(m => m.status === 'today' && !m.isRepeating);
  const futureMoments = moments.filter(m => m.status === 'future' || m.isRepeating).sort((a, b) => a.daysDifference - b.daysDifference);
  const pastMoments = moments.filter(m => m.status === 'past' && !m.isRepeating).sort((a, b) => b.daysDifference - a.daysDifference);

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
      focusedMoment && "ring-2 ring-primary/30",
      className
    )}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Focused moment - takes priority when clicked */}
        {focusedMoment && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {focusedMoment.status === 'today' && !focusedMoment.isRepeating ? '🎉' : 
               (focusedMoment.status === 'future' || focusedMoment.isRepeating) ? '⏰' : '📅'}
            </span>
            <div>
              <p className={cn(
                "font-semibold",
                focusedMoment.status === 'today' && !focusedMoment.isRepeating && "text-accent-foreground",
                (focusedMoment.status === 'future' || focusedMoment.isRepeating) && "text-primary",
                focusedMoment.status === 'past' && !focusedMoment.isRepeating && "text-muted-foreground"
              )}>
                {focusedMoment.displayText}
                {focusedMoment.isRepeating && (
                  <span className="ml-1 text-xs opacity-70">
                    (repeats {focusedMoment.repeatFrequency})
                  </span>
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                {focusedMoment.title}
                {focusedMoment.description && ` - ${focusedMoment.description}`}
                {focusedMoment.isRepeating && focusedMoment.nextOccurrence && (
                  <span className="block text-xs mt-1">
                    Next occurrence: {new Date(focusedMoment.nextOccurrence + 'T00:00:00.000Z').toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'UTC'
                    })}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Default content when no focused moment */}
        {!focusedMoment && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}