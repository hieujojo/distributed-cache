/**
 * Tests cho ClusterManager
 */

import { ClusterManager } from '../../src/core/cluster';
import { CacheNode } from '../../src/core/node';

// Reset singleton trước mỗi test
beforeEach(() => {
  ClusterManager.resetInstance();
});

afterEach(() => {
  ClusterManager.resetInstance();
});

describe('ClusterManager', () => {
  describe('getInstance', () => {
    it('should return same instance', () => {
      const a = ClusterManager.getInstance();
      const b = ClusterManager.getInstance();

      expect(a).toBe(b);
    });

    it('should reset instance', () => {
      const a = ClusterManager.getInstance();
      ClusterManager.resetInstance();
      const b = ClusterManager.getInstance();

      expect(a).not.toBe(b);
    });
  });

  describe('addNode', () => {
    it('should add node to cluster', () => {
      const cluster = ClusterManager.getInstance();
      const node = new CacheNode('node-1');

      cluster.addNode(node);

      expect(cluster.getSize()).toBe(1);
      expect(cluster.getNodeById('node-1')).toBe(node);
    });

    it('should set first node as primary', () => {
      const cluster = ClusterManager.getInstance();
      const node = new CacheNode('node-1');

      cluster.addNode(node);

      expect(cluster.getPrimary()).toBe(node);
    });

    it('should not change primary when adding more nodes', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      expect(cluster.getPrimary()).toBe(node1);
    });

    it('should add multiple nodes', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');
      const node3 = new CacheNode('node-3');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.addNode(node3);

      expect(cluster.getSize()).toBe(3);
      expect(cluster.getAllNodes()).toHaveLength(3);
    });
  });

  describe('removeNode', () => {
    it('should remove node from cluster', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.removeNode('node-1');

      expect(cluster.getSize()).toBe(1);
      expect(cluster.getNodeById('node-1')).toBeNull();
    });

    it('should clear primary when removing primary', () => {
      const cluster = ClusterManager.getInstance();
      const node = new CacheNode('node-1');

      cluster.addNode(node);
      expect(cluster.getPrimary()).toBe(node);

      cluster.removeNode('node-1');
      expect(cluster.getPrimary()).toBeNull();
    });

    it('should not affect other nodes when removing one', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.removeNode('node-1');

      expect(cluster.getNodeById('node-2')).toBe(node2);
    });
  });

  describe('getNode', () => {
    it('should route key to correct node', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      // Set value trên node được route tới
      const targetNode1 = cluster.getNode('key1');
      const targetNode2 = cluster.getNode('key2');

      expect(targetNode1).not.toBeNull();
      expect(targetNode2).not.toBeNull();

      // Set value trên node được route
      targetNode1!.set('key1', 'val1');
      targetNode2!.set('key2', 'val2');

      // Get via cluster routing — phải trả về đúng value
      const getResult1 = cluster.getNode('key1');
      const getResult2 = cluster.getNode('key2');

      expect(getResult1!.get('key1')).toBe('val1');
      expect(getResult2!.get('key2')).toBe('val2');
    });

    it('should return null when no nodes', () => {
      const cluster = ClusterManager.getInstance();

      const result = cluster.getNode('any-key');

      expect(result).toBeNull();
    });
  });

  describe('getHealthyNodes', () => {
    it('should return all healthy nodes', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const healthy = cluster.getHealthyNodes();

      expect(healthy).toHaveLength(2);
    });

    it('should not return unhealthy nodes', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.markUnhealthy('node-1');

      const healthy = cluster.getHealthyNodes();

      expect(healthy).toHaveLength(1);
      expect(healthy[0].id).toBe('node-2');
    });
  });

  describe('getStats', () => {
    it('should return correct stats', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const stats = cluster.getStats();

      expect(stats.totalNodes).toBe(2);
      expect(stats.healthyNodes).toBe(2);
      expect(stats.primaryId).toBe('node-1');
      expect(stats.ringSize).toBeGreaterThan(0);
    });

    it('should count healthy nodes correctly', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.markUnhealthy('node-1');

      const stats = cluster.getStats();

      expect(stats.totalNodes).toBe(2);
      expect(stats.healthyNodes).toBe(1);
    });
  });

  describe('heartbeat', () => {
    it('should receive heartbeat and mark node healthy', () => {
      const cluster = ClusterManager.getInstance();
      const node = new CacheNode('node-1');

      cluster.addNode(node);
      cluster.markUnhealthy('node-1');

      cluster.receiveHeartbeat('node-1');

      expect(cluster.isHealthy('node-1')).toBe(true);
    });

    it('should detect failed node after threshold', (done) => {
      const cluster = ClusterManager.getInstance();
      const node = new CacheNode('node-1');

      let failedNodeId: string | null = null;
      cluster.setOnNodeFailed((nodeId) => {
        failedNodeId = nodeId;
      });

      cluster.addNode(node);
      cluster.startHeartbeat(50, 100); // fast for testing

      // Không gửi heartbeat → node sẽ fail
      setTimeout(() => {
        cluster.stopHeartbeat();
        expect(failedNodeId).toBe('node-1');
        done();
      }, 300);
    });
  });

  describe('isEmpty', () => {
    it('should return true when no nodes', () => {
      const cluster = ClusterManager.getInstance();
      expect(cluster.isEmpty()).toBe(true);
    });

    it('should return false when has nodes', () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));
      expect(cluster.isEmpty()).toBe(false);
    });
  });

  describe('flushAll', () => {
    it('should clear all nodes in cluster', () => {
      const cluster = ClusterManager.getInstance();
      const n1 = new CacheNode('node-1', { maxSize: 100 });
      const n2 = new CacheNode('node-2', { maxSize: 100 });
      const n3 = new CacheNode('node-3', { maxSize: 100 });
      cluster.addNode(n1);
      cluster.addNode(n2);
      cluster.addNode(n3);

      n1.set('a', 1);
      n2.set('b', 2);
      n3.set('c', 3);

      const freed = cluster.flushAll();
      expect(typeof freed).toBe('number');
      expect(freed).toBeGreaterThanOrEqual(0);
      expect(n1.getSize()).toBe(0);
      expect(n2.getSize()).toBe(0);
      expect(n3.getSize()).toBe(0);
    });

    it('should return 0 when cluster is empty', () => {
      const cluster = ClusterManager.getInstance();
      expect(cluster.flushAll()).toBe(0);
    });
  });
});
