/**
 * Test data fixtures for E2E tests
 */

import { DateTestHelpers } from '../utils/test-helpers';

export const testMoments = {
  // Basic moments for testing
  basic: {
    title: 'Test Moment',
    description: 'A test moment for E2E testing',
    date: DateTestHelpers.getFutureDate(7),
  },

  // Today moment
  today: {
    title: 'Today Event',
    description: 'Something happening today',
    date: DateTestHelpers.getTodayString(),
  },

  // Past moment
  past: {
    title: 'Past Event',
    description: 'Something that already happened',
    date: DateTestHelpers.getPastDate(5),
  },

  // Future moment
  future: {
    title: 'Future Event',
    description: 'Something coming up',
    date: DateTestHelpers.getFutureDate(10),
  },

  // Repeat moments
  dailyRepeat: {
    title: 'Daily Habit',
    description: 'Daily recurring event',
    date: DateTestHelpers.getPastDate(1),
    repeatFrequency: 'daily' as const,
  },

  weeklyRepeat: {
    title: 'Weekly Meeting',
    description: 'Weekly team meeting',
    date: DateTestHelpers.getPastDate(7),
    repeatFrequency: 'weekly' as const,
  },

  monthlyRepeat: {
    title: 'Monthly Review',
    description: 'Monthly performance review',
    date: DateTestHelpers.getPastDate(30),
    repeatFrequency: 'monthly' as const,
  },

  yearlyRepeat: {
    title: 'Birthday',
    description: 'Annual birthday celebration',
    date: DateTestHelpers.getPastDate(365),
    repeatFrequency: 'yearly' as const,
  },

  // Edge cases
  longTitle: {
    title: 'This is a very long title that should test the character limit and how the UI handles it',
    description: 'Testing long titles',
    date: DateTestHelpers.getFutureDate(3),
  },

  longDescription: {
    title: 'Long Description Test',
    description: 'This is a very long description that should test how the UI handles lengthy text content and whether it properly truncates or displays the full content in different contexts',
    date: DateTestHelpers.getFutureDate(5),
  },

  noDescription: {
    title: 'No Description',
    date: DateTestHelpers.getFutureDate(2),
  },

  // Special characters
  specialChars: {
    title: 'Special Chars: !@#$%^&*()',
    description: 'Testing special characters: <>&"\'',
    date: DateTestHelpers.getFutureDate(1),
  },

  // Unicode characters
  unicode: {
    title: 'Unicode Test: 🎉🎂🎈',
    description: 'Testing unicode: café, naïve, résumé',
    date: DateTestHelpers.getFutureDate(4),
  },
};

export const invalidMoments = {
  emptyTitle: {
    title: '',
    description: 'This should fail validation',
    date: DateTestHelpers.getFutureDate(1),
  },

  invalidDate: {
    title: 'Invalid Date Test',
    description: 'This should fail validation',
    date: 'invalid-date',
  },

  pastDate: {
    title: 'Past Date',
    description: 'Testing past date validation',
    date: '1900-01-01',
  },
};

export const formValidationTests = [
  {
    name: 'empty title',
    data: invalidMoments.emptyTitle,
    expectedError: 'Title is required',
  },
  {
    name: 'invalid date format',
    data: invalidMoments.invalidDate,
    expectedError: 'Please enter a valid date',
  },
];

export const repeatFrequencyTests = [
  {
    frequency: 'daily' as const,
    moment: testMoments.dailyRepeat,
    expectedNextOccurrence: 'tomorrow',
  },
  {
    frequency: 'weekly' as const,
    moment: testMoments.weeklyRepeat,
    expectedNextOccurrence: 'next week',
  },
  {
    frequency: 'monthly' as const,
    moment: testMoments.monthlyRepeat,
    expectedNextOccurrence: 'next month',
  },
  {
    frequency: 'yearly' as const,
    moment: testMoments.yearlyRepeat,
    expectedNextOccurrence: 'next year',
  },
];

export const responsiveBreakpoints = [
  {
    name: 'mobile',
    width: 375,
    height: 667,
    expectedColumns: 2,
  },
  {
    name: 'tablet',
    width: 768,
    height: 1024,
    expectedColumns: 3,
  },
  {
    name: 'desktop',
    width: 1280,
    height: 720,
    expectedColumns: 5,
  },
  {
    name: 'large desktop',
    width: 1920,
    height: 1080,
    expectedColumns: 6,
  },
];

export const performanceThresholds = {
  pageLoad: 3000, // 3 seconds
  interaction: 200, // 200ms
  animation: 300, // 300ms
};