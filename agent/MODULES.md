# Modules — Tổng quan từng Module

> File này mô tả từng module: mục đích, responsibility, connections.

---

## Module 1: Core Foundation

```
Mục tiêu: Consistent Hashing + Cache Node

Files:
  src/core/types.ts           → Interfaces chung (Value, CacheEntry, EvictionStrategy)
  src/core/consistent-hashing.ts → Hash ring + virtual nodes
  src/core/node.ts            → Cache node (get/set/delete)
  src/core/hash-helpers.ts    → Helper functions (hash, binary search)

Responsibility:
  - Hash key tìm đúng node
  - Lưu/get/delete data trong memory
  - Manage TTL expiration

Connections:
  → Module 2 inject EvictionStrategy vào CacheNode
  → Module 3 sử dụng CacheNode để serve requests
  → Module 4 quản lý nhiều CacheNodes
```

---

## Module 2: Eviction Strategies

```
Mục tiêu: LRU, LFU, FIFO eviction policies

Files:
  src/strategies/index.ts     → Export + EvictionStrategy interface
  src/strategies/lru.ts       → Least Recently Used
  src/strategies/lfu.ts       → Least Frequently Used
  src/strategies/fifo.ts      → First In First Out

Responsibility:
  - Quyết định xóa key nào khi cache đầy
  - Track access pattern (LRU: recent, LFU: frequency)
  - Không lưu data, chỉ quản lý eviction logic

Connections:
  → Implements interface từ Module 1 (types.ts)
  → Inject vào CacheNode qua constructor
  → KHÔNG sửa node.ts
```

---

## Module 3: Network Layer

```
Mục tiêu: TCP server + client library

Files:
  src/server/protocol.ts      → Wire protocol (parse/serialize)
  src/server/cache-server.ts  → TCP server (accept connections)
  src/server/client.ts        → Client library (send/receive)

Responsibility:
  - Parse TCP requests thành CacheRequest objects
  - Route requests đến CacheNode đúng
  - Handle connections, timeouts, retries

Connections:
  → Sử dụng CacheNode từ Module 1
  → Sử dụng ClusterManager từ Module 4
  → Protocol-independent với core logic
```

---

## Module 4: Cluster Management

```
Mục tiêu: Cluster manager + leader election + failover

Files:
  src/core/cluster.ts         → ClusterManager (Singleton)
  src/core/election.ts        → Leader election (Bully algorithm)
  src/core/failover.ts        → Automatic failover

Responsibility:
  - Quản lý danh sách nodes
  - Phát hiện node failure (heartbeat)
  - Bầu leader mới khi primary die
  - Route requests đến đúng node

Connections:
  → Sử dụng ConsistentHash từ Module 1
  → Quản lý nhiều CacheNodes
  → Trigger failover khi node dies
```

---

## Module 5: Replication

```
Mục tiêu: Data replication + sync

Files:
  src/core/replication.ts     → ReplicationManager

Responsibility:
  - Copy data từ primary sang replicas
  - Sync data khi node recover
  - Manage replication factor

Connections:
  → Sử dụng CacheNode từ Module 1
  → Sử dụng ClusterManager từ Module 4
  → Trigger replication khi data thay đổi
```

---

## Module 6: Cache Invalidation

```
Mục tiêu: TTL + event-driven invalidation

Files:
  src/core/invalidation.ts    → InvalidationManager

Responsibility:
  - Quản lý TTL cho mỗi key
  - Invalidate cache khi data thay đổi
  - Notify listeners khi key thay đổi

Connections:
  → Sử dụng CacheNode từ Module 1
  → Publish events khi key thay đổi
  → Subscribe từ Module 5 (replication)
```

---

## Module 7: Benchmark

```
Mục tiêu: Performance testing + comparison

Files:
  src/benchmark/throughput.ts     → Ops per second
  src/benchmark/data-movement.ts  → Keys moved khi thêm node
  src/benchmark/run.ts            → Runner

Responsibility:
  - Đo throughput (operations/second)
  - So sánh consistent vs naive hashing
  - Output: console table

Connections:
  → Chỉ ĐỌC data từ CacheNode
  → KHÔNG sửa bất kỳ file nào
```

---

## Module 8: Visualization

```
Mục tiêu: Hash ring visualization + dashboard

Files:
  src/visualization/hash-ring.tsx → Canvas renderer
  src/visualization/dashboard.tsx → Stats display
  src/visualization/server.ts     → Dev server

Responsibility:
  - Render hash ring lên Canvas
  - Hiển thị node status real-time
  - Interactive: click node để xem chi tiết

Connections:
  → ĐỌC data từ ClusterManager
  → KHÔNG sửa bất kỳ file nào
  → React components
```

---

## Dependency Graph

```
Module 1 (Core) ← Foundation
    ↑
Module 2 (Strategies) ← Inject vào Module 1
    ↑
Module 3 (Network) ← Sử dụng Module 1
    ↑
Module 4 (Cluster) ← Quản lý Module 1
    ↑
Module 5 (Replication) ← Sync Module 1
    ↑
Module 6 (Invalidation) ← Event-driven Module 1
    ↑
Module 7 (Benchmark) ← Đọc Module 1
    ↑
Module 8 (Visualization) ← Đọc Module 4
```

---

## Conflict Map

```
Module 1 → Module 2: KHÔNG conflict (inject strategy)
Module 1 → Module 3: KHÔNG conflict (sử dụng interface)
Module 1 → Module 4: KHÔNG conflict (quản lý nodes)
Module 1 → Module 5: KHÔNG conflict (sync data)
Module 1 → Module 6: KHÔNG conflict (invalidate)
Module 1 → Module 7: KHÔNG conflict (read-only)
Module 1 → Module 8: KHÔNG conflict (read-only)

→ Tất cả modules KHÔNG conflict với nhau
→ Mỗi module TẠO file mới, KHÔNG sửa file cũ
```
