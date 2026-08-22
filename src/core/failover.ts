/**
 * Failover Manager - Xử lý failover khi node dies
 *
 * Responsibilities:
 *   - Phát hiện node failure (qua heartbeat)
 *   - Trigger leader election khi primary die
 *   - Promote replica lên primary
 *   - Xử lý recovery khi node quay lại
 */

import { CacheNode } from './node';
import { ClusterManager } from './cluster';
import { ElectionManager } from './election';

/** Config cho FailoverManager */
export interface FailoverConfig {
  /** Số lần miss heartbeat trước khi đánh dấu failed */
  failureThreshold: number;
  /** Thời gian đợi recovery (ms) */
  recoveryTimeout: number;
}

/**
 * FailoverManager - Xử lý automatic failover
 */
export class FailoverManager {
  private cluster: ClusterManager;
  private election: ElectionManager;
  private failureThreshold: number;
  private recoveryTimeout: number;
  private failedNodes: Set<string>;

  constructor(cluster: ClusterManager, config?: Partial<FailoverConfig>) {
    this.cluster = cluster;
    this.election = new ElectionManager(cluster);
    this.failureThreshold = config?.failureThreshold ?? 3;
    this.recoveryTimeout = config?.recoveryTimeout ?? 30000;
    this.failedNodes = new Set();
  }

  /**
   * Phát hiện node failure dựa trên heartbeat misses
   *
   * @param nodeId - ID của node cần kiểm tra
   * @param missedHeartbeats - Số lần miss heartbeat
   * @returns true nếu node được coi là failed
   */
  detectFailure(_nodeId: string, missedHeartbeats: number): boolean {
    return missedHeartbeats > this.failureThreshold;
  }

  /**
   * Trigger failover khi node dies
   *
   * @param failedNode - Node bị fail
   */
  async triggerFailover(failedNode: CacheNode): Promise<void> {
    this.failedNodes.add(failedNode.id);

    // Check primary TRƯỚC khi remove
    const wasPrimary = failedNode.id === this.cluster.getPrimary()?.id;

    // Xóa node khỏi cluster
    this.cluster.removeNode(failedNode.id);
    this.cluster.markUnhealthy(failedNode.id);

    if (wasPrimary) {
      await this.election.startElection();
      // Election đã tự động set primary mới qua cluster.setPrimary()
      return;
    }

    // Nếu là replica → không cần election
    // (Trong distributed system, primary sẽ tạo replica mới)
  }

  /**
   * Promote replica lên primary
   *
   * @param replica - Replica cần promote
   */
  promoteReplica(replica: CacheNode): void {
    this.cluster.setPrimary(replica);
    this.cluster.markHealthy(replica.id);
  }

  /**
   * Xử lý khi node recover
   *
   * @param node - Node recovered
   */
  async handleRecovery(node: CacheNode): Promise<void> {
    // Xóa khỏi danh sách failed
    this.failedNodes.delete(node.id);

    // Đánh dấu healthy
    this.cluster.markHealthy(node.id);

    // Re-add vào cluster (nếu chưa có)
    if (!this.cluster.getNodeById(node.id)) {
      this.cluster.addNode(node);
    }
  }

  /**
   * Lấy danh sách failed nodes
   */
  getFailedNodes(): string[] {
    return Array.from(this.failedNodes);
  }

  /**
   * Kiểm tra node có đang failed không
   */
  isNodeFailed(nodeId: string): boolean {
    return this.failedNodes.has(nodeId);
  }

  /**
   * Lấy election manager
   */
  getElectionManager(): ElectionManager {
    return this.election;
  }

  /**
   * Lấy failure threshold
   */
  getFailureThreshold(): number {
    return this.failureThreshold;
  }

  /**
   * Lấy recovery timeout
   */
  getRecoveryTimeout(): number {
    return this.recoveryTimeout;
  }
}
