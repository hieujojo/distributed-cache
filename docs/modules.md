# Modules — Chi tiết từng Module

> File này mô tả chi tiết từng module: interfaces, methods, test cases.

---

## Module 1: Core Foundation

### File: src/core/consistent-hashing.ts

```typescript
export interface HashConfig {
  virtualNodes: number;    // Default: 150
  hashFunction?: HashFunction;
}

export type HashFunction = (key: string) => number;

export class ConsistentHash {
  constructor(config?: HashConfig);

  // Core methods
  getNode(key: string): CacheNode | null;
  addNode(node: CacheNode): void;
  removeNode(nodeId: string): void;

  // Utility
  getKeyDistribution(): Map<string, number>;
  getRingSize(): number;
  hasNode(nodeId: string): boolean;
}
```

**Test cases:**
```
□ getNode() trả về node đúng cho key
□ addNode() — keys shift < 1/N
□ removeNode() — keys redistribute correctly
□ Virtual nodes — distribution đều
□ Edge case: 0 nodes → null
□ Edge case: 1 node → all keys về node đó
```

### File: src/core/node.ts

```typescript
export interface CacheEntry {
  key: string;
  value: Value;
  createdAt: number;
  expiresAt: number | null;
  accessCount: number;
  lastAccessedAt: number;
}

export type Value = string | number | boolean | object | null;

export class CacheNode {
  constructor(id: string, config?: NodeConfig);

  // Core methods
  get(key: string): Value | null;
  set(key: string, value: Value, ttl?: number): void;
  delete(key: string): boolean;

  // Utility
  getSize(): number;
  getMaxSize(): number;
  has(key: string): boolean;
  clear(): void;
}
```

**Test cases:**
```
□ set() rồi get() trả về value đúng
□ get() key không tồn tại → null
□ set() với TTL → auto expire
□ delete() key tồn tại → true
□ delete() key không tồn tại → false
□ Cache full → eviction hoạt động
□ Edge case: value = null
□ Edge case: key = ""
□ Edge case: ttl = 0
```

---

## Module 2: Eviction Strategies

### File: src/strategies/index.ts

```typescript
export interface EvictionStrategy {
  onAccess(key: string): void;
  onInsert(key: string): void;
  onEvict(): string | null;
  onRemove(key: string): void;
  getSize(): number;
}

export type EvictionPolicy = 'lru' | 'lfu' | 'fifo';
```

### File: src/strategies/lru.ts

```typescript
export class LRUStrategy implements EvictionStrategy {
  onAccess(key: string): void;    // Move to front
  onInsert(key: string): void;    // Add to front
  onEvict(): string | null;       // Remove last
  onRemove(key: string): void;    // Remove from list
  getSize(): number;
}
```

**Test cases:**
```
□ onAccess() — move to front
□ onInsert() — add to front
□ onEvict() — return least recently used
□ onEvict() — empty list → null
□ onRemove() — remove specific key
□ Order: A, B, C → access A → evict C
```

### File: src/strategies/lfu.ts

```typescript
export class LFUStrategy implements EvictionStrategy {
  onAccess(key: string): void;    // Increment frequency
  onInsert(key: string): void;    // Set frequency = 1
  onEvict(): string | null;       // Remove lowest frequency
  onRemove(key: string): void;    // Remove from tracking
  getSize(): number;
}
```

**Test cases:**
```
□ onAccess() — increment frequency
□ onInsert() — frequency starts at 1
□ onEvict() — return lowest frequency
□ onEvict() — equal frequency → FIFO
□ Multiple accesses — correct frequency
```

### File: src/strategies/fifo.ts

```typescript
export class FIFOStrategy implements EvictionStrategy {
  onAccess(key: string): void;    // No-op
  onInsert(key: string): void;    // Add to queue
  onEvict(): string | null;       // Remove oldest
  onRemove(key: string): void;    // Remove from queue
  getSize(): number;
}
```

**Test cases:**
```
□ onInsert() — add to end
□ onEvict() — return oldest
□ onAccess() — no change to order
□ Insertion order preserved
```

---

## Module 3: Network Layer

### File: src/server/protocol.ts

```typescript
export type CommandType = 'SET' | 'GET' | 'DEL' | 'PING' | 'REPLICATE' | 'ELECT';

export interface CacheRequest {
  type: CommandType;
  key?: string;
  value?: Value;
  ttl?: number;
  nodeId?: string;
}

export interface CacheResponse {
  type: 'VALUE' | 'OK' | 'NULL' | 'ERROR' | 'PONG';
  value?: Value;
  message?: string;
}

export function parseRequest(buffer: Buffer): CacheRequest;
export function serializeResponse(response: CacheResponse): Buffer;
```

