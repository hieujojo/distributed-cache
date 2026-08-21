# PROGRESS — Quản lý Tasks & Modules

> File này theo dõi progress. Rules xem ở docs/guides/rules.md. Chi tiết tasks xem ở agent/TASKS.md.

---

## Tổng quan

```
Trạng thái:  📝 Documentation phase
Bắt đầu:     2026-08-21
Cập nhật:    2026-08-21
```

---

## Module 1: Core Foundation ⬜ Chưa bắt đầu

```
Mục tiêu: Consistent Hashing + Cache Node

Cần cài: npm install murmurhash3

Files sẽ TẠO:
  ⬜ src/core/types.ts
     ├── Interface: Value, CacheEntry, NodeConfig, HashConfig
     ├── Type: HashFunction
     └── Không có logic, chỉ types

  ⬜ src/core/hash-helpers.ts
     ├── Function: murmurHash(key: string): number
     ├── Function: sortedInsert(positions: number[], pos: number): number
     └── Helper functions, không state

  ⬜ src/core/consistent-hashing.ts
     ├── Class: ConsistentHash
     ├── Constructor(config: HashConfig)
     ├── Method: getNode(key: string): CacheNode | null
     ├── Method: addNode(node: CacheNode): void
     ├── Method: removeNode(nodeId: string): void
     ├── Method: getKeyDistribution(): Map<string, number>
     ├── Method: getRingSize(): number
     ├── Method: hasNode(nodeId: string): boolean
     └── Private: hashKey(), findPosition(), binarySearch()

  ⬜ src/core/node.ts
     ├── Class: CacheNode
     ├── Constructor(id: string, config?: NodeConfig)
     ├── Method: get(key: string): Value | null
     ├── Method: set(key: string, value: Value, ttl?: number): void
     ├── Method: delete(key: string): boolean
     ├── Method: getSize(): number
     ├── Method: getMaxSize(): number
     ├── Method: has(key: string): boolean
     ├── Method: clear(): void
     └── Private: store: Map<string, CacheEntry>

  ⬜ tests/core/consistent-hashing.test.ts
     ├── Test: hash function determinist
     ├── Test: getNode trả về node đúng
     ├── Test: addNode — keys shift < 1/N
     ├── Test: removeNode — keys redistribute
     ├── Test: virtual nodes — distribution đều
     ├── Test: edge case — 0 nodes, 1 node
     └── Test: hasNode, getRingSize

  ⬜ tests/core/node.test.ts
     ├── Test: set/get/delete
     ├── Test: TTL expiration
     ├── Test: cache full behavior
     ├── Test: edge case — null value, empty key, ttl=0
     └── Test: has, getSize, clear

Docs cần update:
  ⬜ README.md (Trạng thái section)
```

---

## Module 2: Eviction Strategies ⬜ Chưa bắt đầu

```
Mục tiêu: LRU, LFU, FIFO eviction policies

Cần cài: Không cần thêm

Files sẽ TẠO:
  ⬜ src/strategies/index.ts
     ├── Interface: EvictionStrategy
     │     ├── onAccess(key: string): void
     │     ├── onInsert(key: string): void
     │     ├── onEvict(): string | null
     │     ├── onRemove(key: string): void
     │     └── getSize(): number
     ├── Type: EvictionPolicy = 'lru' | 'lfu' | 'fifo'
     └── Export tất cả strategies

  ⬜ src/strategies/lru.ts
     ├── Class: LRUStrategy implements EvictionStrategy
     ├── Private: accessOrder: string[]
     ├── onAccess(): move to front
     ├── onInsert(): add to front
     ├── onEvict(): remove last
     ├── onRemove(): remove from list
     └── getSize(): return accessOrder.length

  ⬜ src/strategies/lfu.ts
     ├── Class: LFUStrategy implements EvictionStrategy
     ├── Private: frequencies: Map<string, number>
     ├── onAccess(): increment frequency
     ├── onInsert(): set frequency = 1
     ├── onEvict(): remove lowest frequency
     ├── onRemove(): remove from map
     └── getSize(): return frequencies.size

  ⬜ src/strategies/fifo.ts
     ├── Class: FIFOStrategy implements EvictionStrategy
     ├── Private: queue: string[]
     ├── onAccess(): no-op
     ├── onInsert(): add to end
     ├── onEvict(): remove first
     ├── onRemove(): remove from queue
     └── getSize(): return queue.length

  ⬜ tests/strategies/lru.test.ts
     ├── Test: eviction order
     ├── Test: access moves to front
     ├── Test: empty eviction → null
     └── Test: remove specific key

  ⬜ tests/strategies/lfu.test.ts
     ├── Test: frequency tracking
     ├── Test: lowest frequency evicted
     ├── Test: equal frequency → FIFO
     └── Test: multiple accesses

  ⬜ tests/strategies/fifo.test.ts
     ├── Test: insertion order preserved
     ├── Test: oldest evicted first
     └── Test: access doesn't change order

Conflict với Module 1: KHÔNG (inject qua constructor)
```

