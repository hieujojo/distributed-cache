# Kiến trúc Tổng quan

## Tổng quan Hệ thống

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ Cache Client │  │ Visualization│  │  Benchmark  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
└─────────┼────────────────┼────────────────┼─────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────┐
│                   Network Layer                       │
│  ┌─────────────────────────────────────────────────┐│
│  │              TCP Server (per node)               ││
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     ││
│  │  │ Protocol │  │  Parser  │  │ Serializer│     ││
│  │  └──────────┘  └──────────┘  └──────────┘     ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                   Core Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │   Cluster    │  │ Consistent   │  │ Replication││
│  │  Manager     │  │  Hashing     │  │   Manager  ││
│  └──────────────┘  └──────────────┘  └────────────┘│
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │  Cache Node  │  │   Eviction   │  │    TTL     ││
│  │   (storage)  │  │   Policy     │  │  Manager   ││
│  └──────────────┘  └──────────────┘  └────────────┘│
└─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────┐
│                  Storage Layer                        │
│  ┌─────────────────────────────────────────────────┐│
│  │              In-Memory Hash Map                  ││
│  │         (key → value + metadata)                 ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

## Component Diagram

### 1. Cluster Manager

```
Responsibility:
  → Quản lý danh sách nodes trong cluster
  → Phát hiện node failure (heartbeat)
  → Trigger leader election khi primary die
  → Routing requests đến đúng node

Interface:
  class ClusterManager {
    addNode(node: CacheNode): void
    removeNode(nodeId: string): void
    getNode(key: string): CacheNode
    getHealthyNodes(): CacheNode[]
  }
```

### 2. Consistent Hashing

```
Responsibility:
  → Map keys và nodes lên hash ring
  → Tìm node chịu trách nhiệm cho 1 key
  → Xử lý thêm/xóa node minimal data movement

Interface:
  class ConsistentHash {
    addNode(node: CacheNode, virtualNodes?: number): void
    removeNode(nodeId: string): void
    getNode(key: string): CacheNode
    getKeyDistribution(): Map<CacheNode, number>
  }
```

### 3. Cache Node

```
Responsibility:
  → Lưu trữ key-value pairs trong RAM (Map<string, CacheEntry>)
  → Xử lý get/set/delete operations
  → enforced eviction: set() gọi eviction strategy khi store > maxSize
  → Background TTL sweep: interval xoá expired entries định kỳ
  → Persistent options: file-based save/load

Interface:
  class CacheNode {
    get(key: string): Value | null
    set(key: string, value: Value, ttl?: number): void   // triggers eviction if full
    delete(key: string): boolean
    has(key: string): boolean
    clear(): void
    getSize(): number
    getMaxSize(): number
    stopSweep(): void          // stop background TTL cleanup
    loadEntries(entries: Map): void  // bulk load + rebuild eviction index
    // config.onEvicted callback — called on eviction, delete, sweep
    // → use to sync external trackers (e.g. ReplicationManager)
  }
```

### 4. Replication Manager

```
Responsibility:
  → Replicate data từ primary sang replicas
  → Phát hiện primary failure
  → Trigger leader election
  → Sync data khi node recover

Interface:
  class ReplicationManager {
    replicate(key: string, value: Value): void
    syncFromLeader(leader: CacheNode): void
    getReplicas(key: string): CacheNode[]
  }
```

### 5. Cache Invalidation

```
Responsibility:
  → Quản lý TTL cho mỗi key
  → Xử lý event-driven invalidation
  → Notify replicas khi key thay đổi

Interface:
  class InvalidationManager {
    setTTL(key: string, ttl: number): void
    invalidate(key: string): void
    onDatabaseChange(event: ChangeEvent): void
  }
```

## Data Flow

### Read Flow

```
Client                    Cluster                Hash Ring            Cache Node
  │                          │                      │                    │
  │── GET user:123 ─────────→│                      │                    │
  │                          │── hash("user:123") ──→│                    │
  │                          │                      │── find node ──────→│
  │                          │                      │                    │
  │                          │←─────────────────────│                    │
  │                          │── route to node ─────────────────────────→│
  │                          │                      │                    │
  │                          │                      │    check memory     │
  │                          │                      │    check TTL        │
  │                          │                      │                    │
  │                          │←── return value ──────────────────────────│
  │←── return value ─────────│                      │                    │
```

