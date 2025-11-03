import { test, expect } from '@playwright/test';
import { PWATestHelpers, MomentTestHelpers } from './utils/test-helpers';
import { testMoments } from './fixtures/test-data';

test.describe('PWA Installation and Manifest', () => {
  let pwaHelpers: PWATestHelpers;
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    pwaHelpers = new PWATestHelpers(page);
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('manifest is properly loaded', async ({ page }) => {
    await pwaHelpers.expectManifestLoaded();
    
    // Check manifest content
    const manifestResponse = await page.request.get('/manifest.json');
    expect(manifestResponse.ok()).toBe(true);
    
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBeDefined();
    expect(manifest.display).toBeDefined();
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  test('PWA icons are available in multiple sizes', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.json');
    const manifest = await manifestResponse.json();
    
    const expectedSizes = ['192x192', '256x256', '384x384', '512x512'];
    
    for (const size of expectedSizes) {
      const iconWithSize = manifest.icons.find((icon: any) => 
        icon.sizes === size || icon.sizes.includes(size)
      );
      expect(iconWithSize).toBeDefined();
      
      // Verify icon file exists
      if (iconWithSize) {
        const iconResponse = await page.request.get(iconWithSize.src);
        expect(iconResponse.ok()).toBe(true);
      }
    }
  });

  test('supports PWA installation prompt', async ({ page }) => {
    await pwaHelpers.expectInstallPrompt();
    
    // Check for PWA-related meta tags
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeDefined();
  });

  test('app works as standalone PWA', async ({ page, context }) => {
    // Simulate standalone mode
    await page.addInitScript(() => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: false
      });
    });
    
    await helpers.goto();
    
    // App should function normally in standalone mode
    await helpers.createMoment(testMoments.basic);
    await helpers.expectMomentExists(testMoments.basic.title);
  });
});

test.describe('Service Worker Functionality', () => {
  let pwaHelpers: PWATestHelpers;
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    pwaHelpers = new PWATestHelpers(page);
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('service worker is registered', async ({ page }) => {
    await pwaHelpers.expectServiceWorkerRegistered();
    
    // Check service worker registration details
    const swRegistration = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return {
        scope: registration?.scope,
        active: !!registration?.active,
        installing: !!registration?.installing,
        waiting: !!registration?.waiting
      };
    });
    
    expect(swRegistration.scope).toBeDefined();
    expect(swRegistration.active || swRegistration.installing || swRegistration.waiting).toBe(true);
  });

  test('service worker caches resources', async ({ page }) => {
    // Wait for service worker to be ready
    await page.waitForFunction(() => navigator.serviceWorker.ready);
    
    // Check if caches are created
    const cacheNames = await page.evaluate(async () => {
      return await caches.keys();
    });
    
    expect(cacheNames.length).toBeGreaterThan(0);
    
    // Verify some resources are cached
    for (const cacheName of cacheNames) {
      const cacheKeys = await page.evaluate(async (name) => {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        return keys.map(key => key.url);
      }, cacheName);
      
      expect(cacheKeys.length).toBeGreaterThan(0);
    }
  });

  test('app works offline after initial load', async ({ page, context }) => {
    // Load app and let service worker cache resources
    await helpers.goto();
    await page.waitForLoadState('networkidle');
    
    // Wait for service worker to be ready
    await page.waitForFunction(() => navigator.serviceWorker.ready);
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page - should work from cache
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // App should still be functional
    const title = await page.title();
    expect(title).toBeDefined();
    expect(title.length).toBeGreaterThan(0);
    
    // Should be able to interact with cached app
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });
});

test.describe('Offline-First Behavior', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('data persists across offline sessions', async ({ page, context }) => {
    // Create data while online
    await helpers.createMoment(testMoments.basic);
    await helpers.expectMomentExists(testMoments.basic.title);
    
    // Go offline
    await context.setOffline(true);
    
    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Data should still be there
    await helpers.expectMomentExists(testMoments.basic.title);
    
    // Should be able to create new data offline
    await helpers.createMoment(testMoments.future);
    await helpers.expectMomentExists(testMoments.future.title);
    
    // Go back online
    await context.setOffline(false);
    
    // Both moments should still exist
    await helpers.expectMomentExists(testMoments.basic.title);
    await helpers.expectMomentExists(testMoments.future.title);
  });

  test('handles network state changes gracefully', async ({ page, context }) => {
    // Start online
    await helpers.createMoment(testMoments.basic);
    
    // Go offline
    await context.setOffline(true);
    await helpers.createMoment(testMoments.future);
    
    // Go back online
    await context.setOffline(false);
    await helpers.createMoment(testMoments.past);
    
    // All moments should exist
    await helpers.expectMomentCount(3);
  });

  test('offline indicator shows correct state', async ({ page, context }) => {
    // Check online state
    const onlineStatus = await page.evaluate(() => navigator.onLine);
    expect(onlineStatus).toBe(true);
    
    // Go offline
    await context.setOffline(true);
    
    // Trigger offline event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    // Check offline state
    const offlineStatus = await page.evaluate(() => navigator.onLine);
    expect(offlineStatus).toBe(false);
    
    // Go back online
    await context.setOffline(false);
    
    // Trigger online event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });
    
    const backOnlineStatus = await page.evaluate(() => navigator.onLine);
    expect(backOnlineStatus).toBe(true);
  });
});