---

## Module 3: Network Layer ⬜ Chưa bắt đầu

```
Mục tiêu: TCP server + client library

Cần cài: Không cần thêm (dùng net module built-in)

Files sẽ TẠO:
  ⬜ src/server/protocol.ts
     ├── Type: CommandType = 'SET' | 'GET' | 'DEL' | 'PING' | 'REPLICATE' | 'ELECT'
     ├── Interface: CacheRequest
     ├── Interface: CacheResponse
     ├── Function: parseRequest(buffer: Buffer): CacheRequest
     └── Function: serializeResponse(response: CacheResponse): Buffer

  ⬜ src/server/cache-server.ts
     ├── Interface: ServerConfig
     ├── Class: CacheServer
     ├── Constructor(config: ServerConfig, cluster: ClusterManager)
     ├── Method: start(): Promise<void>
     ├── Method: stop(): Promise<void>
     ├── Method: isRunning(): boolean
     └── Private: server: net.Server, handleConnection()

  ⬜ src/server/client.ts
     ├── Interface: ClientConfig
     ├── Class: CacheClient
     ├── Constructor(config: ClientConfig)
     ├── Method: connect(): Promise<void>
     ├── Method: disconnect(): Promise<void>
     ├── Method: get(key): Promise<Value | null>
     ├── Method: set(key, value, ttl?): Promise<void>
     ├── Method: del(key): Promise<boolean>
     ├── Method: ping(): Promise<boolean>
     └── Private: socket: net.Socket, send()

  ⬜ tests/server/protocol.test.ts
     ├── Test: parseRequest các commands
     ├── Test: serializeResponse
     ├── Test: invalid format → error
     └── Test: partial buffer

  ⬜ tests/server/cache-server.test.ts
     ├── Test: start/stop server
     ├── Test: accept connection
     ├── Test: handle SET/GET/DEL
     └── Test: timeout handling

  ⬜ tests/server/client.test.ts
     ├── Test: connect/disconnect
     ├── Test: send/receive
     ├── Test: retry logic
     └── Test: timeout handling

Conflict với Module 1, 2: KHÔNG (sử dụng interfaces)
```

---

## Module 4: Cluster Management ⬜ Chưa bắt đầu

```
Mục tiêu: Cluster manager + leader election + failover

Cần cài: Không cần thêm

Files sẽ TẠO:
  ⬜ src/core/cluster.ts
     ├── Class: ClusterManager (Singleton)
     ├── Static: getInstance(): ClusterManager
     ├── Static: resetInstance(): void
     ├── Method: addNode(node: CacheNode): void
     ├── Method: removeNode(nodeId: string): void
     ├── Method: getNode(key: string): CacheNode | null
     ├── Method: getHealthyNodes(): CacheNode[]
     ├── Method: getNodeById(nodeId: string): CacheNode | null
     ├── Method: startHeartbeat(): void
     ├── Method: stopHeartbeat(): void
     ├── Method: getStats(): ClusterStats
     └── Private: nodes: Map<string, CacheNode>, primary: CacheNode | null

  ⬜ src/core/election.ts
     ├── Type: NodeState = 'FOLLOWER' | 'CANDIDATE' | 'LEADER'
     ├── Interface: ElectionResult
     ├── Class: ElectionManager
     ├── Method: startElection(): Promise<ElectionResult>
     ├── Method: requestVote(nodeId: string): Promise<boolean>
     ├── Method: becomeLeader(): void
     ├── Method: becomeFollower(): void
     └── Private: state: NodeState, votes: Map<string, string>

  ⬜ src/core/failover.ts
     ├── Class: FailoverManager
     ├── Method: detectFailure(nodeId: string): boolean
     ├── Method: triggerFailover(failedNode: CacheNode): Promise<void>
     ├── Method: promoteReplica(replica: CacheNode): void
     ├── Method: handleRecovery(node: CacheNode): Promise<void>
     └── Private: failureThreshold: number, recoveryTimeout: number

  ⬜ tests/core/cluster.test.ts
     ├── Test: add/remove node
     ├── Test: route key to correct node
     ├── Test: getHealthyNodes
     └── Test: getStats

  ⬜ tests/core/election.test.ts
     ├── Test: startElection
     ├── Test: requestVote
     ├── Test: becomeLeader/becomeFollower
     └── Test: election timeout

  ⬜ tests/core/failover.test.ts
     ├── Test: detectFailure
     ├── Test: triggerFailover
     ├── Test: promoteReplica
     └── Test: handleRecovery

Conflict với Module 1-3: KHÔNG (sử dụng interfaces)
```

