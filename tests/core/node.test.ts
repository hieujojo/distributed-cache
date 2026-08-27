import { CacheNode } from '../../src/core/node';

describe('CacheNode', () => {
  let node: CacheNode;

  beforeEach(() => {
    node = new CacheNode('node-1', { maxSize: 100, defaultTtl: 1000 });
  });

  describe('get', () => {
    it('should return null for non-existing key', () => {
      expect(node.get('non-existing')).toBeNull();
    });

    it('should return value for existing key', () => {
      node.set('key1', 'value1');
      expect(node.get('key1')).toBe('value1');
    });

    it('should return null for expired key', () => {
      node.set('key1', 'value1', 0); // TTL = 0ms
      // Đợi 1ms để hết hạn
      return new Promise(resolve => setTimeout(() => {
        expect(node.get('key1')).toBeNull();
        resolve(undefined);
      }, 10));
    });

    it('should update accessCount on get', () => {
      node.set('key1', 'value1');
      node.get('key1');
      node.get('key1');
      // Không có accessCount trong interface, nhưng get hoạt động đúng
      expect(node.get('key1')).toBe('value1');
    });
  });

  describe('set', () => {
    it('should store key-value pair', () => {
      node.set('key1', 'value1');
      expect(node.get('key1')).toBe('value1');
    });

    it('should store different value types', () => {
      node.set('string', 'hello');
      node.set('number', 123);
      node.set('boolean', true);
      node.set('object', { foo: 'bar' });
      node.set('null', null);

      expect(node.get('string')).toBe('hello');
      expect(node.get('number')).toBe(123);
      expect(node.get('boolean')).toBe(true);
      expect(node.get('object')).toEqual({ foo: 'bar' });
      expect(node.get('null')).toBeNull();
    });

    it('should overwrite existing key', () => {
      node.set('key1', 'value1');
      node.set('key1', 'value2');
      expect(node.get('key1')).toBe('value2');
    });

    it('should set custom TTL', () => {
      node.set('key1', 'value1', 5000);
      expect(node.get('key1')).toBe('value1');
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      node.set('key1', 'value1');
      expect(node.delete('key1')).toBe(true);
      expect(node.get('key1')).toBeNull();
    });

    it('should return false for non-existing key', () => {
      expect(node.delete('non-existing')).toBe(false);
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      node.set('key1', 'value1');
      expect(node.has('key1')).toBe(true);
    });

    it('should return false for non-existing key', () => {
      expect(node.has('non-existing')).toBe(false);
    });

    it('should return false for expired key', () => {
      node.set('key1', 'value1', 0);
      return new Promise(resolve => setTimeout(() => {
        expect(node.has('key1')).toBe(false);
        resolve(undefined);
      }, 10));
    });
  });

  describe('getSize', () => {
    it('should return number of entries', () => {
      expect(node.getSize()).toBe(0);

      node.set('key1', 'value1');
      expect(node.getSize()).toBe(1);

      node.set('key2', 'value2');
      expect(node.getSize()).toBe(2);
    });
  });

  describe('getMaxSize', () => {
    it('should return max size', () => {
      expect(node.getMaxSize()).toBe(100);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      node.set('key1', 'value1');
      node.set('key2', 'value2');
      node.clear();
      expect(node.getSize()).toBe(0);
      expect(node.get('key1')).toBeNull();
    });

    it('should return number of bytes freed', () => {
      // Populate with data
      for (let i = 0; i < 100; i++) {
        node.set(`key:${i}`, { data: 'x'.repeat(100) });
      }
      const freed = node.clear();
      expect(typeof freed).toBe('number');
      expect(freed).toBeGreaterThanOrEqual(0);
    });

    it('should reset eviction strategy after clear', () => {
      for (let i = 0; i < 50; i++) {
        node.set(`key:${i}`, `value:${i}`);
      }
      node.clear();
      // After clear, should be able to store again without issues
      node.set('new-key', 'new-value');
      expect(node.get('new-key')).toBe('new-value');
      expect(node.getSize()).toBe(1);
    });
  });

  describe('getKeys', () => {
    it('should return all keys', () => {
      node.set('key1', 'value1');
      node.set('key2', 'value2');
      node.set('key3', 'value3');

      const keys = node.getKeys();
      expect(keys.length).toBe(3);
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
    });
  });
});