### File: src/server/cache-server.ts

```typescript
export interface ServerConfig {
  host: string;
  port: number;
  heartbeatInterval: number;  // Default: 5000ms
  heartbeatTimeout: number;   // Default: 15000ms
}

export class CacheServer {
  constructor(config: ServerConfig, cluster: ClusterManager);

  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}
```

### File: src/server/client.ts

```typescript
export interface ClientConfig {
  host: string;
  port: number;
  timeout: number;           // Default: 5000ms
  retries: number;           // Default: 3
}

export class CacheClient {
  constructor(config: ClientConfig);

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  get(key: string): Promise<Value | null>;
  set(key: string, value: Value, ttl?: number): Promise<void>;
  del(key: string): Promise<boolean>;

  ping(): Promise<boolean>;
}
```

---

## Module 4: Cluster Management

### File: src/core/cluster.ts

```typescript
export class ClusterManager {
  private static instance: ClusterManager;

  static getInstance(): ClusterManager;
  static resetInstance(): void;

  addNode(node: CacheNode): void;
  removeNode(nodeId: string): void;

  getNode(key: string): CacheNode | null;
  getHealthyNodes(): CacheNode[];
  getNodeById(nodeId: string): CacheNode | null;

  // Heartbeat
  startHeartbeat(): void;
  stopHeartbeat(): void;

  // Stats
  getStats(): ClusterStats;
}
```

### File: src/core/election.ts

```typescript
export type NodeState = 'FOLLOWER' | 'CANDIDATE' | 'LEADER';

export interface ElectionResult {
  winnerId: string;
  votes: Map<string, string>;
  duration: number;
}

export class ElectionManager {
  startElection(): Promise<ElectionResult>;
  requestVote(nodeId: string): Promise<boolean>;
  becomeLeader(): void;
  becomeFollower(): void;
}
```

---

## Module 5: Replication

### File: src/core/replication.ts

```typescript
export type ReplicationMode = 'sync' | 'async' | 'hybrid';

export interface ReplicationConfig {
  factor: number;            // Default: 3
  mode: ReplicationMode;     // Default: 'hybrid'
  syncTimeout: number;       // Default: 5000ms
}

export class ReplicationManager {
  replicate(key: string, value: Value): Promise<void>;
  syncFromLeader(leader: CacheNode): Promise<void>;
  getReplicas(key: string): CacheNode[];

  // Metrics
  getReplicationLag(): number;
  getReplicatedKeys(): number;
}
```

---

## Module 6: Cache Invalidation

### File: src/core/invalidation.ts

```typescript
export interface InvalidationEvent {
  type: 'KEY_UPDATED' | 'KEY_DELETED' | 'KEY_EXPIRED';
  key: string;
  timestamp: number;
}

export class InvalidationManager {
  setTTL(key: string, ttl: number): void;
  checkTTL(key: string): boolean;
  invalidate(key: string): void;

  // Event-driven
  onDatabaseChange(event: InvalidationEvent): void;
  subscribe(callback: (event: InvalidationEvent) => void): void;
  unsubscribe(callback: (event: InvalidationEvent) => void): void;
}
```

---

## Module 7: Benchmark

### File: src/benchmark/throughput.ts

```typescript
export interface BenchmarkResult {
  name: string;
  opsPerSecond: number;
  avgLatency: number;
  p99Latency: number;
  duration: number;
}

export function benchmarkThroughput(
  cache: CacheNode,
  operations: number,
  keySpace: number
): Promise<BenchmarkResult>;
```

### File: src/benchmark/data-movement.ts

```typescript
export interface MovementResult {
  keysBefore: number;
  keysAfter: number;
  keysMoved: number;
  percentageMoved: number;
}

export function benchmarkDataMovement(
  ring: ConsistentHash,
  keys: string[],
  addNode: CacheNode
): MovementResult;
```

---

## Module 8: Visualization

### File: src/visualization/hash-ring.tsx

```typescript
export interface HashRingProps {
  nodes: CacheNode[];
  selectedNode?: string;
  onNodeClick?: (nodeId: string) => void;
}

export function HashRing(props: HashRingProps): JSX.Element;
```

### File: src/visualization/dashboard.tsx

```typescript
export interface DashboardProps {
  cluster: ClusterManager;
  refreshInterval?: number;
}

export function Dashboard(props: DashboardProps): JSX.Element;
```
