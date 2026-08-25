/**
 * Cluster Manager - Quản lý danh sách nodes trong cluster
 *
 * Singleton pattern: chỉ có 1 instance duy nhất
 * Responsibilities:
 *   - Quản lý danh sách CacheNodes
 *   - Route requests đến đúng node qua ConsistentHash
 *   - Heartbeat: phát hiện node failure
 *   - Quản lý primary node
 */

import { CacheNode } from './node';
import { ConsistentHash } from './consistent-hashing';
import { HashNode } from './consistent-hashing';

/** Thống kê cluster */
export interface ClusterStats {
  totalNodes: number;
  healthyNodes: number;
  primaryId: string | null;
  ringSize: number;
}

/**
 * ClusterManager - Singleton
 */
export class ClusterManager {
  private static instance: ClusterManager | null = null;

  private nodes: Map<string, CacheNode>;
  private healthyNodes: Map<string, boolean>;
  private consistentHash: ConsistentHash;
  private primary: CacheNode | null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null;
  private heartbeatInterval: number;
  private heartbeatTimeout: number;
  private missedHeartbeats: Map<string, number>;
  private onNodeFailed: ((nodeId: string) => void) | null;

  private constructor() {
    this.nodes = new Map();
    this.healthyNodes = new Map();
    this.consistentHash = new ConsistentHash();
    this.primary = null;
    this.heartbeatTimer = null;
    this.heartbeatInterval = 5000;
    this.heartbeatTimeout = 15000;
    this.missedHeartbeats = new Map();
    this.onNodeFailed = null;
  }

  /**
   * Lấy instance duy nhất
   */
  static getInstance(): ClusterManager {
    if (!ClusterManager.instance) {
      ClusterManager.instance = new ClusterManager();
    }
    return ClusterManager.instance;
  }

  /**
   * Reset instance (dùng cho testing)
   */
  static resetInstance(): void {
    if (ClusterManager.instance) {
      ClusterManager.instance.stopHeartbeat();
    }
    ClusterManager.instance = null;
  }

  /**
   * Đăng ký callback khi node fail
   */
  setOnNodeFailed(callback: (nodeId: string) => void): void {
    this.onNodeFailed = callback;
  }

  /**
   * Thêm node vào cluster
   */
  addNode(node: CacheNode): void {
    this.nodes.set(node.id, node);
    this.healthyNodes.set(node.id, true);
    this.missedHeartbeats.set(node.id, 0);
    this.consistentHash.addNode({ id: node.id } as HashNode);

    // Node đầu tiên trở thành primary
    if (!this.primary) {
      this.primary = node;
    }
  }

  /**
   * Xóa node khỏi cluster
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.healthyNodes.delete(nodeId);
    this.missedHeartbeats.delete(nodeId);
    this.consistentHash.removeNode(nodeId);

    // Nếu xóa primary → cần election (xử lý bởi FailoverManager)
    if (this.primary?.id === nodeId) {
      this.primary = null;
    }
  }

  /**
   * Lấy node chịu trách nhiệm cho key
   */
  getNode(key: string): CacheNode | null {
    const hashNode = this.consistentHash.getNode(key);
    if (!hashNode) return null;
    return this.nodes.get(hashNode.id) ?? null;
  }

  /**
   * Lấy node theo ID
   */
  getNodeById(nodeId: string): CacheNode | null {
    return this.nodes.get(nodeId) ?? null;
  }

  /**
   * Lấy tất cả nodes đang healthy
   */
  getHealthyNodes(): CacheNode[] {
    const result: CacheNode[] = [];
    for (const [nodeId, isHealthy] of this.healthyNodes) {
      if (isHealthy) {
        const node = this.nodes.get(nodeId);
        if (node) result.push(node);
      }
    }
    return result;
  }

  /**
   * Lấy tất cả nodes
   */
  getAllNodes(): CacheNode[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Lấy primary node
   */
  getPrimary(): CacheNode | null {
    return this.primary;
  }

  /**
   * Đặt primary node
   */
  setPrimary(node: CacheNode): void {
    this.primary = node;
  }

  /**
   * Kiểm tra node có healthy không
   */
  isHealthy(nodeId: string): boolean {
    return this.healthyNodes.get(nodeId) ?? false;
  }

  /**
   * Đánh dấu node unhealthy
   */
  markUnhealthy(nodeId: string): void {
    this.healthyNodes.set(nodeId, false);
  }

  /**
   * Đánh dấu node healthy
   */
  markHealthy(nodeId: string): void {
    this.healthyNodes.set(nodeId, true);
    this.missedHeartbeats.set(nodeId, 0);
  }

  /**
   * Bắt đầu heartbeat checking
   */
  startHeartbeat(interval?: number, timeout?: number): void {
    this.stopHeartbeat();

    if (interval) this.heartbeatInterval = interval;
    if (timeout) this.heartbeatTimeout = timeout;

    this.heartbeatTimer = setInterval(() => {
      this.checkHeartbeats();
    }, this.heartbeatInterval);
    // Không giữ process Node.js alive chỉ vì heartbeat timer
    if (typeof this.heartbeatTimer === 'object' && 'unref' in this.heartbeatTimer) {
      this.heartbeatTimer.unref();
    }
  }

  /**
   * Dừng heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Nhận heartbeat từ node
   */
  receiveHeartbeat(nodeId: string): void {
    this.missedHeartbeats.set(nodeId, 0);
    this.healthyNodes.set(nodeId, true);
  }

  /**
   * Lấy thống kê cluster
   */
  getStats(): ClusterStats {
    let healthyCount = 0;
    for (const isHealthy of this.healthyNodes.values()) {
      if (isHealthy) healthyCount++;
    }

    return {
      totalNodes: this.nodes.size,
      healthyNodes: healthyCount,
      primaryId: this.primary?.id ?? null,
      ringSize: this.consistentHash.getRingSize(),
    };
  }

  /**
   * Số lượng nodes
   */
  getSize(): number {
    return this.nodes.size;
  }

  /**
   * Kiểm tra có node nào không
   */
  isEmpty(): boolean {
    return this.nodes.size === 0;
  }

  /**
   * Kiểm tra heartbeat — nếu node miss quá nhiều → đánh dấu unhealthy
   */
  private checkHeartbeats(): void {
    const maxMissed = Math.ceil(this.heartbeatTimeout / this.heartbeatInterval);

    for (const [nodeId, missed] of this.missedHeartbeats) {
      const newMissed = missed + 1;
      this.missedHeartbeats.set(nodeId, newMissed);

      if (newMissed > maxMissed) {
        this.healthyNodes.set(nodeId, false);

        // Trigger callback
        if (this.onNodeFailed) {
          this.onNodeFailed(nodeId);
        }
      }
    }
  }
}
