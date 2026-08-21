import { FIFOStrategy } from '../../src/strategies/fifo';

describe('FIFOStrategy', () => {
  let strategy: FIFOStrategy;

  beforeEach(() => {
    strategy = new FIFOStrategy();
  });

  describe('onAccess', () => {
    it('should not change order', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');
      strategy.onInsert('c');

      strategy.onAccess('a');
      strategy.onAccess('b');

      // FIFO không quan tâm access
      expect(strategy.onEvict()).toBe('a');
    });
  });

  describe('onInsert', () => {
    it('should add key to end', () => {
      strategy.onInsert('a');
      strategy.onInsert('b');

      expect(strategy.onEvict()).toBe('a');
    });
  });

  describe('onEvict', () => {
    it('should return oldest key', () => {
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
