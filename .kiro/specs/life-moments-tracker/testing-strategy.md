# Testing Strategy for Life Moments Tracker

## Overview
This document outlines the essential tests needed for the Life Moments Tracker PWA, focusing on core functionality and user workflows.

## Testing Approach
- **E2E Tests**: Critical user journeys and PWA functionality
- **Unit Tests**: Core business logic and utilities
- **Integration Tests**: Database operations and component interactions

---

## E2E Tests (Priority: High)

### 1. Core User Journey Tests
- [ ] **Complete Moment Lifecycle**
  - Create a new moment with title, description, date
  - View moment in grid
  - Edit moment details
  - Delete moment with undo functionality
  - Verify moment persistence

- [ ] **Moment Management Workflow**
  - Add multiple moments with different dates (past, today, future)
  - Verify correct sorting (upcoming first, then past)
  - Test moment focus functionality (click to focus in banner)
  - Verify banner updates with focused moment countdown

- [ ] **Repeat Events Workflow**
  - Create moments with different repeat frequencies (daily, weekly, monthly, yearly)
  - Verify repeat events show in upcoming section
  - Check repeat indicator icons display correctly
  - Validate next occurrence calculations

### 2. PWA Functionality Tests
- [ ] **Offline Functionality**
  - Create moments while offline
  - Verify data persists when going back online
  - Test app works without internet connection

- [ ] **Installation & Performance**
  - Test app loads quickly from home screen
  - Verify service worker caching works

---

## Unit Tests (Priority: Medium)

### 1. Date Utilities (`lib/date-utils.ts`)
- [ ] **Day Difference Calculations**
  - Test `calculateDayDifference` with past, present, future dates
  - Verify correct status assignment (past/today/future)
  - Test edge cases (leap years, month boundaries)

- [ ] **Repeat Event Logic**
  - Test `calculateNextOccurrence` for all repeat frequencies
  - Verify repeat events always show as upcoming
  - Test edge cases (end of month, leap years)

- [ ] **Display Text Generation**
  - Test "X days ago", "Today", "X days until" formatting
  - Verify correct pluralization
  - Test boundary cases (1 day vs multiple days)

### 2. Database Operations (`lib/moments-db.ts`)
- [ ] **CRUD Operations**
  - Test moment creation with all fields
  - Test moment retrieval and querying
  - Test moment updates
  - Test moment deletion

- [ ] **Data Validation**
  - Test `validateMomentData` function
  - Test `DatabaseError` class functionality
  - Test ID generation uniqueness

---

## Integration Tests (Priority: Medium)

### 1. Database + UI Integration
- [ ] **Reactive Data Flow**
  - Test moments list updates when data changes
  - Verify banner updates with data changes
  - Test focused moment state management

- [ ] **Form + Database Integration**
  - Test form submission creates database records
  - Test form validation errors display correctly
  - Test edit mode pre-fills form with existing data

### 2. Component Integration
- [ ] **Modal + Grid Interaction**
  - Test edit button opens modal with correct data
  - Test modal save updates grid display
  - Test modal cancel preserves original data

- [ ] **Banner + Grid Interaction**
  - Test clicking moment tile focuses it in banner
  - Test banner shows correct countdown for focused moment
  - Test banner statistics update with data changes

---

## Test Implementation Priority

### Phase 1: Essential E2E Tests
1. Complete moment lifecycle (create → view → edit → delete)
2. Offline functionality basics
3. Mobile touch interactions

### Phase 2: Core Unit Tests
1. Date utilities (most critical business logic)
2. Form validation
3. Database CRUD operations

### Phase 3: Integration & Polish
1. Reactive data flow tests
2. PWA installation tests
3. Performance and edge case tests

---

## Test Tools & Setup

### Recommended Stack
- **E2E**: Playwright (better PWA support than Cypress)
- **Unit**: Vitest (already configured)
- **Component**: Testing Library React (for integration tests)

### Test Data Strategy
- Use factory functions for consistent test data
- Create realistic test scenarios (mix of past/future dates)
- Include edge cases (leap years, month boundaries)

---

## Success Criteria

### Must Have
- [ ] All core user journeys work end-to-end
- [ ] Offline functionality verified
- [ ] Date calculations are accurate
- [ ] Form validation prevents invalid data

## Notes
- Focus on testing user value, not implementation details
- Prioritize tests that catch regressions in core functionality
- Keep tests maintainable and fast-running
- Use realistic test data that matches actual usage patterns