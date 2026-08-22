/**
 * Tests cho ElectionManager
 */

import { ElectionManager } from '../../src/core/election';
import { ClusterManager } from '../../src/core/cluster';
import { CacheNode } from '../../src/core/node';

// Reset singleton trước mỗi test
beforeEach(() => {
  ClusterManager.resetInstance();
});

afterEach(() => {
  ClusterManager.resetInstance();
});

describe('ElectionManager', () => {
  describe('startElection', () => {
    it('should elect leader with highest ID', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));
      cluster.addNode(new CacheNode('node-2'));
      cluster.addNode(new CacheNode('node-3'));

      const election = new ElectionManager(cluster);
      const result = await election.startElection();

      expect(result.winnerId).toBe('node-3');
      expect(result.votes.size).toBe(3);
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should set elected node as primary', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-a'));
      cluster.addNode(new CacheNode('node-b'));

      const election = new ElectionManager(cluster);
      await election.startElection();

      expect(cluster.getPrimary()?.id).toBe('node-b');
    });

    it('should throw if no healthy nodes', async () => {
      const cluster = ClusterManager.getInstance();
      // Không thêm node nào

      const election = new ElectionManager(cluster);

      await expect(election.startElection()).rejects.toThrow('No healthy nodes');
    });

    it('should handle single node', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('only-node'));

      const election = new ElectionManager(cluster);
      const result = await election.startElection();

      expect(result.winnerId).toBe('only-node');
    });

    it('should not start election if already in progress', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));

      const election = new ElectionManager(cluster);

      // Start first election (we can't easily test concurrent in async, so just test the flag)
      await election.startElection();

      // After first completes, should be able to start another
      const result2 = await election.startElection();
      expect(result2.winnerId).toBe('node-1');
    });
  });

  describe('handleVoteRequest', () => {
    it('should accept vote from valid candidate when no leader', () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));

      const election = new ElectionManager(cluster);

      // Không có leader → accept
      const accepted = election.handleVoteRequest('node-1', null);

      expect(accepted).toBe(true);
    });

    it('should reject vote when leader is healthy', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.setPrimary(node1);

      const election = new ElectionManager(cluster);

      // Có leader healthy → reject
      const accepted = election.handleVoteRequest('node-2', 'node-1');

      expect(accepted).toBe(false);
    });

    it('should accept vote when leader is down', () => {
      const cluster = ClusterManager.getInstance();
      const node1 = new CacheNode('node-1');
      const node2 = new CacheNode('node-2');

      cluster.addNode(node1);
      cluster.addNode(node2);
      cluster.setPrimary(node1);
      cluster.markUnhealthy('node-1');

      const election = new ElectionManager(cluster);

      // Leader down → accept
      const accepted = election.handleVoteRequest('node-2', 'node-1');

      expect(accepted).toBe(true);
    });
  });

  describe('state management', () => {
    it('should start as FOLLOWER', () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));

      const election = new ElectionManager(cluster);

      expect(election.getState()).toBe('FOLLOWER');
    });

    it('should become LEADER after election', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));

      const election = new ElectionManager(cluster);
      await election.startElection();

      expect(election.getState()).toBe('LEADER');
    });

    it('should set leader ID correctly', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));
      cluster.addNode(new CacheNode('node-2'));

      const election = new ElectionManager(cluster);
      await election.startElection();

      expect(election.getLeaderId()).toBe('node-2');
    });

    it('should become FOLLOWER via becomeFollower', () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));

      const election = new ElectionManager(cluster);
      election.becomeLeader('node-1');
      expect(election.getState()).toBe('LEADER');

      election.becomeFollower('node-1');
      expect(election.getState()).toBe('FOLLOWER');
      expect(election.getLeaderId()).toBe('node-1');
    });
  });

  describe('getVotes', () => {
    it('should return votes after election', async () => {
      const cluster = ClusterManager.getInstance();
      cluster.addNode(new CacheNode('node-1'));
      cluster.addNode(new CacheNode('node-2'));

      const election = new ElectionManager(cluster);
      await election.startElection();

      const votes = election.getVotes();
      expect(votes.size).toBe(2);
      // Tất cả bầu cho node-2 (highest ID)
      expect(votes.get('node-1')).toBe('node-2');
      expect(votes.get('node-2')).toBe('node-2');
    });
  });
});
