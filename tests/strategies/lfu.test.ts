import { LFUStrategy } from '../../src/strategies/lfu';

describe('LFUStrategy', () => {
  let strategy: LFUStrategy;

  beforeEach(() => {
    strategy = new LFUStrategy();
  });

  describe('onAccess', () => {
    it('should increment frequency', () => {
      strategy.onInsert('a');
      strategy.onAccess('a');
      strategy.onAccess('a');

      // a có frequency = 3
      strategy.onInsert('b');
      // b có frequency = 1

      expect(strategy.onEvict()).toBe('b');
    });
  });

  describe('onInsert', () => {
    it('should set frequency to 1', () => {
      strategy.onInsert('a');

      expect(strategy.getSize()).toBe(1);
    });
  });

  describe('onEvict', () => {
    it('should return lowest frequency key', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');
      strategy.onInsert('c');

      strategy.onAccess('a');
      strategy.onAccess('a');
      strategy.onAccess('b');

      // a: 3, b: 2, c: 1
      expect(strategy.onEvict()).toBe('c');
    });

    it('should return null when empty', () => {
      expect(strategy.onEvict()).toBeNull();
    });
  });

  describe('onRemove', () => {
    it('should remove key from tracking', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');

      strategy.onRemove('a');

      expect(strategy.getSize()).toBe(1);
      expect(strategy.onEvict()).toBe('b');
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
