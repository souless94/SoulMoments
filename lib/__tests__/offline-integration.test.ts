/**
 * Integration tests for offline functionality
 * Tests the complete offline experience including UI components and data persistence
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { initDB, generateId } from '../moments-db';
import type { MomentDocument } from '@/types/moment';

// Mock the hooks and components
vi.mock('@/hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => ({
    isOnline: false,
    isOfflineCapable: true,
    hasServiceWorker: true,
    storageEstimate: { usage: 1024 * 1024, quota: 10 * 1024 * 1024 },
    connectionType: null,
    refreshCapabilities: vi.fn(),
  }),
  useStorageManagement: () => ({
    storageInfo: {
      used: 1024 * 1024,
      quota: 10 * 1024 * 1024,
      usagePercentage: 10,
      isNearLimit: false,
    },
    checkStorageUsage: vi.fn(),
    clearStorageCache: vi.fn(),
  }),
}));

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('Offline Integration Tests', () => {
  let db: any;

  beforeEach(async () => {
    // Set up offline environment
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    // Initialize database
    db = await initDB();
    await db.moments.find().remove();
  });

  afterEach(async () => {
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    
    if (db) {
      await db.moments.find().remove();
    }
  });

  test('complete offline workflow - create, read, update, delete', async () => {
    expect(navigator.onLine).toBe(false);

    // Step 1: Create a moment while offline
    const createData: MomentDocument = {
      id: generateId(),
      title: 'Offline Integration Test',
      description: 'Testing complete offline workflow',
      date: '2024-04-01',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const createdDoc = await db.moments.insert(createData);
    expect(createdDoc.title).toBe('Offline Integration Test');

    // Step 2: Read the moment
    const moments = await db.moments.find().exec();
    expect(moments).toHaveLength(1);
    expect(moments[0].title).toBe('Offline Integration Test');
    expect(moments[0].description).toBe('Testing complete offline workflow');

    // Step 3: Update the moment
    await createdDoc.update({
      $set: {
        title: 'Updated Offline Test',
        description: 'Updated while offline',
        repeatFrequency: 'weekly',
        updatedAt: new Date().toISOString(),
      }
    });

    const updatedMoment = await db.moments.findOne(createdDoc.id).exec();
    expect(updatedMoment.title).toBe('Updated Offline Test');
    expect(updatedMoment.description).toBe('Updated while offline');
    expect(updatedMoment.repeatFrequency).toBe('weekly');

    // Step 4: Delete the moment
    await updatedMoment.remove();

    const finalMoments = await db.moments.find().exec();
    expect(finalMoments).toHaveLength(0);
  });

  test('offline data persistence across multiple sessions', async () => {
    expect(navigator.onLine).toBe(false);

    // Session 1: Create data
    const sessionData = [
      {
        id: generateId(),
        title: 'Session Test 1',
        date: '2024-04-10',
        repeatFrequency: 'none' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: 'Session Test 2',
        description: 'With description',
        date: '2024-04-11',
        repeatFrequency: 'monthly' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    for (const data of sessionData) {
      await db.moments.insert(data);
    }

    // Verify session 1 data
    let moments = await db.moments.find().exec();
    expect(moments).toHaveLength(2);

    // Simulate session end
    await db.destroy();

    // Session 2: Reconnect and verify persistence
    const newDb = await initDB();
    moments = await newDb.moments.find().exec();
    
    expect(moments).toHaveLength(2);
    expect(moments.map(m => m.title)).toContain('Session Test 1');
    expect(moments.map(m => m.title)).toContain('Session Test 2');
    
    const momentWithDesc = moments.find(m => m.description);
    expect(momentWithDesc?.description).toBe('With description');
    expect(momentWithDesc?.repeatFrequency).toBe('monthly');

    // Session 2: Modify data
    const firstMoment = moments[0];
    await firstMoment.update({
      $set: {
        title: 'Modified in Session 2',
        updatedAt: new Date().toISOString(),
      }
    });

    // Verify modification persisted
    const modifiedMoment = await newDb.moments.findOne(firstMoment.id).exec();
    expect(modifiedMoment.title).toBe('Modified in Session 2');

    // Cleanup
    await newDb.moments.find().remove();
  });

  test('offline reactive queries continue working', async () => {
    expect(navigator.onLine).toBe(false);

    let queryResults: any[] = [];
    let updateCount = 0;

    // Set up reactive query
    const subscription = db.moments.find({
      selector: {},
      sort: [{ createdAt: 'desc' }],
    }).$.subscribe((docs: any[]) => {
      queryResults = docs;
      updateCount++;
    });

    // Initial state should be empty
    await waitFor(() => {
      expect(queryResults).toHaveLength(0);
      expect(updateCount).toBe(1);
    });

    // Add first moment
    const moment1: MomentDocument = {
      id: generateId(),
      title: 'Reactive Test 1',
      date: '2024-04-15',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(moment1);

    await waitFor(() => {
      expect(queryResults).toHaveLength(1);
      expect(queryResults[0].title).toBe('Reactive Test 1');
      expect(updateCount).toBe(2);
    });

    // Add second moment
    const moment2: MomentDocument = {
      id: generateId(),
      title: 'Reactive Test 2',
      date: '2024-04-16',
      repeatFrequency: 'daily',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(moment2);

    await waitFor(() => {
      expect(queryResults).toHaveLength(2);
      expect(updateCount).toBe(3);
    });

    // Update a moment
    const doc = await db.moments.findOne(moment1.id).exec();
    await doc.update({
      $set: {
        title: 'Updated Reactive Test 1',
        updatedAt: new Date().toISOString(),
      }
    });

    await waitFor(() => {
      expect(queryResults).toHaveLength(2);
      expect(queryResults.some(m => m.title === 'Updated Reactive Test 1')).toBe(true);
      expect(updateCount).toBe(4);
    });

    // Delete a moment
    await doc.remove();

    await waitFor(() => {
      expect(queryResults).toHaveLength(1);
      expect(queryResults[0].title).toBe('Reactive Test 2');
      expect(updateCount).toBe(5);
    });

    subscription.unsubscribe();
  });

  test('offline error handling and recovery', async () => {
    expect(navigator.onLine).toBe(false);

    // Test database operation with simulated error
    const originalInsert = db.moments.insert;
    
    // Simulate temporary database error
    db.moments.insert = vi.fn().mockRejectedValueOnce(
      new Error('Temporary database error')
    );

    const momentData: MomentDocument = {
      id: generateId(),
      title: 'Error Recovery Test',
      date: '2024-04-20',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // First attempt should fail
    await expect(db.moments.insert(momentData)).rejects.toThrow('Temporary database error');

    // Restore original method
    db.moments.insert = originalInsert;

    // Second attempt should succeed
    const doc = await db.moments.insert(momentData);
    expect(doc.title).toBe('Error Recovery Test');

    // Verify data was saved
    const moments = await db.moments.find().exec();
    expect(moments).toHaveLength(1);
    expect(moments[0].title).toBe('Error Recovery Test');
  });

  test('offline performance with large dataset', async () => {
    expect(navigator.onLine).toBe(false);

    const startTime = Date.now();
    const batchSize = 100;
    const moments: MomentDocument[] = [];

    // Create large dataset
    for (let i = 0; i < batchSize; i++) {
      moments.push({
        id: generateId(),
        title: `Performance Test Moment ${i + 1}`,
        description: `Description for moment ${i + 1}`,
        date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        repeatFrequency: i % 4 === 0 ? 'yearly' : i % 3 === 0 ? 'monthly' : i % 2 === 0 ? 'weekly' : 'none',
        createdAt: new Date(Date.now() + i * 1000).toISOString(),
        updatedAt: new Date(Date.now() + i * 1000).toISOString(),
      } as MomentDocument);
    }

    // Insert all moments
    const insertPromises = moments.map(moment => db.moments.insert(moment));
    await Promise.all(insertPromises);

    const insertTime = Date.now() - startTime;
    console.log(`Inserted ${batchSize} moments in ${insertTime}ms`);

    // Query performance test
    const queryStartTime = Date.now();
    const allMoments = await db.moments.find().exec();
    const queryTime = Date.now() - queryStartTime;

    expect(allMoments).toHaveLength(batchSize);
    console.log(`Queried ${batchSize} moments in ${queryTime}ms`);

    // Update performance test
    const updateStartTime = Date.now();
    const updatePromises = allMoments.slice(0, 10).map(doc => 
      doc.update({
        $set: {
          title: `Updated ${doc.title}`,
          updatedAt: new Date().toISOString(),
        }
      })
    );
    await Promise.all(updatePromises);
    const updateTime = Date.now() - updateStartTime;

    console.log(`Updated 10 moments in ${updateTime}ms`);

    // Verify updates
    const updatedMoments = await db.moments.find({
      selector: {
        title: { $regex: '^Updated' }
      }
    }).exec();
    expect(updatedMoments).toHaveLength(10);

    // Performance assertions (should complete within reasonable time)
    expect(insertTime).toBeLessThan(5000); // 5 seconds for 100 inserts
    expect(queryTime).toBeLessThan(1000);  // 1 second for query
    expect(updateTime).toBeLessThan(2000); // 2 seconds for 10 updates

    // Cleanup
    await db.moments.find().remove();
  });
});