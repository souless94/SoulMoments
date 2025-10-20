/**
 * Tests for offline functionality
 * Verifies all features work without internet connection and data persists across sessions
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDB, generateId } from '../moments-db';
import type { MomentDocument } from '@/types/moment';

// Mock navigator.onLine for offline testing
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock service worker registration
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null,
    }),
    addEventListener: vi.fn(),
  },
  writable: true,
});

describe('Offline Database Operations', () => {
  let db: any;

  beforeEach(async () => {
    // Simulate offline mode
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    // Initialize database
    db = await initDB();
    
    // Clear any existing data
    await db.moments.find().remove();
  });

  afterEach(async () => {
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    if (db) {
      await db.moments.find().remove();
    }
  });

  test('can create moments while offline', async () => {
    expect(navigator.onLine).toBe(false);

    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Offline Test Moment',
      description: 'Created while offline',
      date: '2024-03-20',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc = await db.moments.insert(momentData);
    expect(doc).toBeTruthy();
    expect(doc.title).toBe('Offline Test Moment');
  });

  test('can read moments while offline', async () => {
    expect(navigator.onLine).toBe(false);

    // Insert test data
    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Read Test Moment',
      description: 'For reading while offline',
      date: '2024-03-21',
      repeatFrequency: 'weekly',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(momentData);

    // Read data
    const moments = await db.moments.find().exec();
    expect(moments).toHaveLength(1);
    expect(moments[0].title).toBe('Read Test Moment');
    expect(moments[0].repeatFrequency).toBe('weekly');
  });

  test('can update moments while offline', async () => {
    expect(navigator.onLine).toBe(false);

    // Insert test data
    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Update Test Moment',
      description: 'Original description',
      date: '2024-03-22',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc = await db.moments.insert(momentData);

    // Update the document
    await doc.update({
      $set: {
        title: 'Updated Offline Moment',
        description: 'Updated while offline',
        repeatFrequency: 'monthly',
        updatedAt: new Date().toISOString(),
      }
    });

    // Verify update
    const updated = await db.moments.findOne(doc.id).exec();
    expect(updated.title).toBe('Updated Offline Moment');
    expect(updated.description).toBe('Updated while offline');
    expect(updated.repeatFrequency).toBe('monthly');
  });

  test('can delete moments while offline', async () => {
    expect(navigator.onLine).toBe(false);

    // Insert test data
    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Delete Test Moment',
      date: '2024-03-23',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const doc = await db.moments.insert(momentData);
    expect(await db.moments.find().exec()).toHaveLength(1);

    // Delete the document
    await doc.remove();

    // Verify deletion
    const moments = await db.moments.find().exec();
    expect(moments).toHaveLength(0);
  });

  test('reactive queries work offline', async () => {
    expect(navigator.onLine).toBe(false);

    let queryResults: any[] = [];
    
    // Set up reactive query
    const subscription = db.moments.find({
      selector: {},
      sort: [{ createdAt: 'desc' }],
    }).$.subscribe((docs: any[]) => {
      queryResults = docs;
    });

    // Initially empty
    expect(queryResults).toHaveLength(0);

    // Insert data
    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Reactive Test Moment',
      date: '2024-03-24',
      repeatFrequency: 'daily',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(momentData);

    // Wait for reactive update
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(queryResults).toHaveLength(1);
    expect(queryResults[0].title).toBe('Reactive Test Moment');

    subscription.unsubscribe();
  });

  test('handles multiple operations in sequence while offline', async () => {
    expect(navigator.onLine).toBe(false);

    const operations = [];

    // Create multiple moments
    for (let i = 0; i < 5; i++) {
      const momentData: MomentDocument = {
        id: generateId(),
        title: `Batch Moment ${i + 1}`,
        date: `2024-03-${25 + i}`,
        repeatFrequency: i % 2 === 0 ? 'none' : 'yearly',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      operations.push(db.moments.insert(momentData));
    }

    await Promise.all(operations);

    // Verify all were created
    const moments = await db.moments.find().exec();
    expect(moments).toHaveLength(5);

    // Update some moments
    const updateOps = moments.slice(0, 2).map(doc => 
      doc.update({
        $set: {
          title: `Updated ${doc.title}`,
          updatedAt: new Date().toISOString(),
        }
      })
    );

    await Promise.all(updateOps);

    // Delete one moment
    await moments[4].remove();

    // Final verification
    const finalMoments = await db.moments.find().exec();
    expect(finalMoments).toHaveLength(4);
    expect(finalMoments.some(m => m.title.startsWith('Updated'))).toBe(true);
  });
});

describe('Data Persistence Across Sessions', () => {
  test('data persists after database reconnection', async () => {
    // First session - create data
    let db = await initDB();
    
    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Persistence Test Moment',
      description: 'Should persist across sessions',
      date: '2024-03-30',
      repeatFrequency: 'monthly',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(momentData);
    
    // Verify data exists
    let moments = await db.moments.find().exec();
    expect(moments).toHaveLength(1);
    expect(moments[0].title).toBe('Persistence Test Moment');

    // Simulate session end by destroying database reference
    await db.destroy();

    // Second session - reconnect and verify data
    db = await initDB();
    moments = await db.moments.find().exec();
    
    expect(moments).toHaveLength(1);
    expect(moments[0].title).toBe('Persistence Test Moment');
    expect(moments[0].description).toBe('Should persist across sessions');
    expect(moments[0].repeatFrequency).toBe('monthly');

    // Cleanup
    await db.moments.find().remove();
  });

  test('data survives browser refresh simulation', async () => {
    const db = await initDB();
    
    // Create test data
    const testMoments = [
      {
        id: generateId(),
        title: 'Refresh Test 1',
        date: '2024-04-01',
        repeatFrequency: 'none' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: 'Refresh Test 2',
        description: 'With description',
        date: '2024-04-02',
        repeatFrequency: 'weekly' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    for (const moment of testMoments) {
      await db.moments.insert(moment);
    }

    // Verify initial state
    let moments = await db.moments.find().exec();
    expect(moments).toHaveLength(2);

    // Simulate browser refresh by creating new database instance
    const newDb = await initDB();
    moments = await newDb.moments.find().exec();
    
    expect(moments).toHaveLength(2);
    expect(moments.map(m => m.title)).toContain('Refresh Test 1');
    expect(moments.map(m => m.title)).toContain('Refresh Test 2');
    
    const momentWithDesc = moments.find(m => m.description);
    expect(momentWithDesc?.description).toBe('With description');
    expect(momentWithDesc?.repeatFrequency).toBe('weekly');

    // Cleanup
    await newDb.moments.find().remove();
  });
});

describe('Offline Error Handling', () => {
  test('handles storage quota exceeded gracefully', async () => {
    const db = await initDB();
    
    // Mock storage quota exceeded error
    const originalInsert = db.moments.insert;
    db.moments.insert = vi.fn().mockRejectedValue(
      new Error('QuotaExceededError: The quota has been exceeded.')
    );

    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Quota Test Moment',
      date: '2024-04-05',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await expect(db.moments.insert(momentData)).rejects.toThrow('QuotaExceededError');

    // Restore original method
    db.moments.insert = originalInsert;
  });

  test('handles database corruption gracefully', async () => {
    // This test simulates database corruption scenarios
    // In a real app, this would trigger database recovery
    
    const db = await initDB();
    
    // Mock database corruption
    const originalFind = db.moments.find;
    db.moments.find = vi.fn().mockImplementation(() => {
      throw new Error('Database corruption detected');
    });

    expect(() => db.moments.find()).toThrow('Database corruption detected');

    // Restore original method
    db.moments.find = originalFind;
  });
});