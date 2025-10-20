/**
 * Database Service Layer for Life Moments Tracker
 * Provides CRUD operations and reactive queries for moment data
 */

import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  getDatabase, 
  generateMomentId, 
  validateMomentData, 
  DatabaseError,
  MomentCollection,
  MomentRxDocument 
} from './database';
import { MomentDocument, MomentFormData, Moment } from '@/types/moment';
import { calculateDayDifference } from './date-utils';

/**
 * Result wrapper for database operations
 */
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Database service class providing CRUD operations and reactive queries
 */
export class MomentDatabaseService {
  private get collection(): MomentCollection {
    try {
      const db = getDatabase();
      return db.moments;
    } catch (error) {
      throw new DatabaseError(
        'Database not available. Please ensure database is initialized.',
        'connection',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create a new moment
   */
  async create(formData: MomentFormData): Promise<DatabaseResult<Moment>> {
    try {
      // Validate input data
      validateMomentData(formData);

      const now = Date.now();
      const momentData: MomentDocument = {
        id: generateMomentId(),
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        date: formData.date,
        repeatFrequency: formData.repeatFrequency || 'none',
        createdAt: now,
        updatedAt: now,
      };

      // Insert into database
      const doc = await this.collection.insert(momentData);
      const moment = this.transformDocumentToMoment(doc);

      return {
        success: true,
        data: moment,
      };

    } catch (error) {
      console.error('Failed to create moment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create moment',
      };
    }
  }

  /**
   * Update an existing moment
   */
  async update(id: string, formData: MomentFormData): Promise<DatabaseResult<Moment>> {
    try {
      // Validate input data
      validateMomentData({ ...formData, id });

      // Find the existing document
      const doc = await this.collection.findOne(id).exec();
      if (!doc) {
        return {
          success: false,
          error: 'Moment not found',
        };
      }

      // Update the document
      const updatedData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        date: formData.date,
        repeatFrequency: formData.repeatFrequency || 'none',
        updatedAt: Date.now(),
      };

      await doc.update({
        $set: updatedData,
      });

      // Return the updated moment
      const updatedMoment = this.transformDocumentToMoment(doc);

      return {
        success: true,
        data: updatedMoment,
      };

    } catch (error) {
      console.error('Failed to update moment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update moment',
      };
    }
  }

  /**
   * Delete a moment by ID
   */
  async delete(id: string): Promise<DatabaseResult<void>> {
    try {
      const doc = await this.collection.findOne(id).exec();
      if (!doc) {
        return {
          success: false,
          error: 'Moment not found',
        };
      }

      await doc.remove();

      return {
        success: true,
      };

    } catch (error) {
      console.error('Failed to delete moment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete moment',
      };
    }
  }

  /**
   * Get all moments (non-reactive)
   */
  async getAll(): Promise<DatabaseResult<Moment[]>> {
    try {
      const docs = await this.collection
        .find()
        .sort({ createdAt: 'desc' })
        .exec();

      const moments = docs.map(doc => this.transformDocumentToMoment(doc));

      return {
        success: true,
        data: moments,
      };

    } catch (error) {
      console.error('Failed to get all moments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve moments',
      };
    }
  }

  /**
   * Get a single moment by ID
   */
  async getById(id: string): Promise<DatabaseResult<Moment>> {
    try {
      const doc = await this.collection.findOne(id).exec();
      if (!doc) {
        return {
          success: false,
          error: 'Moment not found',
        };
      }

      const moment = this.transformDocumentToMoment(doc);

      return {
        success: true,
        data: moment,
      };

    } catch (error) {
      console.error('Failed to get moment by ID:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve moment',
      };
    }
  }

  /**
   * Get reactive observable of all moments
   * Updates automatically when data changes
   */
  getAllReactive(): Observable<Moment[]> {
    try {
      return this.collection
        .find()
        .sort({ createdAt: 'desc' })
        .$
        .pipe(
          map(docs => docs.map(doc => this.transformDocumentToMoment(doc))),
          catchError(error => {
            console.error('Reactive query error:', error);
            throw new DatabaseError(
              'Failed to get reactive moments',
              'reactive-query',
              error instanceof Error ? error : undefined
            );
          })
        );

    } catch (error) {
      console.error('Failed to create reactive query:', error);
      throw new DatabaseError(
        'Failed to create reactive query',
        'reactive-query',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get reactive observable of moments filtered by repeat frequency
   */
  getByRepeatFrequencyReactive(frequency: string): Observable<Moment[]> {
    try {
      return this.collection
        .find({
          selector: {
            repeatFrequency: frequency,
          },
        })
        .sort({ createdAt: 'desc' })
        .$
        .pipe(
          map(docs => docs.map(doc => this.transformDocumentToMoment(doc))),
          catchError(error => {
            console.error('Reactive frequency query error:', error);
            throw new DatabaseError(
              'Failed to get reactive moments by frequency',
              'reactive-query',
              error instanceof Error ? error : undefined
            );
          })
        );

    } catch (error) {
      console.error('Failed to create reactive frequency query:', error);
      throw new DatabaseError(
        'Failed to create reactive frequency query',
        'reactive-query',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Get count of all moments (reactive)
   */
  getCountReactive(): Observable<number> {
    try {
      return this.collection
        .count()
        .$
        .pipe(
          catchError(error => {
            console.error('Reactive count query error:', error);
            throw new DatabaseError(
              'Failed to get reactive count',
              'reactive-query',
              error instanceof Error ? error : undefined
            );
          })
        );

    } catch (error) {
      console.error('Failed to create reactive count query:', error);
      throw new DatabaseError(
        'Failed to create reactive count query',
        'reactive-query',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Clear all moments (useful for testing and data reset)
   */
  async clearAll(): Promise<DatabaseResult<void>> {
    try {
      await this.collection.remove();

      return {
        success: true,
      };

    } catch (error) {
      console.error('Failed to clear all moments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to clear moments',
      };
    }
  }

  /**
   * Transform RxDB document to UI-ready Moment object
   * Adds calculated fields for display
   */
  private transformDocumentToMoment(doc: MomentRxDocument): Moment {
    const data = doc.toJSON() as MomentDocument;
    
    // Calculate display fields using date utilities
    const calculation = calculateDayDifference(data.date, data.repeatFrequency);
    
    return {
      ...data,
      ...calculation,
      isRepeating: data.repeatFrequency !== 'none',
    };
  }

  /**
   * Bulk insert moments (useful for data migration or testing)
   */
  async bulkInsert(moments: MomentFormData[]): Promise<DatabaseResult<Moment[]>> {
    try {
      const now = Date.now();
      const momentDocuments: MomentDocument[] = moments.map((formData, index) => {
        validateMomentData(formData);
        
        return {
          id: generateMomentId(),
          title: formData.title.trim(),
          description: formData.description?.trim() || undefined,
          date: formData.date,
          repeatFrequency: formData.repeatFrequency || 'none',
          createdAt: now + index, // Slight offset to maintain order
          updatedAt: now + index,
        };
      });

      const docs = await this.collection.bulkInsert(momentDocuments);
      const resultMoments = docs.success.map(doc => this.transformDocumentToMoment(doc));

      return {
        success: true,
        data: resultMoments,
      };

    } catch (error) {
      console.error('Failed to bulk insert moments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to bulk insert moments',
      };
    }
  }
}

/**
 * Singleton instance of the database service
 */
let serviceInstance: MomentDatabaseService | null = null;

/**
 * Get the singleton database service instance
 */
export function getDatabaseService(): MomentDatabaseService {
  if (!serviceInstance) {
    serviceInstance = new MomentDatabaseService();
  }
  return serviceInstance;
}

/**
 * Reset the service instance (useful for testing)
 */
export function resetDatabaseService(): void {
  serviceInstance = null;
}

export default {
  MomentDatabaseService,
  getDatabaseService,
  resetDatabaseService,
};