---

## Module 5: Replication ⬜ Chưa bắt đầu

```
Mục tiêu: Data replication + sync

Cần cài: Không cần thêm

Files sẽ TẠO:
  ⬜ src/core/replication.ts
     ├── Type: ReplicationMode = 'sync' | 'async' | 'hybrid'
     ├── Interface: ReplicationConfig
     ├── Class: ReplicationManager
     ├── Constructor(config: ReplicationConfig)
     ├── Method: replicate(key: string, value: Value): Promise<void>
     ├── Method: syncFromLeader(leader: CacheNode): Promise<void>
     ├── Method: getReplicas(key: string): CacheNode[]
     ├── Method: getReplicationLag(): number
     ├── Method: getReplicatedKeys(): number
     └── Private: mode, factor, sync data logic

  ⬜ tests/core/replication.test.ts
     ├── Test: replicate to replicas
     ├── Test: sync from leader
     ├── Test: replication factor
     ├── Test: sync lag measurement
     └── Test: mode sync/async/hybrid

Conflict với Module 1-4: KHÔNG (sử dụng interfaces)
```

---

## Module 6: Cache Invalidation ⬜ Chưa bắt đầu

```
Mục tiêu: TTL + event-driven invalidation

Cần cài: Không cần thêm

Files sẽ TẠO:
  ⬜ src/core/invalidation.ts
     ├── Interface: InvalidationEvent
     ├── Class: InvalidationManager
     ├── Method: setTTL(key: string, ttl: number): void
     ├── Method: checkTTL(key: string): boolean
     ├── Method: invalidate(key: string): void
     ├── Method: onDatabaseChange(event: InvalidationEvent): void
     ├── Method: subscribe(callback): void
     ├── Method: unsubscribe(callback): void
     └── Private: events: EventEmitter, ttlMap: Map<string, number>

  ⬜ tests/core/invalidation.test.ts
     ├── Test: TTL expiration
     ├── Test: manual invalidation
     ├── Test: event-driven invalidation
     └── Test: subscribe/unsubscribe

Conflict với Module 1-5: KHÔNG (sử dụng interfaces)
```

---

## Module 7: Benchmark ⬜ Chưa bắt đầu

```
Mục tiêu: Performance testing + comparison

Cần cài: Không cần thêm

Files sẽ TẠO:
  ⬜ src/benchmark/throughput.ts
     ├── Interface: BenchmarkResult
     ├── Function: benchmarkThroughput(cache, operations, keySpace)
     └── Output: opsPerSecond, avgLatency, p99Latency

  ⬜ src/benchmark/data-movement.ts
     ├── Interface: MovementResult
     ├── Function: benchmarkDataMovement(ring, keys, addNode)
     └── Output: keysBefore, keysAfter, keysMoved, percentageMoved

  ⬜ src/benchmark/run.ts
     ├── Function: runAllBenchmarks()
     └── Output: console table

Conflict với Module 1-6: KHÔNG (chỉ đọc, không sửa)
```

---

## Module 8: Visualization ⬜ Chưa bắt đầu

```
Mục tiêu: Hash ring visualization + dashboard

Cần cài: npm install react react-dom @types/react

Files sẽ TẠO:
  ⬜ src/visualization/hash-ring.tsx
     ├── Interface: HashRingProps
     ├── Function: HashRing(props): JSX.Element
     └── Canvas rendering logic

  ⬜ src/visualization/dashboard.tsx
     ├── Interface: DashboardProps
     ├── Function: Dashboard(props): JSX.Element
     └── Stats display logic

  ⬜ src/visualization/server.ts
     ├── Dev server cho visualization
     └── Proxy requests

Conflict với Module 1-7: KHÔNG (chỉ đọc, không sửa)
```

---

## Dependencies Tracking

### Đã cài

```
✅ typescript      ^5.4.0
✅ tsup            ^8.0.0
✅ jest            ^29.7.0
✅ @types/jest     ^29.5.0
✅ ts-jest         ^29.1.0
✅ tsx             ^4.0.0
✅ @types/node     ^20.0.0
```

### Cần cài thêm

```
⬜ murmurhash3     (Module 1)
⬜ react           (Module 8)
⬜ react-dom       (Module 8)
⬜ @types/react    (Module 8)
```

---

## Conflict Tracking

### Hiện tại: Không có conflict

```
✅ Không có conflict
```

### Pending Changes

```
> Chưa có pending changes
```

---

## Changelog

```
> Chưa implement code nào
```