### Write Flow

```
Client                    Cluster                Hash Ring            Cache Node
  │                          │                      │                    │
  │── SET user:123 "John" ──→│                      │                    │
  │                          │── hash("user:123") ──→│                    │
  │                          │                      │── find node ──────→│
  │                          │                      │                    │
  │                          │←─────────────────────│                    │
  │                          │── route to node ─────────────────────────→│
  │                          │                      │                    │
  │                          │                      │    store in memory  │
  │                          │                      │    apply TTL       │
  │                          │                      │    enforceMaxSize() │ ← evict if over capacity
  │                          │                      │                    │
  │                          │                      │    replicate ──────→│ (replica)
  │                          │                      │                    │
  │                          │←── ack ───────────────────────────────────│
  │←── ack ──────────────────│                      │                    │
```

### Failover Flow

```
Primary                 Replica                 Cluster Manager
  │                        │                        │
  │──── heartbeat ────────→│                        │
  │                        │──── heartbeat ────────→│
  │                        │                        │
  │    PRIMARY DIES!       │                        │
  │                        │                        │
  │                        │←── no heartbeat ───────│
  │                        │                        │
  │                        │── start election ──────→│
  │                        │                        │
  │                        │←── you are new leader ──│
  │                        │                        │
  │                        │── become primary ──────→│ (update cluster state)
  │                        │                        │
  │  (recovers)            │                        │
  │                        │←── sync data ──────────│ (primary sync to recovered node)
```

## Component Interaction

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Client    │────→│  TCP Server  │────→│   Protocol   │
└──────────────┘     └──────────────┘     │   Parser     │
                                          └──────┬───────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Visualization│←────│   Cluster    │←────│   Consistent │
│   (React)    │     │   Manager    │     │   Hashing    │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Benchmark   │←────│    Cache     │←────│ Replication  │
│              │     │    Node      │     │   Manager    │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Design Decisions

### 1. Tại sao dùng TCP thay vì HTTP?

```
TCP:
  + Nhanh hơn (ít overhead)
  + Persistent connections
  + Phù hợp cho inter-node communication

HTTP:
  + Dễ implement
  + Tooling sẵn có (curl, Postman)
  + Phù hợp cho client-facing API

Quyết định: Dùng TCP cho node-to-node, có thể thêm HTTP cho client-facing
```

### 2. Tại sao In-Memory thay vì Disk?

```
In-Memory:
  + Rất nhanh (nanoseconds vs milliseconds)
  + Phù hợp cho cache (temporary data)
  - Giới hạn bởi RAM

Disk:
  + Persistent
  + Capacity lớn hơn
  - Chậm hơn

Bảo vệ RAM:
  - enforced eviction: set() tự đuổi entry cũ khi vượt maxSize
  - Background sweep: dọn expired entries mỗi 30s
  - Configurable eviction policy (LRU/LFU/FIFO)
  - FileStorage.save() compact JSON để giảm spike

Quyết định: Cache = temporary data → In-memory phù hợp nhất
```

### 3. Tại sao không dùng Redis Protocol?

```
Redis Protocol (RESP):
  + Industry standard
  + Dùng được với Redis clients

Custom Protocol:
  + Đơn giản hơn cho learning
  + Control hoàn toàn
  + Phù hợp cho educational project

Quyết định: Dùng custom protocol đơn giản để hiểu nguyên lý
```

## Failure Modes

| Failure | Detection | Recovery |
|---|---|---|
| **Node crash** | Heartbeat timeout | Leader election, promote replica |
| **Network partition** | Missing heartbeats | Split-brain prevention with quorum |
| **Memory full** | `enforceMaxSize()` on set | LRU/LFU/FIFO eviction (configurable) |
| **Primary dies** | Replica detects | Elect new primary |
| **Replica dies** | Primary detects | Create new replica |
