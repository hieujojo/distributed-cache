/**
 * Tests cho CacheNode — eviction strategy + TTL sweep
 */
import { CacheNode } from '../../src/core/node';

// Tắt sweep timer mặc định trong tests để không ảnh hưởng async assertions
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('CacheNode — eviction (maxSize enforcement)', () => {
  it('should evict oldest entry when maxSize exceeded (default LRU)', () => {
    const node = new CacheNode('test', { maxSize: 3, defaultTtl: 60_000, sweepIntervalMs: 0 });
    node.set('a', '1');
    node.set('b', '2');
    node.set('c', '3');
    expect(node.getSize()).toBe(3);

    // Trigger eviction
    node.set('d', '4');
    expect(node.getSize()).toBe(3);
    // 'a' should have been evicted (LRU: least recently used)
    expect(node.get('a')).toBeNull();
    expect(node.get('d')).toBe('4');
  });

  it('should respect access order (LRU)', () => {
    const node = new CacheNode('test', { maxSize: 3, defaultTtl: 60_000, sweepIntervalMs: 0 });
    node.set('a', '1');
    node.set('b', '2');
    node.set('c', '3');

    // Access 'a' → now most recent
    node.get('a');

    // Next insert should evict 'b' (least recently used)
    node.set('d', '4');
    expect(node.get('a')).toBe('1');
    expect(node.get('b')).toBeNull();
    expect(node.get('d')).toBe('4');
  });

  it('should evict correctly with FIFO policy', () => {
    const node = new CacheNode('test', {
      maxSize: 3,
      defaultTtl: 60_000,
      evictionPolicy: 'fifo',
      sweepIntervalMs: 0,
    });
    node.set('a', '1');
    node.set('b', '2');
    node.set('c', '3');

    // Access doesn't matter for FIFO
    node.get('a');

    // Should evict 'a' (first in)
    node.set('d', '4');
    expect(node.get('a')).toBeNull();
    expect(node.get('b')).toBe('2');
    expect(node.get('d')).toBe('4');
  });

  it('should evict correctly with LFU policy', () => {
    const node = new CacheNode('test', {
      maxSize: 3,
      defaultTtl: 60_000,
      evictionPolicy: 'lfu',
      sweepIntervalMs: 0,
    });
    node.set('a', '1');
    node.set('b', '2');
    node.set('c', '3');

    // Access 'a' twice, 'c' once → 'b' has 0 accesses
    node.get('a');
    node.get('a');
    node.get('c');

    // Should evict 'b' (least frequently used)
    node.set('d', '4');
    expect(node.get('b')).toBeNull();
    expect(node.get('a')).toBe('1');
  });

  it('should handle overwrite without growing store', () => {
    const node = new CacheNode('test', { maxSize: 3, defaultTtl: 60_000, sweepIntervalMs: 0 });
    node.set('a', '1');
    node.set('b', '2');
    node.set('a', '3'); // overwrite
    expect(node.getSize()).toBe(2);
    expect(node.get('a')).toBe('3');
  });

  it('should not fail when store is smaller than maxSize', () => {
    const node = new CacheNode('test', { maxSize: 10, defaultTtl: 60_000, sweepIntervalMs: 0 });
    node.set('a', '1');
    expect(node.getSize()).toBe(1);
    expect(node.get('a')).toBe('1');
  });

  it('should allow manual delete to free space', () => {
    const node = new CacheNode('test', { maxSize: 3, defaultTtl: 60_000, sweepIntervalMs: 0 });
    node.set('a', '1');
    node.set('b', '2');
    node.set('c', '3');

    node.delete('b');
    expect(node.getSize()).toBe(2);
    node.set('d', '4');
    expect(node.get('d')).toBe('4');
  });
});

describe('CacheNode — TTL sweep', () => {
  it('should sweep expired entries automatically', () => {
    const node = new CacheNode('test', {
      maxSize: 1000,
      defaultTtl: 5000,
      sweepIntervalMs: 1000, // sweep every 1s
    });

    node.set('a', '1', 2000); // expires in 2s
    node.set('b', '2', 10000); // expires in 10s

    // Advance 3s — 'a' expired, 'b' still alive
    jest.advanceTimersByTime(3000);

    expect(node.getSize()).toBe(1);
    expect(node.get('a')).toBeNull();
    expect(node.get('b')).toBe('2');

    node.stopSweep();
  });

  it('should not sweep if sweepIntervalMs is 0', () => {
    const node = new CacheNode('test', {
      maxSize: 1000,
      defaultTtl: 1000,
      sweepIntervalMs: 0,
    });

    node.set('a', '1', 500);

    // Advance well past expiry — sweep should NOT run
    jest.advanceTimersByTime(5000);

    // 'a' expired but still in store (no sweep)
    expect(node.getSize()).toBe(1);
    // get() returns null (lazy delete)
    expect(node.get('a')).toBeNull();
  });

  it('should release process via unref — sweep timer should not keep Node alive', () => {
    const node = new CacheNode('test', {
      maxSize: 1000,
      defaultTtl: 60_000,
      sweepIntervalMs: 1000,
    });
    // stopSweep is always available
    expect(typeof node.stopSweep).toBe('function');
    node.stopSweep();
  });
});

describe('CacheNode — loadEntries', () => {
  it('should rebuild eviction index and enforce maxSize after load', () => {
    const node = new CacheNode('test', { maxSize: 3, defaultTtl: 60_000, sweepIntervalMs: 0 });

    const entries = new Map();
    const now = Date.now();
    entries.set('a', {
      key: 'a', value: '1', createdAt: now,
      expiresAt: now + 60_000, accessCount: 0, lastAccessedAt: now,
    });
    entries.set('b', {
      key: 'b', value: '2', createdAt: now,
      expiresAt: now + 60_000, accessCount: 0, lastAccessedAt: now,
    });
    entries.set('c', {
      key: 'c', value: '3', createdAt: now,
      expiresAt: now + 60_000, accessCount: 0, lastAccessedAt: now,
    });
    entries.set('d', {
      key: 'd', value: '4', createdAt: now,
      expiresAt: now + 60_000, accessCount: 0, lastAccessedAt: now,
    });

    // Load 4 entries into node with maxSize=3
    node.loadEntries(entries);
    expect(node.getSize()).toBe(3);
  });
});

describe('CacheNode — delete notifies eviction strategy', () => {
  it('should allow insert after delete at capacity', () => {
    const node = new CacheNode('test', { maxSize: 2, defaultTtl: 60_000, sweepIntervalMs: 0 });
    node.set('a', '1');
    node.set('b', '2');

    node.delete('a');
    expect(node.getSize()).toBe(1);

    node.set('c', '3');
    expect(node.getSize()).toBe(2);
    expect(node.get('c')).toBe('3');
    expect(node.get('a')).toBeNull();
  });
});
