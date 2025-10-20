/**
 * Offline-First Functionality Tests
 * Verifies the app works completely without internet connection using RxDB
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDB, generateId } from '../moments-db';
import type { MomentDocument } from '@/types/moment';

// Mock complete offline environment
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: false, // Always offline for these tests
});

// Mock fetch to always fail (simulating no internet)
global.fetch = vi.fn().mockRejectedValue(new Error('Network error - offline'));

describe('Offline-First App Functionality', () => {
  let db: any;

  beforeEach(async () => {
    // Ensure we're in offline mode
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    // Initialize RxDB (should work offline)
    db = await initDB();
    
    // Clear any existing data
    await db.moments.find().remove();
  });

  afterEach(async () => {
    if (db) {
      await db.moments.find().remove();
    }
  });

  test('RxDB initializes successfully offline', async () => {
    expect(navigator.onLine).toBe(false);
    expect(db).toBeTruthy();
    expect(db.moments).toBeTruthy();
  });

  test('complete CRUD operations work offline with RxDB', async () => {
    expect(navigator.onLine).toBe(false);

    // CREATE - Add multiple moments
    const moments = [
      {
        id: generateId(),
        title: 'Birthday',
        description: 'My birthday celebration',
        date: '2024-06-15',
        repeatFrequency: 'yearly' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: 'Anniversary',
        date: '2024-08-20',
        repeatFrequency: 'yearly' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: 'Daily Meditation',
        description: 'Daily mindfulness practice',
        date: '2024-01-01',
        repeatFrequency: 'daily' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    // Insert all moments
    for (const moment of moments) {
      await db.moments.insert(moment);
    }

    // READ - Verify all moments were created
    const allMoments = await db.moments.find().exec();
    expect(allMoments).toHaveLength(3);

    // READ - Query by repeat frequency
    const yearlyMoments = await db.moments.find({
      selector: { repeatFrequency: 'yearly' }
    }).exec();
    expect(yearlyMoments).toHaveLength(2);

    const dailyMoments = await db.moments.find({
      selector: { repeatFrequency: 'daily' }
    }).exec();
    expect(dailyMoments).toHaveLength(1);

    // UPDATE - Modify a moment
    const birthdayMoment = await db.moments.findOne({
      selector: { title: 'Birthday' }
    }).exec();
    
    expect(birthdayMoment).toBeTruthy();
    
    await birthdayMoment.update({
      $set: {
        description: 'Updated birthday celebration',
        repeatFrequency: 'yearly',
        updatedAt: new Date().toISOString(),
      }
    });

    // Verify update
    const updatedMoment = await db.moments.findOne(birthdayMoment.id).exec();
    expect(updatedMoment.description).toBe('Updated birthday celebration');

    // DELETE - Remove a moment
    const anniversaryMoment = await db.moments.findOne({
      selector: { title: 'Anniversary' }
    }).exec();
    
    await anniversaryMoment.remove();

    // Verify deletion
    const remainingMoments = await db.moments.find().exec();
    expect(remainingMoments).toHaveLength(2);
    expect(remainingMoments.find(m => m.title === 'Anniversary')).toBeUndefined();
  });

  test('reactive queries work offline', async () => {
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

    // Initial state
    expect(queryResults).toHaveLength(0);
    expect(updateCount).toBe(1);

    // Add moment
    const moment1: MomentDocument = {
      id: generateId(),
      title: 'Offline Reactive Test',
      date: '2024-05-01',
      repeatFrequency: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(moment1);

    // Wait for reactive update
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(queryResults).toHaveLength(1);
    expect(queryResults[0].title).toBe('Offline Reactive Test');
    expect(updateCount).toBe(2);

    // Add another moment
    const moment2: MomentDocument = {
      id: generateId(),
      title: 'Second Offline Test',
      date: '2024-05-02',
      repeatFrequency: 'weekly',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.moments.insert(moment2);

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(queryResults).toHaveLength(2);
    expect(updateCount).toBe(3);

    subscription.unsubscribe();
  });

  test('data persists across app restarts (offline)', async () => {
    expect(navigator.onLine).toBe(false);

    // Session 1: Create data
    const testData = [
      {
        id: generateId(),
        title: 'Persistent Test 1',
        date: '2024-07-01',
        repeatFrequency: 'monthly' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: generateId(),
        title: 'Persistent Test 2',
        description: 'Should survive restart',
        date: '2024-07-15',
        repeatFrequency: 'none' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];

    for (const data of testData) {
      await db.moments.insert(data);
    }

    // Verify data exists
    let moments = await db.moments.find().exec();
    expect(moments).toHaveLength(2);

    // Simulate app restart by destroying and recreating database
    await db.destroy();
    db = await initDB();

    // Verify data persisted
    moments = await db.moments.find().exec();
    expect(moments).toHaveLength(2);
    
    const titles = moments.map(m => m.title);
    expect(titles).toContain('Persistent Test 1');
    expect(titles).toContain('Persistent Test 2');
    
    const momentWithDesc = moments.find(m => m.description);
    expect(momentWithDesc?.description).toBe('Should survive restart');
  });

  test('complex queries work offline', async () => {
    expect(navigator.onLine).toBe(false);

    // Create test data with various repeat frequencies and dates
    const testMoments = [
      {
        id: generateId(),
        title: 'Daily Task',
        date: '2024-01-01',
        repeatFrequency: 'daily' as const,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      {
        id: generateId(),
        title: 'Weekly Meeting',
        date: '2024-01-08',
        repeatFrequency: 'weekly' as const,
        createdAt: '2024-01-02T00:00:00.000Z',
        updatedAt: '2024-01-02T00:00:00.000Z',
      },
      {
        id: generateId(),
        title: 'Monthly Review',
        date: '2024-01-31',
        repeatFrequency: 'monthly' as const,
        createdAt: '2024-01-03T00:00:00.000Z',
        updatedAt: '2024-01-03T00:00:00.000Z',
      },
      {
        id: generateId(),
        title: 'One-time Event',
        date: '2024-06-15',
        repeatFrequency: 'none' as const,
        createdAt: '2024-01-04T00:00:00.000Z',
        updatedAt: '2024-01-04T00:00:00.000Z',
      }
    ];

    for (const moment of testMoments) {
      await db.moments.insert(moment);
    }

    // Query by repeat frequency
    const repeatingMoments = await db.moments.find({
      selector: {
        repeatFrequency: { $ne: 'none' }
      }
    }).exec();
    expect(repeatingMoments).toHaveLength(3);

    // Query with sorting
    const sortedByDate = await db.moments.find({
      sort: [{ date: 'asc' }]
    }).exec();
    expect(sortedByDate[0].title).toBe('Daily Task');
    expect(sortedByDate[3].title).toBe('One-time Event');

    // Query with complex selector
    const recentRepeating = await db.moments.find({
      selector: {
        $and: [
          { repeatFrequency: { $ne: 'none' } },
          { createdAt: { $gte: '2024-01-02T00:00:00.000Z' } }
        ]
      }
    }).exec();
    expect(recentRepeating).toHaveLength(2);
  });

  test('app handles large datasets offline', async () => {
    expect(navigator.onLine).toBe(false);

    const batchSize = 50;
    const moments: MomentDocument[] = [];

    // Create large dataset
    for (let i = 0; i < batchSize; i++) {
      moments.push({
        id: generateId(),
        title: `Offline Moment ${i + 1}`,
        description: `Description ${i + 1}`,
        date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        repeatFrequency: ['none', 'daily', 'weekly', 'monthly', 'yearly'][i % 5] as any,
        createdAt: new Date(Date.now() + i * 1000).toISOString(),
        updatedAt: new Date(Date.now() + i * 1000).toISOString(),
      });
    }

    // Insert all moments
    const startTime = Date.now();
    for (const moment of moments) {
      await db.moments.insert(moment);
    }
    const insertTime = Date.now() - startTime;

    // Query all moments
    const queryStartTime = Date.now();
    const allMoments = await db.moments.find().exec();
    const queryTime = Date.now() - queryStartTime;

    expect(allMoments).toHaveLength(batchSize);
    
    // Performance should be reasonable even offline
    expect(insertTime).toBeLessThan(10000); // 10 seconds max
    expect(queryTime).toBeLessThan(1000);   // 1 second max

    // Test complex query on large dataset
    const complexQueryStart = Date.now();
    const yearlyMoments = await db.moments.find({
      selector: { repeatFrequency: 'yearly' },
      sort: [{ createdAt: 'desc' }]
    }).exec();
    const complexQueryTime = Date.now() - complexQueryStart;

    expect(yearlyMoments.length).toBeGreaterThan(0);
    expect(complexQueryTime).toBeLessThan(500); // 500ms max
  });
});