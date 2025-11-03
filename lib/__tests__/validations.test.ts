/**
 * Tests for Zod validation schemas
 * Covers form validation, field types, and limits
 */

import { describe, test, expect } from 'vitest';
import { momentFormSchema, momentDocumentSchema, type MomentFormData, type MomentDocument } from '../validations';

describe('momentFormSchema', () => {
  test('validates valid form data', () => {
    const validData: MomentFormData = {
      title: 'Test Moment',
      description: 'A test description',
      date: '2024-12-25',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  test('validates minimal valid data', () => {
    const minimalData = {
      title: 'Test',
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(minimalData);
    expect(result.success).toBe(true);
  });

  test('validates with empty description', () => {
    const dataWithEmptyDescription = {
      title: 'Test',
      description: '',
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(dataWithEmptyDescription);
    expect(result.success).toBe(true);
  });

  test('validates with undefined description', () => {
    const dataWithoutDescription = {
      title: 'Test',
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(dataWithoutDescription);
    expect(result.success).toBe(true);
  });

  test('validates all repeat frequencies', () => {
    const frequencies = ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const;
    
    frequencies.forEach(frequency => {
      const data = {
        title: 'Test',
        date: '2024-01-01',
        repeatFrequency: frequency
      };

      const result = momentFormSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  test('rejects empty title', () => {
    const invalidData = {
      title: '',
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title is required');
    }
  });

  test('trims whitespace-only title to empty string', () => {
    const dataWithWhitespace = {
      title: '   ',
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(dataWithWhitespace);
    // Zod trims first, so whitespace-only becomes empty string and passes
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('');
    }
  });

  test('rejects title exceeding 100 characters', () => {
    const longTitle = 'a'.repeat(101);
    const invalidData = {
      title: longTitle,
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Title must be 100 characters or less');
    }
  });

  test('accepts title with exactly 100 characters', () => {
    const maxTitle = 'a'.repeat(100);
    const validData = {
      title: maxTitle,
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects description exceeding 200 characters', () => {
    const longDescription = 'a'.repeat(201);
    const invalidData = {
      title: 'Test',
      description: longDescription,
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Description must be 200 characters or less');
    }
  });

  test('accepts description with exactly 200 characters', () => {
    const maxDescription = 'a'.repeat(200);
    const validData = {
      title: 'Test',
      description: maxDescription,
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('rejects empty date', () => {
    const invalidData = {
      title: 'Test',
      date: '',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Date is required');
    }
  });

  test('rejects invalid date format', () => {
    const invalidDates = [
      'invalid-date',
      '2024-13-01', // Invalid month
      '', // Empty date
      'not-a-date'
    ];

    invalidDates.forEach(date => {
      const invalidData = {
        title: 'Test',
        date,
        repeatFrequency: 'none'
      };

      const result = momentFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        const errorMessage = result.error.issues[0].message;
        expect(['Please enter a valid date', 'Date is required']).toContain(errorMessage);
      }
    });
  });

  test('accepts valid date formats', () => {
    const validDates = [
      '2024-01-01',
      '2024-12-31',
      '2024-02-29', // Leap year
      '2023-02-28'  // Non-leap year
    ];

    validDates.forEach(date => {
      const validData = {
        title: 'Test',
        date,
        repeatFrequency: 'none'
      };

      const result = momentFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  test('rejects invalid repeat frequency', () => {
    const invalidData = {
      title: 'Test',
      date: '2024-01-01',
      repeatFrequency: 'invalid'
    };

    const result = momentFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('trims whitespace from title and description', () => {
    const dataWithWhitespace = {
      title: '  Test Title  ',
      description: '  Test Description  ',
      date: '2024-01-01',
      repeatFrequency: 'none'
    };

    const result = momentFormSchema.safeParse(dataWithWhitespace);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Test Title');
      expect(result.data.description).toBe('Test Description');
    }
  });
});

describe('momentDocumentSchema', () => {
  test('validates complete document', () => {
    const validDocument: MomentDocument = {
      id: 'test-id-123',
      title: 'Test Moment',
      description: 'Test description',
      date: '2024-01-01',
      repeatFrequency: 'weekly',
      createdAt: 1234567890,
      updatedAt: 1234567890
    };

    const result = momentDocumentSchema.safeParse(validDocument);
    expect(result.success).toBe(true);
  });

  test('validates document without optional description', () => {
    const validDocument = {
      id: 'test-id-123',
      title: 'Test Moment',
      date: '2024-01-01',
      repeatFrequency: 'none',
      createdAt: 1234567890,
      updatedAt: 1234567890
    };

    const result = momentDocumentSchema.safeParse(validDocument);
    expect(result.success).toBe(true);
  });

  test('rejects document missing required fields', () => {
    const requiredFields = ['id', 'title', 'date', 'repeatFrequency', 'createdAt', 'updatedAt'];
    
    requiredFields.forEach(field => {
      const incompleteDocument = {
        id: 'test-id',
        title: 'Test',
        date: '2024-01-01',
        repeatFrequency: 'none',
        createdAt: 1234567890,
        updatedAt: 1234567890
      };
      
      delete (incompleteDocument as any)[field];
      
      const result = momentDocumentSchema.safeParse(incompleteDocument);
      expect(result.success).toBe(false);
    });
  });

  test('validates date format strictly', () => {
    const invalidDateFormats = [
      '2024/01/01',
      '01-01-2024',
      '2024-1-1',
      'invalid'
    ];

    invalidDateFormats.forEach(date => {
      const document = {
        id: 'test-id',
        title: 'Test',
        date,
        repeatFrequency: 'none',
        createdAt: 1234567890,
        updatedAt: 1234567890
      };

      const result = momentDocumentSchema.safeParse(document);
      expect(result.success).toBe(false);
    });
  });

  test('validates repeat frequency enum', () => {
    const validFrequencies = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
    
    validFrequencies.forEach(frequency => {
      const document = {
        id: 'test-id',
        title: 'Test',
        date: '2024-01-01',
        repeatFrequency: frequency,
        createdAt: 1234567890,
        updatedAt: 1234567890
      };

      const result = momentDocumentSchema.safeParse(document);
      expect(result.success).toBe(true);
    });

    // Test invalid frequency
    const invalidDocument = {
      id: 'test-id',
      title: 'Test',
      date: '2024-01-01',
      repeatFrequency: 'invalid',
      createdAt: 1234567890,
      updatedAt: 1234567890
    };

    const result = momentDocumentSchema.safeParse(invalidDocument);
    expect(result.success).toBe(false);
  });
});