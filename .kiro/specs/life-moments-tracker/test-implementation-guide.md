# Test Implementation Guide

## File Structure
```
tests/
├── e2e/                          # Playwright E2E tests
│   ├── moment-lifecycle.spec.ts  # Core CRUD operations
│   ├── repeat-events.spec.ts     # Repeat functionality
│   ├── offline.spec.ts           # PWA offline tests
│   └── mobile-ux.spec.ts         # Touch interactions
├── unit/                         # Vitest unit tests
│   ├── date-utils.test.ts        # Date calculations
│   ├── validation.test.ts        # Form validation
│   └── database.test.ts          # Database operations
└── integration/                  # Component integration
    ├── form-integration.test.ts  # Form + DB integration
    └── reactive-ui.test.ts       # UI reactivity tests
```

## Priority Implementation Order

### 1. Essential E2E Tests (Start Here)

#### `tests/e2e/moment-lifecycle.spec.ts`
```typescript
// Test the complete user journey
test('user can create, view, edit, and delete moments', async ({ page }) => {
  // 1. Navigate to app
  // 2. Click floating add button
  // 3. Fill form (title, description, date)
  // 4. Submit and verify moment appears in grid
  // 5. Click edit button on moment tile
  // 6. Modify details and save
  // 7. Verify changes reflected in grid
  // 8. Click delete button
  // 9. Verify undo toast appears
  // 10. Test both undo and confirm deletion
});
```

#### `tests/e2e/offline.spec.ts`
```typescript
// Test PWA offline functionality
test('app works offline and syncs when back online', async ({ page, context }) => {
  // 1. Load app online
  // 2. Go offline (context.setOffline(true))
  // 3. Create new moment
  // 4. Verify moment saved locally
  // 5. Refresh page while offline
  // 6. Verify moment still exists
  // 7. Go back online
  // 8. Verify data persists
});
```

### 2. Critical Unit Tests

#### `tests/unit/date-utils.test.ts`
```typescript
describe('calculateDayDifference', () => {
  test('returns negative for past dates', () => {
    const pastDate = '2024-01-01';
    const result = calculateDayDifference(pastDate);
    expect(result.daysDifference).toBeLessThan(0);
    expect(result.status).toBe('past');
  });

  test('returns 0 for today', () => {
    const today = new Date().toISOString().split('T')[0];
    const result = calculateDayDifference(today);
    expect(result.daysDifference).toBe(0);
    expect(result.status).toBe('today');
  });

  test('handles repeat events correctly', () => {
    const pastDate = '2024-01-01';
    const result = calculateDayDifference(pastDate, 'monthly');
    expect(result.status).toBe('future'); // Should be upcoming
    expect(result.nextOccurrence).toBeDefined();
  });
});
```

### 3. Form Validation Tests

#### `tests/unit/validation.test.ts`
```typescript
import { momentFormSchema } from '@/schemas/moments.schema';

describe('Moment Form Validation', () => {
  test('accepts valid moment data', () => {
    const validData = {
      title: 'Test Moment',
      description: 'Test description',
      date: '2024-12-25',
      repeatFrequency: 'none' as const
    };
    
    expect(() => momentFormSchema.parse(validData)).not.toThrow();
  });

  test('rejects empty title', () => {
    const invalidData = {
      title: '',
      date: '2024-12-25',
      repeatFrequency: 'none' as const
    };
    
    expect(() => momentFormSchema.parse(invalidData)).toThrow();
  });

  test('rejects title over 100 characters', () => {
    const invalidData = {
      title: 'a'.repeat(101),
      date: '2024-12-25',
      repeatFrequency: 'none' as const
    };
    
    expect(() => momentFormSchema.parse(invalidData)).toThrow();
  });
});
```

## Quick Start Commands

### Install Playwright
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### Create Playwright Config
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    // PWA-specific settings
    viewport: { width: 375, height: 667 }, // Mobile first
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['iPhone 12'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### Update package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test && npm run test:e2e"
  }
}
```

## Test Data Factories

Create reusable test data:

```typescript
// tests/factories/moment-factory.ts
export const createMomentData = (overrides = {}) => ({
  id: `test-${Date.now()}-${Math.random()}`,
  title: 'Test Moment',
  description: 'Test description',
  date: '2024-12-25',
  repeatFrequency: 'none' as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides
});

export const createPastMoment = () => createMomentData({
  title: 'Past Moment',
  date: '2024-01-01'
});

export const createFutureMoment = () => createMomentData({
  title: 'Future Moment',
  date: '2025-12-25'
});

export const createRepeatingMoment = (frequency = 'monthly') => createMomentData({
  title: 'Repeating Moment',
  repeatFrequency: frequency
});
```

## Running Tests

### Development Workflow
```bash
# Run unit tests in watch mode while developing
npm run test:watch

# Run E2E tests with UI for debugging
npm run test:e2e:ui

# Run all tests before committing
npm run test:all
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm start &
      - run: npm run test:e2e
```

## Success Metrics

### Coverage Goals
- **Unit Tests**: 80%+ coverage on utilities and business logic
- **E2E Tests**: 100% coverage of critical user journeys
- **Integration Tests**: Key component interactions covered

### Quality Gates
- All tests must pass before merge
- No regressions in existing functionality
- New features must include corresponding tests
- Performance tests should not regress

## Next Steps

1. **Start with one E2E test**: Implement the complete moment lifecycle test first
2. **Add unit tests for date utilities**: These are critical for app functionality
3. **Gradually expand coverage**: Add more tests as you identify edge cases
4. **Monitor test performance**: Keep tests fast and reliable
5. **Regular maintenance**: Update tests when features change

This focused approach will give you confidence in your core functionality without over-testing implementation details.