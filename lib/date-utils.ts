/**
 * Date calculation utilities for Life Moments Tracker
 * Handles day differences, display text, and edge cases
 */

export interface DateCalculationResult {
  daysDifference: number;
  displayText: string;
  status: 'past' | 'today' | 'future';
}

/**
 * Calculate the difference in days between a moment date and today
 * Handles timezone normalization and edge cases like leap years
 * 
 * @param momentDate - Date string in YYYY-MM-DD format
 * @returns Object with day difference, display text, and status
 */
export function calculateDayDifference(momentDate: string): DateCalculationResult {
  // Parse the moment date
  const moment = new Date(momentDate + 'T00:00:00.000Z'); // Force UTC to avoid timezone issues
  const today = new Date();
  
  // Normalize today to UTC midnight for consistent comparison
  const todayUTC = new Date(Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ));
  
  // Calculate difference in milliseconds, then convert to days
  const diffTime = moment.getTime() - todayUTC.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  // Determine status and display text
  let displayText: string;
  let status: 'past' | 'today' | 'future';
  
  if (diffDays === 0) {
    displayText = 'Today';
    status = 'today';
  } else if (diffDays > 0) {
    displayText = diffDays === 1 ? '1 day until' : `${diffDays} days until`;
    status = 'future';
  } else {
    const absDays = Math.abs(diffDays);
    displayText = absDays === 1 ? '1 day ago' : `${absDays} days ago`;
    status = 'past';
  }
  
  return {
    daysDifference: diffDays,
    displayText,
    status
  };
}

/**
 * Format a date string for display (e.g., "March 15, 2024")
 * 
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00.000Z');
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Get today's date in YYYY-MM-DD format
 * Useful for setting default values in date inputs
 * 
 * @returns Today's date string
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Validate if a date string is in the correct format and represents a valid date
 * 
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
  // Check format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }
  
  // Check if it's a valid date
  const date = new Date(dateString + 'T00:00:00.000Z');
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
}

/**
 * Check if a year is a leap year
 * Used for handling edge cases in date calculations
 * 
 * @param year - Year to check
 * @returns True if leap year, false otherwise
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get the number of days in a specific month and year
 * Handles leap years correctly
 * 
 * @param year - Year
 * @param month - Month (1-12)
 * @returns Number of days in the month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Sort moments by date (upcoming first, then past events in reverse chronological order)
 * 
 * @param moments - Array of moments to sort
 * @returns Sorted array of moments
 */
export function sortMomentsByDate<T extends { date: string; daysDifference: number }>(moments: T[]): T[] {
  return moments.sort((a, b) => {
    // Future events: sort by ascending date (closest first)
    if (a.daysDifference >= 0 && b.daysDifference >= 0) {
      return a.daysDifference - b.daysDifference;
    }
    
    // Past events: sort by descending date (most recent first)
    if (a.daysDifference < 0 && b.daysDifference < 0) {
      return b.daysDifference - a.daysDifference;
    }
    
    // Mixed: future events come first
    return b.daysDifference - a.daysDifference;
  });
}