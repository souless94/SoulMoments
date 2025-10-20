/**
 * Manual testing utility for date functions
 * Run this to verify date calculations work correctly
 */

import { calculateDayDifference, formatDisplayDate, isValidDateString, isLeapYear, getDaysInMonth } from './date-utils';

console.log('=== Testing Date Utilities ===\n');

// Test calculateDayDifference with various scenarios
console.log('1. Testing calculateDayDifference:');
const today = new Date().toISOString().split('T')[0];
console.log(`Today: ${today}`);

// Test today
const todayResult = calculateDayDifference(today);
console.log(`Today result:`, todayResult);

// Test future date (5 days from now)
const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const futureResult = calculateDayDifference(futureDate);
console.log(`Future (${futureDate}):`, futureResult);

// Test past date (5 days ago)
const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const pastResult = calculateDayDifference(pastDate);
console.log(`Past (${pastDate}):`, pastResult);

console.log('\n2. Testing formatDisplayDate:');
console.log(`${today} -> ${formatDisplayDate(today)}`);
console.log(`2024-01-01 -> ${formatDisplayDate('2024-01-01')}`);
console.log(`2024-12-25 -> ${formatDisplayDate('2024-12-25')}`);

console.log('\n3. Testing isValidDateString:');
const testDates = ['2024-03-15', '2024/03/15', '2024-13-01', '2024-02-29', '2023-02-29', 'invalid'];
testDates.forEach(date => {
  console.log(`${date} -> ${isValidDateString(date)}`);
});

console.log('\n4. Testing leap year detection:');
const testYears = [2024, 2023, 2020, 1900, 2000];
testYears.forEach(year => {
  console.log(`${year} -> ${isLeapYear(year)}`);
});

console.log('\n5. Testing getDaysInMonth:');
console.log(`February 2024 (leap): ${getDaysInMonth(2024, 2)} days`);
console.log(`February 2023 (non-leap): ${getDaysInMonth(2023, 2)} days`);
console.log(`April 2024: ${getDaysInMonth(2024, 4)} days`);

console.log('\n=== All tests completed ===');