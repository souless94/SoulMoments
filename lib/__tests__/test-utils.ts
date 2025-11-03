/**
 * Test utilities for database and validation testing
 */

import type { MomentDocument } from '../../schemas/moments.schema';
import { generateId } from '../moments-db';

// Export schema for tests
export { momentSchema } from '../../schemas/moments.schema';

// Test-only database utilities
export const generateMomentId = generateId;

// Test database initialization with custom names and settings
export async function initTestDB(dbName?: string) {
  const { createRxDatabase } = await import('rxdb/plugins/core');
  const { getRxStorageDexie } = await import('rxdb/plugins/storage-dexie');
  const { wrappedKeyCompressionStorage } = await import('rxdb/plugins/key-compression');
  const { momentSchema } = await import('../../schemas/moments.schema');
  
  // Use the same storage configuration as the main app
  const storage = wrappedKeyCompressionStorage({
    storage: getRxStorageDexie()
  });
  
  const db = await createRxDatabase({
    name: dbName || `test-db-${Date.now()}`,
    storage: storage,
    multiInstance: false,
    ignoreDuplicate: true, // Allow duplicate database names for tests
  });

  await db.addCollections({
    moments: { schema: momentSchema },
  });

  return db;
}

// For tests, we'll track database state separately
let testDbInitialized = false;

export function isDatabaseInitialized(): boolean {
  return testDbInitialized;
}

export function resetDatabase(): void {
  testDbInitialized = false;
}

export function markDatabaseInitialized(): void {
  testDbInitialized = true;
}

// Alias for consistency with old API
export { initDB as initializeDatabase } from '../moments-db';

// Custom error class for database operations (used in tests)
export class DatabaseError extends Error {
  public operation?: string;
  public originalError?: Error;

  constructor(message: string, operation?: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
    this.operation = operation;
    this.originalError = originalError;
  }
}

// Validation function for moment data (test-only utility)
export function validateMomentData(data: Partial<MomentDocument>): void {
  if (!data.title || data.title.trim() === '') {
    throw new DatabaseError('Title is required', 'validation');
  }

  if (data.title.length > 100) {
    throw new DatabaseError('Title must be 100 characters or less', 'validation');
  }

  if (data.description && data.description.length > 200) {
    throw new DatabaseError('Description must be 200 characters or less', 'validation');
  }

  if (!data.date) {
    throw new DatabaseError('Date is required', 'validation');
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date)) {
    throw new DatabaseError('Date must be in YYYY-MM-DD format', 'validation');
  }

  // Validate actual date
  const dateObj = new Date(data.date);
  if (isNaN(dateObj.getTime()) || dateObj.toISOString().split('T')[0] !== data.date) {
    throw new DatabaseError('Invalid date provided', 'validation');
  }

  // Validate repeat frequency
  const validFrequencies = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
  if (data.repeatFrequency && !validFrequencies.includes(data.repeatFrequency)) {
    throw new DatabaseError('Invalid repeat frequency', 'validation');
  }
}