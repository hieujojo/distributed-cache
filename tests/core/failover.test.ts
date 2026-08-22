/**
 * Tests cho FailoverManager
 */

import { FailoverManager } from '../../src/core/failover';
import { ClusterManager } from '../../src/core/cluster';
import { CacheNode } from '../../src/core/node';

// Reset singleton trước mỗi test
beforeEach(() => {
  ClusterManager.resetInstance();
});

afterEach(() => {
  ClusterManager.resetInstance();
});

describe('FailoverManager', () => {
  describe('detectFailure', () => {
    it('should detect failed node when exceeding threshold', () => {
      const cluster = ClusterManager.getInstance();
      const failover = new FailoverManager(cluster, { failureThreshold: 3 });

      expect(failover.detectFailure('node-1', 4)).toBe(true);
    });

    it('should not detect failure below threshold', () => {
      const cluster = ClusterManager.getInstance();
      const failover = new FailoverManager(cluster, { failureThreshold: 3 });

      expect(failover.detectFailure('node-1', 2)).toBe(false);
    });

    it('should not detect failure at exact threshold', () => {
      const cluster = ClusterManager.getInstance();
      const failover = new FailoverManager(cluster, { failureThreshold: 3 });

      expect(failover.detectFailure('node-1', 3)).toBe(false);
    });
  });

  describe('triggerFailover', () => {
    it('should remove failed node from cluster', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node1);

      expect(cluster.getNodeById('node-1')).toBeNull();
      expect(cluster.getSize()).toBe(1);
    });

    it('should start election when primary fails', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      expect(cluster.getPrimary()?.id).toBe('node-1');

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node1);

      // Primary mới là node-2 (highest ID)
      expect(cluster.getPrimary()?.id).toBe('node-2');
    });

    it('should not start election when replica fails', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      expect(cluster.getPrimary()?.id).toBe('node-1');

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node2);

      // Primary vẫn là node-1
      expect(cluster.getPrimary()?.id).toBe('node-1');
    });

    it('should track failed node', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node1);

      expect(failover.isNodeFailed('node-1')).toBe(true);
      expect(failover.getFailedNodes()).toContain('node-1');
    });
  });

  describe('promoteReplica', () => {
    it('should promote replica to primary', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const failover = new FailoverManager(cluster);
      failover.promoteReplica(node2);

      expect(cluster.getPrimary()).toBe(node2);
    });
  });

  describe('handleRecovery', () => {
    it('should remove node from failed list', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node1);
      expect(failover.isNodeFailed('node-1')).toBe(true);

      await failover.handleRecovery(node1);
      expect(failover.isNodeFailed('node-1')).toBe(false);
    });

    it('should mark recovered node as healthy', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node1);

      await failover.handleRecovery(node1);
      expect(cluster.isHealthy('node-1')).toBe(true);
    });

    it('should re-add recovered node to cluster', async () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);

      const failover = new FailoverManager(cluster);
      await failover.triggerFailover(node1);
      expect(cluster.getNodeById('node-1')).toBeNull();

      await failover.handleRecovery(node1);
      expect(cluster.getNodeById('node-1')).toBe(node1);
    });
  });

  describe('config', () => {
    it('should use default config', () => {
      const cluster = ClusterManager.getInstance();
      const failover = new FailoverManager(cluster);

      expect(failover.getFailureThreshold()).toBe(3);
      expect(failover.getRecoveryTimeout()).toBe(30000);
    });

    it('should accept custom config', () => {
      const cluster = ClusterManager.getInstance();
      const failover = new FailoverManager(cluster, {
        failureThreshold: 5,
        recoveryTimeout: 60000,
      });

      expect(failover.getFailureThreshold()).toBe(5);
      expect(failover.getRecoveryTimeout()).toBe(60000);
    });
  });

  describe('getElectionManager', () => {
    it('should return election manager', () => {
      const cluster = ClusterManager.getInstance();
      const failover = new FailoverManager(cluster);

      expect(failover.getElectionManager()).toBeDefined();
    });
  });
});
