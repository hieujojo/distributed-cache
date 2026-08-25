/**
 * Replication Manager - Quản lý replication data giữa primary và replicas
 *
 * Responsibilities:
 *   - Replicate key-value data từ primary đến replicas
 *   - Hỗ trợ 3 chế độ: sync, async, hybrid
 *   - Sync data từ leader sau khi recover
 *   - Track replication lag và replicated keys
 */

import { CacheNode } from './node';
import { Value } from './types';
import { ClusterManager } from './cluster';

/** Chế độ replication */
export type ReplicationMode = 'sync' | 'async' | 'hybrid';

/** Config cho ReplicationManager */
export interface ReplicationConfig {
  /** Số replicas mặc định (default: 3) */
  factor: number;
  /** Chế độ replication (default: 'hybrid') */
  mode: ReplicationMode;
  /** Timeout cho sync replication (ms, default: 5000) */
  syncTimeout: number;
}

/** Kết quả replicate 1 key */
export interface ReplicateResult {
  /** Số replicas thành công */
  success: number;
  /** Số replicas thất bại */
  failed: number;    /** Danh sách replica IDs thành công */
  replicaIds: string[];
}

/**
 * ReplicationManager - Quản lý data replication
 */
export class ReplicationManager {
  private config: ReplicationConfig;
  private cluster: ClusterManager;
  private replicationLag: number;
  private replicatedKeys: Set<string>;

  constructor(config: Partial<ReplicationConfig>, cluster: ClusterManager) {
    this.config = {
      factor: config.factor ?? 3,
      mode: config.mode ?? 'hybrid',
      syncTimeout: config.syncTimeout ?? 5000,
    };
    this.cluster = cluster;
    this.replicationLag = 0;
    this.replicatedKeys = new Set();
  }

  /**
   * Replicate key-value đến replicas
   * @param key - Key cần replicate
   * @param value - Giá trị cần replicate
   * @returns Kết quả replicate
   */
  async replicate(key: string, value: Value): Promise<ReplicateResult> {
    const primary = this.cluster.getPrimary();
    if (!primary) {
      return { success: 0, failed: 0, replicaIds: [] };
    }

    const replicas = this.getReplicas(key);
    const result: ReplicateResult = {
      success: 0,
      failed: 0,
      replicaIds: [],
    };

    switch (this.config.mode) {
      case 'sync':
        await this.replicateSync(replicas, key, value, result);
        break;
      case 'async':
        this.replicateAsync(replicas, key, value, result);
        break;
      case 'hybrid':
        await this.replicateHybrid(replicas, key, value, result);
        break;
    }

    // Đánh dấu key đã replicate
    this.replicatedKeys.add(key);

    return result;
  }

  /**
   * Sync data từ leader (sau khi recover)
   * @param leader - Leader node cần sync từ
   */
  async syncFromLeader(leader: CacheNode): Promise<void> {
    const startTime = Date.now();
    const keys = leader.getKeys();

    for (const key of keys) {
      const value = leader.get(key);
      if (value !== null) {
        const primary = this.cluster.getPrimary();
        if (primary) {
          primary.set(key, value);
        }
      }
    }

    this.replicationLag = Date.now() - startTime;
  }

  /**
   * Lấy replicas cho 1 key
   * @param key - Key cần tìm replicas
   * @returns Mảng CacheNode replicas
   */
  getReplicas(key: string): CacheNode[] {
    const primary = this.cluster.getNode(key);
    if (!primary) return [];

    const healthyNodes = this.cluster.getHealthyNodes();
    const replicas: CacheNode[] = [];

    // Lấy N nodes tiếp theo sau primary
    let foundPrimary = false;
    for (const node of healthyNodes) {
      if (node.id === primary.id) {
        foundPrimary = true;
        continue;
      }
      if (foundPrimary && replicas.length < this.config.factor - 1) {
        replicas.push(node);
      }
    }

    // Nếu chưa đủ, wrap around từ đầu
    if (replicas.length < this.config.factor - 1) {
      for (const node of healthyNodes) {
        if (node.id === primary.id) continue;
        if (replicas.length >= this.config.factor - 1) break;
        if (!replicas.some(r => r.id === node.id)) {
          replicas.push(node);
        }
      }
    }

    return replicas;
  }

  /**
   * Lấy replication lag (ms)
   */
  getReplicationLag(): number {
    return this.replicationLag;
  }

  /**
   * Lấy số lượng replicated keys
   */
  getReplicatedKeys(): number {
    return this.replicatedKeys.size;
  }

  /**
   * Bỏ theo dõi key đã bị eviction hoặc xóa khỏi cache.
   * Gọi từ CacheNode.onEvicted callback để tránh
   * replicatedKeys grow vô hạn.
   */
  untrackKey(key: string): void {
    this.replicatedKeys.delete(key);
  }

  /**
   * Lấy config hiện tại
   */
  getConfig(): ReplicationConfig {
    return { ...this.config };
  }

  /**
   * Sync replication - đợi TẤT CẢ replicas ack
   */
  private async replicateSync(
    replicas: CacheNode[],
    key: string,
    value: Value,
    result: ReplicateResult
  ): Promise<void> {
    const promises = replicas.map(async (replica) => {
      try {
        await this.syncToReplica(replica, key, value);
        result.success++;
        result.replicaIds.push(replica.id);
      } catch {
        result.failed++;
      }
    });

    await Promise.all(promises);
  }

  /**
   * Async replication - fire and forget
   */
  private replicateAsync(
    replicas: CacheNode[],
    key: string,
    value: Value,
    result: ReplicateResult
  ): void {
    // Gửi không đợi response
    for (const replica of replicas) {
      this.syncToReplica(replica, key, value)
        .then(() => {
          result.success++;
          result.replicaIds.push(replica.id);
        })
        .catch(() => {
          result.failed++;
        });
    }
  }

  /**
   * Hybrid replication - đợi 1 replica, async với còn lại
   */
  private async replicateHybrid(
    replicas: CacheNode[],
    key: string,
    value: Value,
    result: ReplicateResult
  ): Promise<void> {
    if (replicas.length === 0) return;

    // Sync với replica đầu tiên
    try {
      await this.syncToReplica(replicas[0], key, value);
      result.success++;
      result.replicaIds.push(replicas[0].id);
    } catch {
      result.failed++;
    }

    // Async với các replicas còn lại
    if (replicas.length > 1) {
      const remaining = replicas.slice(1);
      for (const replica of remaining) {
        this.syncToReplica(replica, key, value)
          .then(() => {
            result.success++;
            result.replicaIds.push(replica.id);
          })
          .catch(() => {
            result.failed++;
          });
      }
    }
  }

  /**
   * Gửi REPLICATE command đến replica
   * @param replica - Replica node
   * @param key - Key cần replicate
   * @param value - Giá trị cần replicate
   * @returns true nếu thành công
   */
  private async syncToReplica(
    replica: CacheNode,
    key: string,
    value: Value
  ): Promise<boolean> {
    // Giả lập network call với timeout
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Replica ${replica.id} timeout`));
      }, this.config.syncTimeout);

      try {
        // Trong thực tế sẽ gửi TCP request
        // Ở đây simulate bằng cách set trực tiếp
        replica.set(key, value);
        clearTimeout(timeout);
        resolve(true);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }
}
