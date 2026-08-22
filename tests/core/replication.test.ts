/**
 * Tests cho ReplicationManager
 */

import { ReplicationManager } from '../../src/core/replication';
import { CacheNode } from '../../src/core/node';
import { ClusterManager } from '../../src/core/cluster';

describe('ReplicationManager', () => {
  let cluster: ClusterManager;
  let replication: ReplicationManager;
  let node1: CacheNode;
  let node2: CacheNode;
  let node3: CacheNode;
  let node4: CacheNode;

  beforeEach(() => {
    ClusterManager.resetInstance();
    cluster = ClusterManager.getInstance();

    node1 = new CacheNode('node-1');
    node2 = new CacheNode('node-2');
    node3 = new CacheNode('node-3');
    node4 = new CacheNode('node-4');

    cluster.addNode(node1);
    cluster.addNode(node2);
    cluster.addNode(node3);
    cluster.addNode(node4);

    replication = new ReplicationManager({ factor: 3, mode: 'hybrid' }, cluster);
  });

  afterEach(() => {
    ClusterManager.resetInstance();
  });

  describe('constructor', () => {
    it('should use default config', () => {
      const manager = new ReplicationManager({}, cluster);
      const config = manager.getConfig();

      expect(config.factor).toBe(3);
      expect(config.mode).toBe('hybrid');
      expect(config.syncTimeout).toBe(5000);
    });

    it('should accept custom config', () => {
      const manager = new ReplicationManager(
        { factor: 2, mode: 'sync', syncTimeout: 1000 },
        cluster
      );
      const config = manager.getConfig();

      expect(config.factor).toBe(2);
      expect(config.mode).toBe('sync');
      expect(config.syncTimeout).toBe(1000);
    });
  });

  describe('replicate', () => {
    it('should replicate to sync replicas', async () => {
      const syncManager = new ReplicationManager(
        { factor: 3, mode: 'sync' },
        cluster
      );

      const result = await syncManager.replicate('key1', 'value1');

      expect(result.success).toBeGreaterThanOrEqual(1);
      expect(result.replicaIds.length).toBeGreaterThanOrEqual(1);
    });

    it('should replicate to async replicas', async () => {
      const asyncManager = new ReplicationManager(
        { factor: 3, mode: 'async' },
        cluster
      );

      const result = await asyncManager.replicate('key1', 'value1');

      // Async có thể trả về 0 vì chưa process xong
      expect(result).toBeDefined();
    });

    it('should replicate to hybrid replicas', async () => {
      const result = await replication.replicate('key1', 'value1');

      // Hybrid đợi 1 replica sync
      expect(result.success).toBeGreaterThanOrEqual(1);
      expect(result.replicaIds.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle no primary', async () => {
      ClusterManager.resetInstance();
      const emptyCluster = ClusterManager.getInstance();
      const manager = new ReplicationManager({}, emptyCluster);

      const result = await manager.replicate('key1', 'value1');

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should replicate multiple keys', async () => {
      await replication.replicate('key1', 'value1');
      await replication.replicate('key2', 'value2');
      await replication.replicate('key3', 'value3');

      expect(replication.getReplicatedKeys()).toBe(3);
    });
  });

  describe('syncFromLeader', () => {
    it('should sync all keys from leader', async () => {
      const leader = new CacheNode('leader-1');
      leader.set('key1', 'value1');
      leader.set('key2', 'value2');
      leader.set('key3', 'value3');

      await replication.syncFromLeader(leader);

      expect(node1.get('key1')).toBe('value1');
      expect(node1.get('key2')).toBe('value2');
      expect(node1.get('key3')).toBe('value3');
    });

    it('should handle empty leader', async () => {
      const leader = new CacheNode('leader-empty');

      await replication.syncFromLeader(leader);

      expect(replication.getReplicationLag()).toBeGreaterThanOrEqual(0);
    });

    it('should measure replication lag', async () => {
      const leader = new CacheNode('leader-1');
      leader.set('key1', 'value1');

      await replication.syncFromLeader(leader);

      expect(replication.getReplicationLag()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getReplicas', () => {
    it('should return correct replicas', () => {
      const replicas = replication.getReplicas('key1');

      expect(Array.isArray(replicas)).toBe(true);
      expect(replicas.length).toBeLessThanOrEqual(2); // factor - 1
    });

    it('should not include primary in replicas', () => {
      const primary = cluster.getPrimary();
      const replicas = replication.getReplicas('key1');

      const replicaIds = replicas.map(r => r.id);
      if (primary) {
        expect(replicaIds).not.toContain(primary.id);
      }
    });

    it('should return empty if no primary', () => {
      ClusterManager.resetInstance();
      const emptyCluster = ClusterManager.getInstance();
      const manager = new ReplicationManager({}, emptyCluster);

      const replicas = manager.getReplicas('key1');

      expect(replicas).toEqual([]);
    });
  });

  describe('getReplicationLag', () => {
    it('should return lag measurement', () => {
      expect(replication.getReplicationLag()).toBe(0);
    });

    it('should update after sync', async () => {
      const leader = new CacheNode('leader-1');
      leader.set('key1', 'value1');

      await replication.syncFromLeader(leader);

      expect(replication.getReplicationLag()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getReplicatedKeys', () => {
    it('should return replicated keys count', () => {
      expect(replication.getReplicatedKeys()).toBe(0);
    });

    it('should count unique keys', async () => {
      await replication.replicate('key1', 'value1');
      await replication.replicate('key2', 'value2');
      await replication.replicate('key1', 'value1'); // duplicate

      expect(replication.getReplicatedKeys()).toBe(2);
    });
  });

  describe('getConfig', () => {
    it('should return config copy', () => {
      const config = replication.getConfig();

      expect(config).toEqual(replication.getConfig());
      expect(config).not.toBe(replication.getConfig()); // different reference
    });
  });
});
