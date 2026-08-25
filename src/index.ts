/**
 * Distributed Cache System
 *
 * Entry point — export tất cả modules chính
 */

// ─── Core ────────────────────────────────────────────────────────
export { ConsistentHash } from './core/consistent-hashing';
export type { HashNode } from './core/consistent-hashing';
export { CacheNode } from './core/node';
export type { HashFunction, HashConfig, NodeConfig, CacheEntry, Value, EvictionPolicy } from './core/types';
export { murmurHash, sortedInsert, sortedRemove } from './core/hash-helpers';

// ─── Cluster ─────────────────────────────────────────────────────
export { ClusterManager } from './core/cluster';
export type { ClusterStats } from './core/cluster';
export { ElectionManager } from './core/election';
export type { NodeState, ElectionResult } from './core/election';
export { FailoverManager } from './core/failover';
export type { FailoverConfig } from './core/failover';

// ─── Replication ─────────────────────────────────────────────────
export { ReplicationManager } from './core/replication';
export type { ReplicationMode, ReplicationConfig, ReplicateResult } from './core/replication';

// ─── Invalidation ────────────────────────────────────────────────
export { InvalidationManager } from './core/invalidation';
export type { InvalidationEventType, InvalidationEvent, InvalidationCallback } from './core/invalidation';

// ─── Strategies ──────────────────────────────────────────────────
export { createEvictionStrategy } from './strategies/index';
export type { EvictionStrategy } from './strategies/index';

// ─── Server ──────────────────────────────────────────────────────
export { CacheServer } from './server/cache-server';
export type { ServerConfig } from './server/cache-server';
export { CacheClient } from './server/client';
export type { ClientConfig } from './server/client';
export {
  parseRequest,
  parseResponse,
  serializeRequest,
  serializeResponse,
} from './server/protocol';
export type { CommandType, CacheRequest, CacheResponse } from './server/protocol';
