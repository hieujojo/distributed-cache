/**
 * Tests cho InvalidationManager
 */

import { InvalidationManager, InvalidationEvent } from '../../src/core/invalidation';

describe('InvalidationManager', () => {
  let manager: InvalidationManager;

  beforeEach(() => {
    manager = new InvalidationManager();
  });

  afterEach(() => {
    manager.stopExpirationCheck();
  });

  describe('setTTL', () => {
    it('should set expiration time', () => {
      manager.setTTL('key1', 1000);

      expect(manager.getTTLLength()).toBe(1);
      expect(manager.checkTTL('key1')).toBe(true);
    });

    it('should overwrite existing TTL', () => {
      manager.setTTL('key1', 1000);
      manager.setTTL('key1', 2000);

      expect(manager.getTTLLength()).toBe(1);
    });

    it('should set multiple keys', () => {
      manager.setTTL('key1', 1000);
      manager.setTTL('key2', 2000);
      manager.setTTL('key3', 3000);

      expect(manager.getTTLLength()).toBe(3);
    });
  });

  describe('checkTTL', () => {
    it('should return true if not expired', () => {
      manager.setTTL('key1', 10000);

      expect(manager.checkTTL('key1')).toBe(true);
    });

    it('should return false if expired', (done) => {
      manager.setTTL('key1', 50); // 50ms

      setTimeout(() => {
        expect(manager.checkTTL('key1')).toBe(false);
        done();
      }, 100);
    });

    it('should return false if no TTL', () => {
      expect(manager.checkTTL('nonexistent')).toBe(false);
    });

    it('should emit KEY_EXPIRED event when expired', (done) => {
      const events: InvalidationEvent[] = [];

      manager.subscribe((event) => {
        events.push(event);
      });

      manager.setTTL('key1', 50); // 50ms

      setTimeout(() => {
        manager.checkTTL('key1');

        expect(events.length).toBe(1);
        expect(events[0].type).toBe('KEY_EXPIRED');
        expect(events[0].key).toBe('key1');
        done();
      }, 100);
    });
  });

  describe('invalidate', () => {
    it('should remove key from TTL map', () => {
      manager.setTTL('key1', 10000);
      expect(manager.getTTLLength()).toBe(1);

      manager.invalidate('key1');

      expect(manager.getTTLLength()).toBe(0);
    });

    it('should emit KEY_DELETED event', (done) => {
      const events: InvalidationEvent[] = [];

      manager.subscribe((event) => {
        events.push(event);
      });

      manager.setTTL('key1', 10000);
      manager.invalidate('key1');

      setTimeout(() => {
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('KEY_DELETED');
        expect(events[0].key).toBe('key1');
        done();
      }, 10);
    });

    it('should handle invalidating nonexistent key', () => {
      // Không nên throw error
      expect(() => manager.invalidate('nonexistent')).not.toThrow();
    });
  });

  describe('onDatabaseChange', () => {
    it('should handle KEY_UPDATED event', (done) => {
      const events: InvalidationEvent[] = [];

      manager.subscribe((event) => {
        events.push(event);
      });

      manager.setTTL('key1', 10000);

      manager.onDatabaseChange({
        type: 'KEY_UPDATED',
        key: 'key1',
        timestamp: Date.now(),
      });

      setTimeout(() => {
        // KEY_UPDATED → invalidate → emit KEY_DELETED
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('KEY_DELETED');
        done();
      }, 10);
    });

    it('should handle KEY_DELETED event', (done) => {
      const events: InvalidationEvent[] = [];

      manager.subscribe((event) => {
        events.push(event);
      });

      manager.setTTL('key1', 10000);

      manager.onDatabaseChange({
        type: 'KEY_DELETED',
        key: 'key1',
        timestamp: Date.now(),
      });

      setTimeout(() => {
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('KEY_DELETED');
        done();
      }, 10);
    });

    it('should handle KEY_EXPIRED event', () => {
      manager.setTTL('key1', 10000);

      manager.onDatabaseChange({
        type: 'KEY_EXPIRED',
        key: 'key1',
        timestamp: Date.now(),
      });

      // KEY_EXPIRED → xóa khỏi ttlMap
      expect(manager.getTTLLength()).toBe(0);
    });
  });

  describe('subscribe/unsubscribe', () => {
    it('should receive invalidation events', (done) => {
      const events: InvalidationEvent[] = [];

      manager.subscribe((event) => {
        events.push(event);
      });

      manager.setTTL('key1', 10000);
      manager.invalidate('key1');

      setTimeout(() => {
        expect(events.length).toBe(1);
        expect(events[0].type).toBe('KEY_DELETED');
        done();
      }, 10);
    });

    it('should stop receiving events after unsubscribe', (done) => {
      const events: InvalidationEvent[] = [];

      const callback = (event: InvalidationEvent) => {
        events.push(event);
      };

      manager.subscribe(callback);
      manager.setTTL('key1', 10000);
      manager.invalidate('key1');

      setTimeout(() => {
        expect(events.length).toBe(1);

        manager.unsubscribe(callback);

        manager.setTTL('key2', 10000);
        manager.invalidate('key2');

        setTimeout(() => {
          // Không nhận thêm events nữa
          expect(events.length).toBe(1);
          done();
        }, 10);
      }, 10);
    });

    it('should support multiple subscribers', (done) => {
      const events1: InvalidationEvent[] = [];
      const events2: InvalidationEvent[] = [];

      manager.subscribe((event) => events1.push(event));
      manager.subscribe((event) => events2.push(event));

      manager.setTTL('key1', 10000);
      manager.invalidate('key1');

      setTimeout(() => {
        expect(events1.length).toBe(1);
        expect(events2.length).toBe(1);
        done();
      }, 10);
    });
  });

  describe('automatic expiration', () => {
    it('should auto-expire keys after interval', (done) => {
      const events: InvalidationEvent[] = [];

      manager.subscribe((event) => {
        events.push(event);
      });

      // Set TTL ngắn (50ms), interval check là 1000ms
      // Test phải đợi interval chạy
      manager.setTTL('key1', 50);

      // Đợi 1.5s để interval check chạy
      setTimeout(() => {
        expect(events.some(e => e.type === 'KEY_EXPIRED' && e.key === 'key1')).toBe(true);
        done();
      }, 1500);
    });
  });

  describe('getTTLLength', () => {
    it('should return 0 initially', () => {
      expect(manager.getTTLLength()).toBe(0);
    });

    it('should track TTL entries', () => {
      manager.setTTL('key1', 10000);
      manager.setTTL('key2', 10000);

      expect(manager.getTTLLength()).toBe(2);
    });

    it('should decrease after invalidation', () => {
      manager.setTTL('key1', 10000);
      manager.setTTL('key2', 10000);

      manager.invalidate('key1');

      expect(manager.getTTLLength()).toBe(1);
    });
  });
});
