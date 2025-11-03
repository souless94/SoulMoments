/**
 * Tests for database operations
 * Covers CRUD operations, validation, and error handling
 */

import { describe, test, expect, afterEach } from 'vitest';
import { 
  generateId
} from '../moments-db';
import { 
  DatabaseError, 
  validateMomentData,
  generateMomentId,
  isDatabaseInitialized,
  resetDatabase,
  markDatabaseInitialized,
  momentSchema,
  initTestDB
} from './test-utils';

// Alias for consistency in tests
const initDB = initTestDB;
const initializeDatabase = initTestDB;
import type { MomentDocument } from '../../schemas/moments.schema';

describe('Database Initialization', () => {
  afterEach(() => {
    resetDatabase();
  });

  test('initializes database successfully', async () => {
    const db = await initDB('test-db-init');
    expect(db).toBeDefined();
    expect(db.name).toBe('test-db-init');
    expect(db.collections.moments).toBeDefined();
  });

  test('creates database instances for tests', async () => {
    const db1 = await initDB('test-db-1');
    const db2 = await initDB('test-db-2');
    // Test databases should be separate instances with different names
    expect(db1.name).toBe('test-db-1');
    expect(db2.name).toBe('test-db-2');
    expect(db1).not.toBe(db2);
  });

  test('isDatabaseInitialized returns correct state', async () => {
    expect(isDatabaseInitialized()).toBe(false);
    await initDB('test-db-state');
    markDatabaseInitialized();
    expect(isDatabaseInitialized()).toBe(true);
    resetDatabase();
    expect(isDatabaseInitialized()).toBe(false);
  });

  test('resetDatabase clears instance', async () => {
    await initDB('test-db-reset');
    markDatabaseInitialized();
    expect(isDatabaseInitialized()).toBe(true);
    resetDatabase();
    expect(isDatabaseInitialized()).toBe(false);
  });

  test('initializeDatabase is alias for initDB', () => {
    expect(initializeDatabase).toBe(initDB);
  });
});

describe('ID Generation', () => {
  test('generateId creates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
  });

  test('generateMomentId is alias for generateId', () => {
    expect(generateMomentId).toBe(generateId);
  });

});

