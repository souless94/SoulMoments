/**
 * Tests for database configuration and initialization
 * Tests RxDB setup with Dexie.js storage and schema validation
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeDatabase,
  closeDatabase,
  isDatabaseInitialized,
  generateMomentId,
  validateMomentData,
  DatabaseError,
  momentSchema
} from '../moments-db';
import type { MomentDocument } from '@/types/moment';

// Mock RxDB and Dexie for testing
vi.mock('rxdb', () => ({
  createRxDatabase: vi.fn(),
  addRxPlugin: vi.fn(),
}));

vi.mock('rxdb/plugins/storage-dexie', () => ({
  getRxStorageDexie: vi.fn(() => 'mock-storage'),
}));

vi.mock('rxdb/plugins/dev-mode', () => ({
  RxDBDevModePlugin: 'mock-dev-plugin',
}));

vi.mock('rxdb/plugins/query-builder', () => ({
  RxDBQueryBuilderPlugin: 'mock-query-plugin',
}));

describe('Database Configuration', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  test('schema has correct structure', () => {
    expect(momentSchema.version).toBe(0);
    expect(momentSchema.primaryKey).toBe('id');
    expect(momentSchema.type).toBe('object');
    
    // Check required fields
    expect(momentSchema.required).toEqual([
      'id', 'title', 'date', 'repeatFrequency', 'createdAt', 'updatedAt'
    ]);
    
    // Check properties
    expect(momentSchema.properties.id.type).toBe('string');
    expect(momentSchema.properties.title.maxLength).toBe(100);
    expect(momentSchema.properties.description.maxLength).toBe(200);
    expect(momentSchema.properties.repeatFrequency.enum).toEqual([
      'none', 'daily', 'weekly', 'monthly', 'yearly'
    ]);
    
    // Check indexes
    expect(momentSchema.indexes).toContain('date');
    expect(momentSchema.indexes).toContain('createdAt');
    expect(momentSchema.indexes).toContain('repeatFrequency');
  });

  test('generateMomentId creates unique IDs', () => {
    const id1 = generateMomentId();
    const id2 = generateMomentId();
    
    expect(id1).toBeTruthy();
    expect(id2).toBeTruthy();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  test('isDatabaseInitialized returns false initially', () => {
    expect(isDatabaseInitialized()).toBe(false);
  });
});

describe('Data Validation', () => {
  test('validateMomentData accepts valid data', () => {
    const validData: Partial<MomentDocument> = {
      title: 'Test Moment',
      description: 'Test description',
      date: '2024-03-15',
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(validData)).not.toThrow();
  });

  test('validateMomentData rejects empty title', () => {
    const invalidData: Partial<MomentDocument> = {
      title: '',
      date: '2024-03-15',
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Title is required');
  });

  test('validateMomentData rejects title too long', () => {
    const invalidData: Partial<MomentDocument> = {
      title: 'a'.repeat(101), // 101 characters
      date: '2024-03-15',
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Title must be 100 characters or less');
  });

  test('validateMomentData rejects description too long', () => {
    const invalidData: Partial<MomentDocument> = {
      title: 'Test',
      description: 'a'.repeat(201), // 201 characters
      date: '2024-03-15',
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Description must be 200 characters or less');
  });

  test('validateMomentData rejects missing date', () => {
    const invalidData: Partial<MomentDocument> = {
      title: 'Test',
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Date is required');
  });

  test('validateMomentData rejects invalid date format', () => {
    const invalidData: Partial<MomentDocument> = {
      title: 'Test',
      date: '2024/03/15', // Wrong format
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Date must be in YYYY-MM-DD format');
  });

  test('validateMomentData rejects invalid date', () => {
    const invalidData: Partial<MomentDocument> = {
      title: 'Test',
      date: '2024-02-30', // Invalid date
      repeatFrequency: 'none',
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Invalid date provided');
  });

  test('validateMomentData rejects invalid repeat frequency', () => {
    const invalidData: Partial<MomentDocument> = {
      title: 'Test',
      date: '2024-03-15',
      repeatFrequency: 'invalid' as RepeatFrequency,
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Invalid repeat frequency');
  });

  test('validateMomentData accepts all valid repeat frequencies', () => {
    const frequencies = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
    
    frequencies.forEach(frequency => {
      const validData: Partial<MomentDocument> = {
        title: 'Test',
        date: '2024-03-15',
        repeatFrequency: frequency as RepeatFrequency,
      };

      expect(() => validateMomentData(validData)).not.toThrow();
    });
  });

  test('validateMomentData accepts optional description', () => {
    const validData: Partial<MomentDocument> = {
      title: 'Test',
      date: '2024-03-15',
      repeatFrequency: 'none',
      // No description
    };

    expect(() => validateMomentData(validData)).not.toThrow();
  });
});

describe('DatabaseError', () => {
  test('creates error with correct properties', () => {
    const originalError = new Error('Original error');
    const dbError = new DatabaseError('Test message', 'test-operation', originalError);

    expect(dbError.message).toBe('Test message');
    expect(dbError.operation).toBe('test-operation');
    expect(dbError.originalError).toBe(originalError);
    expect(dbError.name).toBe('DatabaseError');
    expect(dbError instanceof Error).toBe(true);
  });

  test('creates error without original error', () => {
    const dbError = new DatabaseError('Test message', 'test-operation');

    expect(dbError.message).toBe('Test message');
    expect(dbError.operation).toBe('test-operation');
    expect(dbError.originalError).toBeUndefined();
  });
});