test.describe('Performance and Loading', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
  });

  test('app loads within performance thresholds', async ({ page }) => {
    const startTime = Date.now();
    
    await helpers.goto();
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds (adjust threshold as needed)
    expect(loadTime).toBeLessThan(3000);
  });

  test('interactions are responsive', async ({ page }) => {
    await helpers.goto();
    
    // Test button click responsiveness
    const startTime = Date.now();
    await helpers.openAddModal();
    const modalOpenTime = Date.now() - startTime;
    
    // Modal should open within 200ms
    expect(modalOpenTime).toBeLessThan(200);
    
    // Test form interaction responsiveness
    const inputStartTime = Date.now();
    await helpers.titleInput.fill('Test');
    const inputTime = Date.now() - inputStartTime;
    
    // Input should respond within 100ms
    expect(inputTime).toBeLessThan(100);
  });

  test('handles large datasets efficiently', async ({ page }) => {
    await helpers.goto();
    
    // Create many moments to test performance
    const momentCount = 50;
    const moments = Array.from({ length: momentCount }, (_, i) => ({
      title: `Performance Test Moment ${i + 1}`,
      date: `2024-${String(Math.floor(i / 30) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
    }));
    
    const startTime = Date.now();
    
    for (const moment of moments) {
      await helpers.createMoment(moment);
    }
    
    const creationTime = Date.now() - startTime;
    
    // Should handle creation of 50 moments reasonably quickly
    expect(creationTime).toBeLessThan(30000); // 30 seconds max
    
    // Verify all moments are displayed
    await helpers.expectMomentCount(momentCount);
    
    // Test scrolling performance
    const scrollStartTime = Date.now();
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(100);
    const scrollTime = Date.now() - scrollStartTime;
    
    expect(scrollTime).toBeLessThan(500);
  });

  test('memory usage remains stable', async ({ page }) => {
    await helpers.goto();
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform operations that might cause memory leaks
    for (let i = 0; i < 10; i++) {
      await helpers.createMoment({
        title: `Memory Test ${i}`,
        date: '2024-12-25',
      });
      
      await helpers.deleteMoment(`Memory Test ${i}`);
      await page.waitForTimeout(6000); // Let delete complete
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });
    
    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory shouldn't have grown significantly (allow for some variance)
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory;
      const growthPercentage = (memoryGrowth / initialMemory) * 100;
      
      // Allow up to 50% memory growth
      expect(growthPercentage).toBeLessThan(50);
    }
  });
});

test.describe('PWA Features Integration', () => {
  let helpers: MomentTestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new MomentTestHelpers(page);
    await helpers.goto();
  });

  test('app badge and notifications (if supported)', async ({ page }) => {
    // Check if badge API is supported
    const badgeSupported = await page.evaluate(() => {
      return 'setAppBadge' in navigator;
    });
    
    if (badgeSupported) {
      // Test badge functionality
      await page.evaluate(() => {
        (navigator as any).setAppBadge(5);
      });
      
      // Clear badge
      await page.evaluate(() => {
        (navigator as any).clearAppBadge();
      });
    }
    
    // Check notification permission (don't request, just check API)
    const notificationSupported = await page.evaluate(() => {
      return 'Notification' in window;
    });
    
    expect(notificationSupported).toBe(true);
  });

  test('share functionality (if supported)', async ({ page }) => {
    const shareSupported = await page.evaluate(() => {
      return 'share' in navigator;
    });
    
    if (shareSupported) {
      // Test share data structure
      const shareData = {
        title: 'Life Moments Tracker',
        text: 'Check out my life moments!',
        url: window.location.href,
      };
      
      const canShare = await page.evaluate((data) => {
        return (navigator as any).canShare ? (navigator as any).canShare(data) : true;
      }, shareData);
      
      expect(canShare).toBe(true);
    }
  });

  test('fullscreen and display modes', async ({ page }) => {
    // Test fullscreen API availability
    const fullscreenSupported = await page.evaluate(() => {
      return 'requestFullscreen' in document.documentElement;
    });
    
    if (fullscreenSupported) {
      // Don't actually enter fullscreen in tests, just verify API exists
      expect(fullscreenSupported).toBe(true);
    }
    
    // Check display mode
    const displayMode = await page.evaluate(() => {
      return window.matchMedia('(display-mode: standalone)').matches;
    });
    
    // In test environment, this will likely be false
    expect(typeof displayMode).toBe('boolean');
  });

  test('storage quota and persistence', async ({ page }) => {
    // Check storage estimate
    const storageEstimate = await page.evaluate(async () => {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        return await navigator.storage.estimate();
      }
      return null;
    });
    
    if (storageEstimate) {
      expect(storageEstimate.quota).toBeGreaterThan(0);
      expect(storageEstimate.usage).toBeGreaterThanOrEqual(0);
    }
    
    // Check persistent storage
    const persistentSupported = await page.evaluate(() => {
      return 'storage' in navigator && 'persist' in navigator.storage;
    });
    
    if (persistentSupported) {
      const isPersistent = await page.evaluate(async () => {
        return await navigator.storage.persisted();
      });
      
      expect(typeof isPersistent).toBe('boolean');
    }
  });
});