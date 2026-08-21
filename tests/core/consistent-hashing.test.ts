import { ConsistentHash } from '../../src/core/consistent-hashing';

describe('ConsistentHash', () => {
  let ring: ConsistentHash;

  beforeEach(() => {
    ring = new ConsistentHash({ virtualNodes: 10 });
  });

  describe('getNode', () => {
    it('should return null when ring is empty', () => {
      const node = ring.getNode('user:123');
      expect(node).toBeNull();
    });

    it('should return same node for same key', () => {
      ring.addNode({ id: 'node-1' });
      const node1 = ring.getNode('user:123');
      const node2 = ring.getNode('user:123');
      expect(node1?.id).toBe(node2?.id);
    });

    it('should return node for any key', () => {
      ring.addNode({ id: 'node-1' });
      const node = ring.getNode('any-key');
      expect(node).not.toBeNull();
      expect(node?.id).toBe('node-1');
    });
  });

  describe('addNode', () => {
    it('should add node to ring', () => {
      ring.addNode({ id: 'node-1' });
      expect(ring.hasNode('node-1')).toBe(true);
    });

    it('should handle multiple virtual nodes', () => {
      ring.addNode({ id: 'node-1' });
      expect(ring.getRingSize()).toBe(10);
    });

    it('should distribute keys across nodes', () => {
      ring.addNode({ id: 'node-1' });
      ring.addNode({ id: 'node-2' });
      ring.addNode({ id: 'node-3' });

      const distribution = new Map<string, number>();
      for (let i = 0; i < 1000; i++) {
        const node = ring.getNode(`key:${i}`);
        if (node) {
          distribution.set(node.id, (distribution.get(node.id) || 0) + 1);
        }
      }

      // Mỗi node phải có ít nhất 1 key
      expect(distribution.size).toBe(3);
      for (const count of distribution.values()) {
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  describe('removeNode', () => {
    it('should remove node from ring', () => {
      ring.addNode({ id: 'node-1' });
      ring.removeNode('node-1');
      expect(ring.hasNode('node-1')).toBe(false);
    });

    it('should redistribute keys to remaining nodes', () => {
      ring.addNode({ id: 'node-1' });
      ring.addNode({ id: 'node-2' });

      // Lưu node cho mỗi key trước khi xóa
      const keysBefore = new Map<string, string>();
      for (let i = 0; i < 100; i++) {
        const node = ring.getNode(`key:${i}`);
        if (node) keysBefore.set(`key:${i}`, node.id);
      }

      ring.removeNode('node-1');

      // Kiểm tra tất cả keys vẫn có node
      for (let i = 0; i < 100; i++) {
        const node = ring.getNode(`key:${i}`);
        expect(node).not.toBeNull();
        expect(node?.id).toBe('node-2');
      }
    });
  });

  describe('getKeyDistribution', () => {
    it('should return distribution map', () => {
      ring.addNode({ id: 'node-1' });
      ring.addNode({ id: 'node-2' });

      const distribution = ring.getKeyDistribution();
      expect(distribution.has('node-1')).toBe(true);
      expect(distribution.has('node-2')).toBe(true);
    });
  });

  describe('getRingSize', () => {
    it('should return number of positions', () => {
      expect(ring.getRingSize()).toBe(0);

      ring.addNode({ id: 'node-1' });
      expect(ring.getRingSize()).toBe(10);

      ring.addNode({ id: 'node-2' });
      expect(ring.getRingSize()).toBe(20);
    });
  });

  describe('hasNode', () => {
    it('should return true for existing node', () => {
      ring.addNode({ id: 'node-1' });
      expect(ring.hasNode('node-1')).toBe(true);
    });

    it('should return false for non-existing node', () => {
      expect(ring.hasNode('node-1')).toBe(false);
    });
  });

  describe('getNodes', () => {
    it('should return all nodes', () => {
      ring.addNode({ id: 'node-1' });
      ring.addNode({ id: 'node-2' });

      const nodes = ring.getNodes();
      expect(nodes.length).toBe(2);
      expect(nodes.map(n => n.id)).toContain('node-1');
      expect(nodes.map(n => n.id)).toContain('node-2');
    });
  });
});