describe('Data Validation', () => {
  test('validates correct moment data', () => {
    const validData: Partial<MomentDocument> = {
      title: 'Test Moment',
      description: 'Test description',
      date: '2024-01-01',
      repeatFrequency: 'weekly'
    };

    expect(() => validateMomentData(validData)).not.toThrow();
  });

  test('validates minimal moment data', () => {
    const minimalData: Partial<MomentDocument> = {
      title: 'Test',
      date: '2024-01-01'
    };

    expect(() => validateMomentData(minimalData)).not.toThrow();
  });

  test('rejects empty title', () => {
    const invalidData = {
      title: '',
      date: '2024-01-01'
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Title is required');
  });

  test('rejects whitespace-only title', () => {
    const invalidData = {
      title: '   ',
      date: '2024-01-01'
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Title is required');
  });

  test('rejects title exceeding 100 characters', () => {
    const invalidData = {
      title: 'a'.repeat(101),
      date: '2024-01-01'
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Title must be 100 characters or less');
  });

  test('accepts title with exactly 100 characters', () => {
    const validData = {
      title: 'a'.repeat(100),
      date: '2024-01-01'
    };

    expect(() => validateMomentData(validData)).not.toThrow();
  });

  test('rejects description exceeding 200 characters', () => {
    const invalidData = {
      title: 'Test',
      description: 'a'.repeat(201),
      date: '2024-01-01'
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Description must be 200 characters or less');
  });

  test('accepts description with exactly 200 characters', () => {
    const validData = {
      title: 'Test',
      description: 'a'.repeat(200),
      date: '2024-01-01'
    };

    expect(() => validateMomentData(validData)).not.toThrow();
  });

  test('rejects missing date', () => {
    const invalidData = {
      title: 'Test'
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Date is required');
  });

  test('rejects invalid date format', () => {
    const invalidFormats = [
      '2024/01/01',
      '01-01-2024',
      '2024-1-1',
      'invalid-date'
    ];

    invalidFormats.forEach(date => {
      const invalidData = { title: 'Test', date };
      expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
      expect(() => validateMomentData(invalidData)).toThrow('Date must be in YYYY-MM-DD format');
    });
  });

  test('rejects invalid dates', () => {
    const invalidDates = [
      '2024-13-01', // Invalid month
      '2024-02-30', // Invalid day for February
      '2024-04-31'  // Invalid day for April
    ];

    invalidDates.forEach(date => {
      const invalidData = { title: 'Test', date };
      expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
      expect(() => validateMomentData(invalidData)).toThrow('Invalid date provided');
    });
  });

  test('accepts valid dates', () => {
    const validDates = [
      '2024-01-01',
      '2024-12-31',
      '2024-02-29', // Leap year
      '2023-02-28'  // Non-leap year
    ];

    validDates.forEach(date => {
      const validData = { title: 'Test', date };
      expect(() => validateMomentData(validData)).not.toThrow();
    });
  });

  test('rejects invalid repeat frequency', () => {
    const invalidData = {
      title: 'Test',
      date: '2024-01-01',
      repeatFrequency: 'invalid' as any
    };

    expect(() => validateMomentData(invalidData)).toThrow(DatabaseError);
    expect(() => validateMomentData(invalidData)).toThrow('Invalid repeat frequency');
  });

  test('accepts valid repeat frequencies', () => {
    const validFrequencies = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

    validFrequencies.forEach(frequency => {
      const validData = {
        title: 'Test',
        date: '2024-01-01',
        repeatFrequency: frequency as any
      };
      expect(() => validateMomentData(validData)).not.toThrow();
    });
  });
});

describe('DatabaseError', () => {
  test('creates error with message only', () => {
    const error = new DatabaseError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('DatabaseError');
    expect(error.operation).toBeUndefined();
    expect(error.originalError).toBeUndefined();
  });

  test('creates error with operation', () => {
    const error = new DatabaseError('Test error', 'create');
    expect(error.message).toBe('Test error');
    expect(error.operation).toBe('create');
  });

  test('creates error with original error', () => {
    const originalError = new Error('Original error');
    const error = new DatabaseError('Test error', 'update', originalError);
    expect(error.message).toBe('Test error');
    expect(error.operation).toBe('update');
    expect(error.originalError).toBe(originalError);
  });

  test('is instance of Error', () => {
    const error = new DatabaseError('Test error');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof DatabaseError).toBe(true);
  });
});

describe('Schema Export', () => {
  test('exports moment schema', () => {
    expect(momentSchema).toBeDefined();
    expect(momentSchema.title).toBe('moment schema');
    expect(momentSchema.version).toBe(0);
    expect(momentSchema.primaryKey).toBe('id');
    expect(momentSchema.type).toBe('object');
  });

  test('schema has required properties', () => {
    const requiredProps = ['id', 'title', 'date', 'repeatFrequency', 'createdAt', 'updatedAt'];
    expect(momentSchema.required).toEqual(requiredProps);
  });

  test('schema has correct property definitions', () => {
    const props = momentSchema.properties;
    
    expect(props.id.type).toBe('string');
    expect(props.id.maxLength).toBe(36);
    
    expect(props.title.type).toBe('string');
    expect(props.title.maxLength).toBe(100);
    
    expect(props.description?.type).toBe('string');
    expect(props.description?.maxLength).toBe(200);
    
    expect(props.date.type).toBe('string');
    expect(props.date.maxLength).toBe(10);
    
    expect(props.repeatFrequency.type).toBe('string');
    expect(props.repeatFrequency.enum).toEqual(['none', 'daily', 'weekly', 'monthly', 'yearly']);
    
    expect(props.createdAt.type).toBe('string');
    expect(props.createdAt.format).toBe('date-time');
    
    expect(props.updatedAt.type).toBe('string');
    expect(props.updatedAt.format).toBe('date-time');
  });

  test('schema has indexes defined', () => {
    expect(momentSchema.indexes).toContain('date');
    expect(momentSchema.indexes).toContain('createdAt');
    expect(momentSchema.indexes).toContain('repeatFrequency');
    
    // Check for compound index
    const hasCompoundIndex = momentSchema.indexes.some(index => 
      Array.isArray(index) && 
      index.length === 2 && 
      index[0] === 'repeatFrequency' && 
      index[1] === 'date'
    );
    expect(hasCompoundIndex).toBe(true);
  });
});