import { vi } from 'vitest';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { addRxPlugin } from 'rxdb';

addRxPlugin(RxDBDevModePlugin);
// Mock IndexedDB for testing
import 'fake-indexeddb/auto';

// attach node crypto subtle for rxdb
import { webcrypto } from 'crypto'
Object.defineProperty(global, 'crypto', {
  value: webcrypto as unknown as Crypto
})

// only override randomUUID function BUT keep subtle intact
// @ts-expect-error - randomUUID is not writable in type but we intentionally override for deterministic test
global.crypto.randomUUID = () => `test-uuid-${Math.random().toString(36).substring(2, 9)}`

// Mock navigator properties
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      addEventListener: vi.fn(),
      installing: null,
      waiting: null,
      active: null,
      update: vi.fn(),
    }),
    addEventListener: vi.fn(),
    controller: null,
  },
  writable: true,
});

// Mock storage API
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn().mockResolvedValue({
      usage: 1024 * 1024,
      quota: 10 * 1024 * 1024,
    }),
  },
  writable: true,
});

// Mock connection API
Object.defineProperty(navigator, 'connection', {
  value: {
    effectiveType: '4g',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

// Mock window.caches
Object.defineProperty(window, 'caches', {
  value: {
    keys: vi.fn().mockResolvedValue([]),
    delete: vi.fn().mockResolvedValue(true),
    open: vi.fn().mockResolvedValue({
      match: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(true),
      keys: vi.fn().mockResolvedValue([]),
    }),
  },
  writable: true,
});

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  // Suppress specific warnings that are expected during testing
  const message = args[0];
  if (
    typeof message === 'string' &&
    (message.includes('RxDB') || 
     message.includes('IndexedDB') ||
     message.includes('Service Worker'))
  ) {
    return;
  }
  originalWarn(...args);
};