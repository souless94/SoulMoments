/**
 * Tests for database service layer
 * Tests CRUD operations, reactive queries, and error handling
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Observable, of, throwError } from 'rxjs';
import { MomentDatabaseService, getDatabaseService, resetDatabaseService } from '../database-service';
import type { MomentFormData, Moment } from '@/types/moment';

// Mock the database module
const mockCollection = {
  insert: vi.fn(),
  findOne: vi.fn(),
  find: vi.fn(),
  remove: vi.fn(),
  bulkInsert: vi.fn(),
  count: vi.fn(),
};

const mockDoc = {
  toJSON: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  exec: vi.fn(),
};

const mockQuery = {
  sort: vi.fn(),
  exec: vi.fn(),
  $: of([]),
};

vi.mock('../database', () => ({
  getDatabase: vi.fn(() => ({
    moments: mockCollection,
  })),
  generateMomentId: vi.fn(() => 'test-id-123'),
  validateMomentData: vi.fn(),
  DatabaseError: class DatabaseError extends Error {
    constructor(message: string, public operation: string, public originalError?: Error) {
      super(message);
      this.name = 'DatabaseError';
    }
  },
}));

vi.mock('../date-utils', () => ({
  calculateDayDifference: vi.fn((date: string, frequency: string = 'none') => ({
    daysDifference: 5,
    displayText: '5 days until',
    status: 'future',
    nextOccurrence: frequency !== 'none' ? '2024-03-20' : undefined,
  })),
}));

describe('MomentDatabaseService', () => {
  let service: MomentDatabaseService;

  beforeEach(() => {
    service = new MomentDatabaseService();
    vi.clearAllMocks();
    
    // Setup default mock returns
    mockCollection.find.mockReturnValue(mockQuery);
    mockQuery.sort.mockReturnValue(mockQuery);
    mockQuery.exec.mockResolvedValue([]);
    mockCollection.findOne.mockReturnValue(mockDoc);
    mockDoc.exec.mockResolvedValue(null);
  });

  afterEach(() => {
    resetDatabaseService();
  });

  describe('create', () => {
    test('creates moment successfully', async () => {
      const formData: MomentFormData = {
        title: 'Test Moment',
        description: 'Test description',
        date: '2024-03-15',
        repeatFrequency: 'none',
      };

      const mockMomentDoc = {
        id: 'test-id-123',
        title: 'Test Moment',
        description: 'Test description',
        date: '2024-03-15',
        repeatFrequency: 'none',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      mockDoc.toJSON.mockReturnValue(mockMomentDoc);
      mockCollection.insert.mockResolvedValue(mockDoc);

      const result = await service.create(formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Test Moment');
      expect(result.data?.isRepeating).toBe(false);
      expect(mockCollection.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'test-id-123',
          title: 'Test Moment',
          description: 'Test description',
          date: '2024-03-15',
          repeatFrequency: 'none',
        })
      );
    });

    test('handles creation error', async () => {
      const formData: MomentFormData = {
        title: 'Test Moment',
        date: '2024-03-15',
        repeatFrequency: 'none',
      };

      mockCollection.insert.mockRejectedValue(new Error('Database error'));

      const result = await service.create(formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    test('trims whitespace from title and description', async () => {
      const formData: MomentFormData = {
        title: '  Test Moment  ',
        description: '  Test description  ',
        date: '2024-03-15',
        repeatFrequency: 'none',
      };

      mockDoc.toJSON.mockReturnValue({
        id: 'test-id-123',
        title: 'Test Moment',
        description: 'Test description',
        date: '2024-03-15',
        repeatFrequency: 'none',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      });
      mockCollection.insert.mockResolvedValue(mockDoc);

      await service.create(formData);

      expect(mockCollection.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Moment',
          description: 'Test description',
        })
      );
    });
  });

  describe('update', () => {
    test('updates moment successfully', async () => {
      const formData: MomentFormData = {
        title: 'Updated Moment',
        description: 'Updated description',
        date: '2024-03-20',
        repeatFrequency: 'daily',
      };

      const mockUpdatedDoc = {
        id: 'test-id-123',
        title: 'Updated Moment',
        description: 'Updated description',
        date: '2024-03-20',
        repeatFrequency: 'daily',
        createdAt: 1234567890,
        updatedAt: 1234567891,
      };

      mockDoc.exec.mockResolvedValue(mockDoc);
      mockDoc.toJSON.mockReturnValue(mockUpdatedDoc);
      mockDoc.update.mockResolvedValue(undefined);

      const result = await service.update('test-id-123', formData);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.title).toBe('Updated Moment');
      expect(mockDoc.update).toHaveBeenCalledWith({
        $set: expect.objectContaining({
          title: 'Updated Moment',
          description: 'Updated description',
          date: '2024-03-20',
          repeatFrequency: 'daily',
        }),
      });
    });

    test('handles moment not found', async () => {
      const formData: MomentFormData = {
        title: 'Updated Moment',
        date: '2024-03-20',
        repeatFrequency: 'none',
      };

      mockDoc.exec.mockResolvedValue(null);

      const result = await service.update('nonexistent-id', formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moment not found');
    });

    test('handles update error', async () => {
      const formData: MomentFormData = {
        title: 'Updated Moment',
        date: '2024-03-20',
        repeatFrequency: 'none',
      };

      mockDoc.exec.mockResolvedValue(mockDoc);
      mockDoc.update.mockRejectedValue(new Error('Update failed'));

      const result = await service.update('test-id-123', formData);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Update failed');
    });
  });

  describe('delete', () => {
    test('deletes moment successfully', async () => {
      mockDoc.exec.mockResolvedValue(mockDoc);
      mockDoc.remove.mockResolvedValue(undefined);

      const result = await service.delete('test-id-123');

      expect(result.success).toBe(true);
      expect(mockDoc.remove).toHaveBeenCalled();
    });

    test('handles moment not found for deletion', async () => {
      mockDoc.exec.mockResolvedValue(null);

      const result = await service.delete('nonexistent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moment not found');
    });

    test('handles deletion error', async () => {
      mockDoc.exec.mockResolvedValue(mockDoc);
      mockDoc.remove.mockRejectedValue(new Error('Delete failed'));

      const result = await service.delete('test-id-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Delete failed');
    });
  });

  describe('getAll', () => {
    test('retrieves all moments successfully', async () => {
      const mockMoments = [
        {
          id: 'test-id-1',
          title: 'Moment 1',
          date: '2024-03-15',
          repeatFrequency: 'none',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
        {
          id: 'test-id-2',
          title: 'Moment 2',
          date: '2024-03-20',
          repeatFrequency: 'daily',
          createdAt: 1234567891,
          updatedAt: 1234567891,
        },
      ];

      const mockDocs = mockMoments.map(moment => ({
        toJSON: () => moment,
      }));

      mockQuery.exec.mockResolvedValue(mockDocs);

      const result = await service.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].title).toBe('Moment 1');
      expect(result.data?.[1].title).toBe('Moment 2');
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 'desc' });
    });

    test('handles retrieval error', async () => {
      mockQuery.exec.mockRejectedValue(new Error('Retrieval failed'));

      const result = await service.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Retrieval failed');
    });
  });

  describe('getById', () => {
    test('retrieves moment by ID successfully', async () => {
      const mockMoment = {
        id: 'test-id-123',
        title: 'Test Moment',
        date: '2024-03-15',
        repeatFrequency: 'none',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };

      mockDoc.exec.mockResolvedValue(mockDoc);
      mockDoc.toJSON.mockReturnValue(mockMoment);

      const result = await service.getById('test-id-123');

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Test Moment');
      expect(mockCollection.findOne).toHaveBeenCalledWith('test-id-123');
    });

    test('handles moment not found by ID', async () => {
      mockDoc.exec.mockResolvedValue(null);

      const result = await service.getById('nonexistent-id');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moment not found');
    });
  });

  describe('reactive queries', () => {
    test('getAllReactive returns observable', () => {
      const mockObservable = of([]);
      mockQuery.$ = mockObservable;

      const result = service.getAllReactive();

      expect(result).toBeInstanceOf(Observable);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: 'desc' });
    });

    test('getByRepeatFrequencyReactive filters by frequency', () => {
      const mockObservable = of([]);
      mockQuery.$ = mockObservable;

      const result = service.getByRepeatFrequencyReactive('daily');

      expect(result).toBeInstanceOf(Observable);
      expect(mockCollection.find).toHaveBeenCalledWith({
        selector: {
          repeatFrequency: 'daily',
        },
      });
    });

    test('getCountReactive returns count observable', () => {
      const mockCountQuery = {
        $: of(5),
      };
      mockCollection.count.mockReturnValue(mockCountQuery);

      const result = service.getCountReactive();

      expect(result).toBeInstanceOf(Observable);
      expect(mockCollection.count).toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    test('clears all moments successfully', async () => {
      mockCollection.remove.mockResolvedValue(undefined);

      const result = await service.clearAll();

      expect(result.success).toBe(true);
      expect(mockCollection.remove).toHaveBeenCalled();
    });

    test('handles clear error', async () => {
      mockCollection.remove.mockRejectedValue(new Error('Clear failed'));

      const result = await service.clearAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Clear failed');
    });
  });

  describe('bulkInsert', () => {
    test('bulk inserts moments successfully', async () => {
      const formDataArray: MomentFormData[] = [
        {
          title: 'Moment 1',
          date: '2024-03-15',
          repeatFrequency: 'none',
        },
        {
          title: 'Moment 2',
          date: '2024-03-20',
          repeatFrequency: 'daily',
        },
      ];

      const mockBulkResult = {
        success: [
          { toJSON: () => ({ id: 'id-1', title: 'Moment 1', date: '2024-03-15', repeatFrequency: 'none', createdAt: 1234567890, updatedAt: 1234567890 }) },
          { toJSON: () => ({ id: 'id-2', title: 'Moment 2', date: '2024-03-20', repeatFrequency: 'daily', createdAt: 1234567891, updatedAt: 1234567891 }) },
        ],
        error: [],
      };

      mockCollection.bulkInsert.mockResolvedValue(mockBulkResult);

      const result = await service.bulkInsert(formDataArray);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(mockCollection.bulkInsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ title: 'Moment 1' }),
          expect.objectContaining({ title: 'Moment 2' }),
        ])
      );
    });

    test('handles bulk insert error', async () => {
      const formDataArray: MomentFormData[] = [
        {
          title: 'Moment 1',
          date: '2024-03-15',
          repeatFrequency: 'none',
        },
      ];

      mockCollection.bulkInsert.mockRejectedValue(new Error('Bulk insert failed'));

      const result = await service.bulkInsert(formDataArray);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Bulk insert failed');
    });
  });
});

describe('Service Singleton', () => {
  afterEach(() => {
    resetDatabaseService();
  });

  test('getDatabaseService returns same instance', () => {
    const service1 = getDatabaseService();
    const service2 = getDatabaseService();

    expect(service1).toBe(service2);
    expect(service1).toBeInstanceOf(MomentDatabaseService);
  });

  test('resetDatabaseService creates new instance', () => {
    const service1 = getDatabaseService();
    resetDatabaseService();
    const service2 = getDatabaseService();

    expect(service1).not.toBe(service2);
    expect(service2).toBeInstanceOf(MomentDatabaseService);
  });
});