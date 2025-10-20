/**
 * RxDB Database Configuration with Dexie.js Storage
 * Sets up the Life Moments Tracker database with reactive queries and offline support
 */

import { 
  createRxDatabase, 
  RxDatabase, 
  RxCollection, 
  RxDocument,
  addRxPlugin
} from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder';
import { MomentDocument, RepeatFrequency } from '@/types/moment';

// Add RxDB plugins for development and enhanced functionality
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin);
}
addRxPlugin(RxDBQueryBuilderPlugin);

/**
 * RxDB schema for moment documents
 * Includes validation for all fields including repeat frequency enum
 */
export const momentSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: {
      type: 'string',
      maxLength: 36, // UUID length
    },
    title: {
      type: 'string',
      maxLength: 100,
    },
    description: {
      type: 'string',
      maxLength: 200,
    },
    date: {
      type: 'string',
      format: 'date', // YYYY-MM-DD format
    },
    repeatFrequency: {
      type: 'string',
      enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'],
      default: 'none',
    },
    createdAt: {
      type: 'number',
    },
    updatedAt: {
      type: 'number',
    },
  },
  required: ['id', 'title', 'date', 'repeatFrequency', 'createdAt', 'updatedAt'],
  indexes: [
    'date',        // Index for date-based queries
    'createdAt',   // Index for chronological sorting
    'repeatFrequency', // Index for filtering repeat events
    ['repeatFrequency', 'date'], // Compound index for efficient repeat event queries
  ],
} as const;

/**
 * TypeScript interfaces for RxDB collections and documents
 */
export type MomentDocumentType = MomentDocument;
export type MomentRxDocument = RxDocument<MomentDocumentType>;
export type MomentCollection = RxCollection<MomentDocumentType>;

/**
 * Database collections interface
 */
export interface DatabaseCollections {
  moments: MomentCollection;
}

/**
 * Main database type
 */
export type LifeMomentsDatabase = RxDatabase<DatabaseCollections>;

/**
 * Database configuration
 */
const DATABASE_CONFIG = {
  name: 'lifemomentsdb',
  storage: getRxStorageDexie(),
  multiInstance: false, // Single instance for better performance
  eventReduce: true,    // Enable event reduce for better performance
  cleanupPolicy: {
    minimumDeletedTime: 1000 * 60 * 60 * 24 * 7, // Keep deleted docs for 7 days
    minimumCollectionAge: 1000 * 60 * 60 * 24,    // Minimum age before cleanup
    runEach: 1000 * 60 * 60 * 24,                 // Run cleanup daily
    awaitReplicationsInSync: false,
    waitForLeadership: false,
  },
} as const;

/**
 * Global database instance
 */
let database: LifeMomentsDatabase | null = null;

/**
 * Initialize the RxDB database with Dexie.js storage
 * Creates the database and collections with proper schema validation
 */
export async function initializeDatabase(): Promise<LifeMomentsDatabase> {
  try {
    // Return existing database if already initialized
    if (database) {
      return database;
    }

    console.log('Initializing RxDB database with Dexie.js storage...');

    // Create the database
    database = await createRxDatabase<DatabaseCollections>({
      name: DATABASE_CONFIG.name,
      storage: DATABASE_CONFIG.storage,
      multiInstance: DATABASE_CONFIG.multiInstance,
      eventReduce: DATABASE_CONFIG.eventReduce,
      cleanupPolicy: DATABASE_CONFIG.cleanupPolicy,
    });

    // Add the moments collection
    await database.addCollections({
      moments: {
        schema: momentSchema,
      },
    });

    console.log('Database initialized successfully');
    return database;

  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the current database instance
 * Throws error if database is not initialized
 */
export function getDatabase(): LifeMomentsDatabase {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return database;
}

/**
 * Close the database connection
 * Useful for cleanup and testing
 */
export async function closeDatabase(): Promise<void> {
  if (database) {
    await database.destroy();
    database = null;
    console.log('Database connection closed');
  }
}

/**
 * Check if database is initialized
 */
export function isDatabaseInitialized(): boolean {
  return database !== null;
}

/**
 * Generate a unique ID for new moments
 * Uses crypto.randomUUID() if available, falls back to timestamp-based ID
 */
export function generateMomentId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for environments without crypto.randomUUID
  return `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Database error types for better error handling
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Validate moment data before database operations
 */
export function validateMomentData(data: Partial<MomentDocument>): void {
  if (!data.title || data.title.trim().length === 0) {
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
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.date)) {
    throw new DatabaseError('Date must be in YYYY-MM-DD format', 'validation');
  }
  
  // Validate date is a real date
  const parsedDate = new Date(data.date);
  if (isNaN(parsedDate.getTime())) {
    throw new DatabaseError('Invalid date provided', 'validation');
  }
  
  // Additional check: ensure the parsed date matches the input string
  // This catches cases like "2024-02-30" which gets parsed as "2024-03-01"
  const formattedDate = parsedDate.toISOString().split('T')[0];
  if (formattedDate !== data.date) {
    throw new DatabaseError('Invalid date provided', 'validation');
  }
  
  // Validate repeat frequency
  const validFrequencies: RepeatFrequency[] = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
  if (data.repeatFrequency && !validFrequencies.includes(data.repeatFrequency)) {
    throw new DatabaseError('Invalid repeat frequency', 'validation');
  }
}

export default {
  initializeDatabase,
  getDatabase,
  closeDatabase,
  isDatabaseInitialized,
  generateMomentId,
  validateMomentData,
  DatabaseError,
};