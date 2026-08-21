import { LRUStrategy } from '../../src/strategies/lru';

describe('LRUStrategy', () => {
  let strategy: LRUStrategy;

  beforeEach(() => {
    strategy = new LRUStrategy();
  });

  describe('onAccess', () => {
    it('should move key to front', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');
      strategy.onInsert('c');
      // accessOrder = ['c', 'b', 'a']

      strategy.onAccess('a');
      // accessOrder = ['a', 'c', 'b']

      // a ở đầu (most recent), b ở cuối (least recent)
      expect(strategy.onEvict()).toBe('b');
    });

    it('should handle multiple accesses', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');
      strategy.onInsert('c');

      strategy.onAccess('a');
      strategy.onAccess('b');

      // a, b ở đầu, c ở cuối
      expect(strategy.onEvict()).toBe('c');
    });
  });

  describe('onInsert', () => {
    it('should add key to front', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');

      expect(strategy.onEvict()).toBe('a');
    });
  });

  describe('onEvict', () => {
    it('should return least recently used key', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');
      strategy.onInsert('c');

      expect(strategy.onEvict()).toBe('a');
      expect(strategy.onEvict()).toBe('b');
      expect(strategy.onEvict()).toBe('c');
    });

    it('should return null when empty', () => {
      expect(strategy.onEvict()).toBeNull();
    });
  });

  describe('onRemove', () => {
    it('should remove specific key', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');
      strategy.onInsert('c');

      strategy.onRemove('b');

      expect(strategy.onEvict()).toBe('a');
      expect(strategy.onEvict()).toBe('c');
    });
  });

  describe('getSize', () => {
    it('should return correct size', () => {
      expect(strategy.getSize()).toBe(0);

      strategy.onInsert('a');
      expect(strategy.getSize()).toBe(1);

      strategy.onInsert('b');
      expect(strategy.getSize()).toBe(2);

      strategy.onEvict();
      expect(strategy.getSize()).toBe(1);
    });
  });
});
