/**
 * Tests for date utility functions
 * Covers edge cases including leap years and timezone handling
 */

import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  calculateDayDifference,
  formatDisplayDate,
  isValidDateString,
  isLeapYear,
  getDaysInMonth,
  sortMomentsByDate
} from '../date-utils';

// Mock Date.now() for consistent testing
const mockToday = new Date('2024-03-15T12:00:00.000Z');

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(mockToday);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('calculateDayDifference', () => {
  test('calculates today correctly', () => {
    const result = calculateDayDifference('2024-03-15');
    expect(result.daysDifference).toBe(0);
    expect(result.displayText).toBe('Today');
    expect(result.status).toBe('today');
  });

  test('calculates future dates correctly', () => {
    const result = calculateDayDifference('2024-03-20');
    expect(result.daysDifference).toBe(5);
    expect(result.displayText).toBe('5 days until');
    expect(result.status).toBe('future');
  });

  test('calculates past dates correctly', () => {
    const result = calculateDayDifference('2024-03-10');
    expect(result.daysDifference).toBe(-5);
    expect(result.displayText).toBe('5 days ago');
    expect(result.status).toBe('past');
  });

  test('handles single day differences', () => {
    const tomorrow = calculateDayDifference('2024-03-16');
    expect(tomorrow.displayText).toBe('1 day until');
    
    const yesterday = calculateDayDifference('2024-03-14');
    expect(yesterday.displayText).toBe('1 day ago');
  });

  test('handles leap year edge case', () => {
    // February 29, 2024 (leap year)
    const result = calculateDayDifference('2024-02-29');
    expect(result.daysDifference).toBe(-15);
    expect(result.displayText).toBe('15 days ago');
  });
});

describe('formatDisplayDate', () => {
  test('formats date correctly', () => {
    const result = formatDisplayDate('2024-03-15');
    expect(result).toBe('March 15, 2024');
  });

  test('handles different months', () => {
    expect(formatDisplayDate('2024-01-01')).toBe('January 1, 2024');
    expect(formatDisplayDate('2024-12-31')).toBe('December 31, 2024');
  });
});

describe('isValidDateString', () => {
  test('validates correct date format', () => {
    expect(isValidDateString('2024-03-15')).toBe(true);
    expect(isValidDateString('2024-01-01')).toBe(true);
    expect(isValidDateString('2024-12-31')).toBe(true);
  });

  test('rejects invalid formats', () => {
    expect(isValidDateString('24-03-15')).toBe(false);
    expect(isValidDateString('2024/03/15')).toBe(false);
    expect(isValidDateString('2024-3-15')).toBe(false);
    expect(isValidDateString('invalid')).toBe(false);
  });

  test('rejects invalid dates', () => {
    expect(isValidDateString('2024-02-30')).toBe(false);
    expect(isValidDateString('2024-13-01')).toBe(false);
    expect(isValidDateString('2024-00-01')).toBe(false);
  });
});

describe('isLeapYear', () => {
  test('identifies leap years correctly', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2020)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1600)).toBe(true);
  });

  test('identifies non-leap years correctly', () => {
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2021)).toBe(false);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(1700)).toBe(false);
  });
});

describe('getDaysInMonth', () => {
  test('returns correct days for regular months', () => {
    expect(getDaysInMonth(2024, 1)).toBe(31); // January
    expect(getDaysInMonth(2024, 4)).toBe(30); // April
    expect(getDaysInMonth(2024, 6)).toBe(30); // June
  });

  test('handles February in leap years', () => {
    expect(getDaysInMonth(2024, 2)).toBe(29); // Leap year
    expect(getDaysInMonth(2023, 2)).toBe(28); // Non-leap year
  });
});

describe('sortMomentsByDate', () => {
  const mockMoments = [
    { date: '2024-03-10', daysDifference: -5 }, // Past
    { date: '2024-03-20', daysDifference: 5 },  // Future
    { date: '2024-03-15', daysDifference: 0 },  // Today
    { date: '2024-03-25', daysDifference: 10 }, // Future
    { date: '2024-03-05', daysDifference: -10 } // Past
  ];

  test('sorts moments correctly (future first, then past)', () => {
    const sorted = sortMomentsByDate([...mockMoments]);
    
    // Should be: today (0), future (5), future (10), past (-5), past (-10)
    expect(sorted[0].daysDifference).toBe(0);  // Today first
    expect(sorted[1].daysDifference).toBe(5);  // Closest future
    expect(sorted[2].daysDifference).toBe(10); // Further future
    expect(sorted[3].daysDifference).toBe(-5); // Recent past
    expect(sorted[4].daysDifference).toBe(-10); // Older past
  });
});