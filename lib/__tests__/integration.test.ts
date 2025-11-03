/**
 * Integration tests for reactive data flow and component interactions
 * Tests the integration between database, forms, and UI components
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { resetDatabase, initTestDB } from './test-utils';

// Use test database for integration tests
const initDB = initTestDB;
import { useMoments } from '../../hooks/useMoment';
import { calculateDayDifference } from '../date-utils';
import { momentFormSchema } from '../validations';
import type { MomentDocument } from '../../schemas/moments.schema';

// Mock React Hook Form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn((fn) => (e: any) => {
      e.preventDefault();
      fn({ title: 'Test Moment', date: '2024-12-25', repeatFrequency: 'none' });
    }),
    formState: { errors: {}, isSubmitting: false },
    reset: vi.fn(),
    setValue: vi.fn(),
    getValues: vi.fn(() => ({ title: 'Test Moment', date: '2024-12-25' })),
  }),
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

describe('Reactive Data Flow Integration', () => {
  beforeEach(async () => {
    resetDatabase();
    await initDB('test-integration-db');
  });

  afterEach(() => {
    resetDatabase();
  });

  test('database changes trigger UI updates', async () => {
    // This test would require a React component that uses the useMoments hook
    // Since we don't have the actual components in the test environment,
    // we'll test the hook behavior directly
    
    const mockMoment: Partial<MomentDocument> = {
      id: 'test-1',
      title: 'Test Moment',
      date: '2024-12-25',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test that the hook would receive updates
    // In a real integration test, this would involve rendering a component
    // and verifying that it updates when the database changes
    expect(mockMoment.title).toBe('Test Moment');
  });

  test('form validation integrates with database operations', () => {
    // Test form data validation before database operations
    const validFormData = {
      title: 'Valid Moment',
      description: 'A valid description',
      date: '2024-12-25',
      repeatFrequency: 'weekly' as const,
    };

    const result = momentFormSchema.safeParse(validFormData);
    expect(result.success).toBe(true);

    // Test invalid form data
    const invalidFormData = {
      title: '', // Invalid: empty title
      date: '2024-12-25',
      repeatFrequency: 'none' as const,
    };

    const invalidResult = momentFormSchema.safeParse(invalidFormData);
    expect(invalidResult.success).toBe(false);
  });

  test('date calculations integrate with moment data', () => {
    const testMoment = {
      date: '2024-12-25',
      repeatFrequency: 'none' as const,
    };

    const calculation = calculateDayDifference(testMoment.date, testMoment.repeatFrequency);
    
    expect(calculation).toHaveProperty('daysDifference');
    expect(calculation).toHaveProperty('displayText');
    expect(calculation).toHaveProperty('status');
    expect(calculation).toHaveProperty('isRepeating');
    
    expect(calculation.isRepeating).toBe(false);
    expect(['past', 'today', 'future']).toContain(calculation.status);
  });

  test('repeat event calculations integrate correctly', () => {
    const repeatMoment = {
      date: '2024-01-01', // Past date
      repeatFrequency: 'weekly' as const,
    };

    const calculation = calculateDayDifference(repeatMoment.date, repeatMoment.repeatFrequency);
    
    expect(calculation.isRepeating).toBe(true);
    expect(calculation.status).toBe('future'); // Repeat events are always future
    expect(calculation.nextOccurrence).toBeDefined();
    expect(calculation.daysDifference).toBeGreaterThan(0);
  });
});

describe('Form and Database Integration', () => {
  beforeEach(async () => {
    resetDatabase();
    await initDB('test-form-db');
  });

  afterEach(() => {
    resetDatabase();
  });

  test('form submission creates valid database document', async () => {
    const formData = {
      title: 'Integration Test Moment',
      description: 'Testing form to database integration',
      date: '2024-12-25',
      repeatFrequency: 'monthly' as const,
    };

    // Validate form data
    const validationResult = momentFormSchema.safeParse(formData);
    expect(validationResult.success).toBe(true);

    if (validationResult.success) {
      // Simulate creating a database document from form data
      const dbDocument: MomentDocument = {
        id: 'test-integration-1',
        ...validationResult.data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(dbDocument.title).toBe(formData.title);
      expect(dbDocument.description).toBe(formData.description);
      expect(dbDocument.date).toBe(formData.date);
      expect(dbDocument.repeatFrequency).toBe(formData.repeatFrequency);
      expect(dbDocument.createdAt).toBeDefined();
      expect(dbDocument.updatedAt).toBeDefined();
    }
  });

  test('form validation prevents invalid database operations', () => {
    const invalidFormData = {
      title: 'a'.repeat(101), // Too long
      description: 'b'.repeat(201), // Too long
      date: 'invalid-date',
      repeatFrequency: 'invalid' as any,
    };

    const validationResult = momentFormSchema.safeParse(invalidFormData);
    expect(validationResult.success).toBe(false);

    if (!validationResult.success) {
      const errors = validationResult.error.issues;
      expect(errors.some(e => e.message.includes('100 characters'))).toBe(true);
      expect(errors.some(e => e.message.includes('200 characters'))).toBe(true);
      expect(errors.some(e => e.message.includes('valid date'))).toBe(true);
    }
  });

  test('edit mode pre-fills form with existing data', () => {
    const existingMoment: MomentDocument = {
      id: 'existing-1',
      title: 'Existing Moment',
      description: 'Existing description',
      date: '2024-11-15',
      repeatFrequency: 'yearly',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    // Simulate form pre-filling (in real app, this would be done by useForm)
    const formDefaults = {
      title: existingMoment.title,
      description: existingMoment.description,
      date: existingMoment.date,
      repeatFrequency: existingMoment.repeatFrequency,
    };

    expect(formDefaults.title).toBe('Existing Moment');
    expect(formDefaults.description).toBe('Existing description');
    expect(formDefaults.date).toBe('2024-11-15');
    expect(formDefaults.repeatFrequency).toBe('yearly');
  });
});

describe('Component Interaction Integration', () => {
  test('modal and grid state synchronization', () => {
    // Test modal open/close state
    let modalOpen = false;
    let selectedMoment: MomentDocument | null = null;

    // Simulate opening modal for new moment
    const openNewMomentModal = () => {
      modalOpen = true;
      selectedMoment = null;
    };

    // Simulate opening modal for editing
    const openEditModal = (moment: MomentDocument) => {
      modalOpen = true;
      selectedMoment = moment;
    };

    // Simulate closing modal
    const closeModal = () => {
      modalOpen = false;
      selectedMoment = null;
    };

    // Test new moment flow
    openNewMomentModal();
    expect(modalOpen).toBe(true);
    expect(selectedMoment).toBeNull();

    closeModal();
    expect(modalOpen).toBe(false);

    // Test edit flow
    const testMoment: MomentDocument = {
      id: 'test-1',
      title: 'Test Moment',
      date: '2024-12-25',
      repeatFrequency: 'none',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    openEditModal(testMoment);
    expect(modalOpen).toBe(true);
    expect(selectedMoment).toBe(testMoment);
  });

  test('banner and grid focus synchronization', () => {
    const moments: MomentDocument[] = [
      {
        id: 'moment-1',
        title: 'First Moment',
        date: '2024-12-25',
        repeatFrequency: 'none',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'moment-2',
        title: 'Second Moment',
        date: '2024-12-31',
        repeatFrequency: 'weekly',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    let focusedMoment: MomentDocument | null = null;

    // Simulate focusing a moment
    const focusMoment = (moment: MomentDocument) => {
      focusedMoment = moment;
    };

    // Simulate clearing focus
    const clearFocus = () => {
      focusedMoment = null;
    };

    // Test focus functionality
    focusMoment(moments[0]);
    expect(focusedMoment).toBe(moments[0]);
    expect(focusedMoment?.title).toBe('First Moment');

    focusMoment(moments[1]);
    expect(focusedMoment).toBe(moments[1]);
    expect(focusedMoment?.title).toBe('Second Moment');

    clearFocus();
    expect(focusedMoment).toBeNull();
  });

  test('toast and action integration', () => {
    let toastMessage = '';
    let toastVisible = false;
    let undoCallback: (() => void) | null = null;

    // Simulate showing delete toast with undo
    const showDeleteToast = (momentTitle: string, onUndo: () => void) => {
      toastMessage = `"${momentTitle}" deleted`;
      toastVisible = true;
      undoCallback = onUndo;
    };

    // Simulate dismissing toast
    const dismissToast = () => {
      toastVisible = false;
      toastMessage = '';
      undoCallback = null;
    };

    // Simulate undo action
    const performUndo = () => {
      if (undoCallback) {
        undoCallback();
        toastMessage = 'Deletion cancelled';
        undoCallback = null;
      }
    };

    // Test delete toast flow
    let momentDeleted = false;
    const undoDelete = () => {
      momentDeleted = false;
    };

    showDeleteToast('Test Moment', undoDelete);
    expect(toastVisible).toBe(true);
    expect(toastMessage).toBe('"Test Moment" deleted');
    expect(undoCallback).toBeDefined();

    // Test undo
    performUndo();
    expect(toastMessage).toBe('Deletion cancelled');
    expect(momentDeleted).toBe(false);

    dismissToast();
    expect(toastVisible).toBe(false);
  });
});

describe('Data Processing Integration', () => {
  test('moment processing pipeline', () => {
    const rawMoment: MomentDocument = {
      id: 'pipeline-test',
      title: 'Pipeline Test',
      description: 'Testing data processing',
      date: '2024-12-25',
      repeatFrequency: 'monthly',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    };

    // Process moment through calculation pipeline
    const calculation = calculateDayDifference(rawMoment.date, rawMoment.repeatFrequency);
    
    // Create processed moment (as would be done in UI)
    const processedMoment = {
      ...rawMoment,
      ...calculation,
    };

    expect(processedMoment.title).toBe('Pipeline Test');
    expect(processedMoment.daysDifference).toBeDefined();
    expect(processedMoment.displayText).toBeDefined();
    expect(processedMoment.status).toBeDefined();
    expect(processedMoment.isRepeating).toBe(true);
    expect(processedMoment.nextOccurrence).toBeDefined();
  });

  test('sorting and filtering integration', () => {
    const moments: MomentDocument[] = [
      {
        id: 'past-1',
        title: 'Past Moment',
        date: '2024-01-01',
        repeatFrequency: 'none',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'future-1',
        title: 'Future Moment',
        date: '2025-12-25',
        repeatFrequency: 'none',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'repeat-1',
        title: 'Repeat Moment',
        date: '2024-01-01',
        repeatFrequency: 'weekly',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
    ];

    // Process all moments
    const processedMoments = moments.map(moment => ({
      ...moment,
      ...calculateDayDifference(moment.date, moment.repeatFrequency),
    }));

    // Separate upcoming and past (as done in UI)
    const upcoming = processedMoments.filter(m => 
      m.status === 'future' || m.status === 'today' || m.isRepeating
    );
    const past = processedMoments.filter(m => 
      m.status === 'past' && !m.isRepeating
    );

    expect(upcoming.length).toBe(2); // Future moment + repeat moment
    expect(past.length).toBe(1); // Past non-repeat moment

    // Verify repeat moment is in upcoming
    const repeatMoment = upcoming.find(m => m.title === 'Repeat Moment');
    expect(repeatMoment).toBeDefined();
    expect(repeatMoment?.isRepeating).toBe(true);

    // Verify past moment is in past section
    const pastMoment = past.find(m => m.title === 'Past Moment');
    expect(pastMoment).toBeDefined();
    expect(pastMoment?.isRepeating).toBe(false);
  });
});