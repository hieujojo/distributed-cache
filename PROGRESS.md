# PROGRESS — Quản lý Tasks & Modules

> File này theo dõi toàn bộ progress của project. Cập nhật sau mỗi lần code.

---

## Tổng quan

```
Trạng thái:  📝 Documentation phase
Bắt đầu:     2026-08-21
Cập nhật:    2026-08-21
```

---

## Module Breakdown

### Module 1: Core Foundation ⬜ Chưa bắt đầu

```
Scope: src/core/
Mục tiêu: Implement consistent hashing + cache node cơ bản

Tasks:
  ⬜ Tạo src/core/consistent-hashing.ts
     ├── Implement hash ring (Map<number, Node>)
     ├── Implement hash function (murmurhash3)
     ├── Implement getNode() — binary search O(log N)
     ├── Implement addNode() — thêm node với virtual nodes
     ├── Implement removeNode() — xóa node, redistribute keys
     ├── Implement getKeyDistribution() — thống kê phân phối
     └── JSDoc cho mọi public API

  ⬜ Tạo src/core/node.ts
     ├── Implement CacheNode class
     ├── Implement get(key) — check TTL, return value
     ├── Implement set(key, value, ttl?) — store + apply TTL
     ├── Implement delete(key) — remove key
     ├── Implement getSize(), getMaxSize()
     └── JSDoc cho mọi public API

  ⬜ Tạo tests/core/consistent-hashing.test.ts
     ├── Test: hash function determinist
     ├── Test: getNode trả về node đúng
     ├── Test: addNode — keys shift minimal
     ├── Test: removeNode — keys redistribute
     ├── Test: virtual nodes — distribution đều
     └── Test: edge case — 1 node, 0 nodes

  ⬜ Tạo tests/core/node.test.ts
     ├── Test: set/get/delete
     ├── Test: TTL expiration
     ├── Test: cache full — eviction
     └── Test: edge case — null value, empty key

Dependencies:
  ✅ murmurhash3 (npm install)
  ✅ @types/node

Docs cần update:
  ⬜ docs/core/consistent-hashing.md (nếu cần thêm chi tiết)
  ⬜ docs/architecture/architecture.md (nếu interface thay đổi)
```

---

### Module 2: Eviction Strategies ⬜ Chưa bắt đầu

```
Scope: src/strategies/
Mục tiêu: Implement LRU, LFU, FIFO eviction policies

Tasks:
  ⬜ Tạo src/strategies/lru.ts
     ├── Implement LRUStrategy class
     ├── Implement onAccess(key) — move to front
     ├── Implement onInsert(key) — add to front
     ├── Implement onEvict() — remove last
     └── JSDoc

  ⬜ Tạo src/strategies/lfu.ts
     ├── Implement LFUStrategy class
     ├── Implement onAccess(key) — increment frequency
     ├── Implement onInsert(key) — set frequency = 1
     ├── Implement onEvict() — remove lowest frequency
     └── JSDoc

  ⬜ Tạo src/strategies/fifo.ts
     ├── Implement FIFOStrategy class
     ├── Implement onAccess(key) — no-op
     ├── Implement onInsert(key) — add to queue
     ├── Implement onEvict() — remove oldest
     └── JSDoc

  ⬜ Tạo src/strategies/index.ts
     ├── Export tất cả strategies
     └── Export EvictionStrategy interface

  ⬜ Tạo tests/strategies/*.test.ts
     ├── Test LRU: eviction order
     ├── Test LFU: frequency tracking
     ├── Test FIFO: insertion order
     └── Test: switch strategy runtime

Dependencies:
  ✅ Không cần thêm

Docs cần update:
  ⬜ docs/architecture/design-patterns.md (Strategy pattern section)
```

---

### Module 3: Network Layer ⬜ Chưa bắt đầu

```
Scope: src/server/
Mục tiêu: TCP server + client library

Tasks:
  ⬜ Tạo src/server/protocol.ts
     ├── Implement wire protocol parser
     ├── Implement serialize/deserialize
     ├── Hỗ trợ commands: SET, GET, DEL, PING, REPLICATE, ELECT
     └── JSDoc

  ⬜ Tạo src/server/cache-server.ts
     ├── Implement TCP server (net.createServer)
     ├── Implement connection handling
     ├── Implement request routing
     ├── Implement heartbeat sender/receiver
     └── JSDoc

  ⬜ Tạo src/server/client.ts
     ├── Implement CacheClient class
     ├── Implement connect(), disconnect()
     ├── Implement get(), set(), del()
     ├── Implement retry logic
     └── JSDoc

  ⬜ Tạo tests/server/*.test.ts
     ├── Test protocol parse/serialize
     ├── Test server accept connection
     ├── Test client send/receive
     └── Test: connection timeout

Dependencies:
  ✅ Không cần thêm (dùng net module built-in)

Docs cần update:
  ⬜ docs/architecture/architecture.md (Network Layer section)
```

---

### Module 4: Cluster Management ⬜ Chưa bắt đầu

```
Scope: src/core/cluster.ts
Mục tiêu: Cluster manager + leader election + failover

Tasks:
  ⬜ Tạo src/core/cluster.ts
     ├── Implement ClusterManager class (Singleton)
     ├── Implement addNode(), removeNode()
     ├── Implement getNode(key) — route via consistent hashing
     ├── Implement getHealthyNodes()
     ├── Implement heartbeat monitoring
     └── JSDoc

  ⬜ Tạo src/core/election.ts
     ├── Implement leader election (Bully algorithm)
     ├── Implement election timeout
     ├── Implement vote request/response
     └── JSDoc

  ⬜ Tạo src/core/failover.ts
     ├── Implement automatic failover
     ├── Implement graceful failover
     ├── Implement recovery handling
     └── JSDoc

  ⬜ Tạo tests/core/cluster.test.ts
     ├── Test: add/remove node
     ├── Test: route key to correct node
     ├── Test: leader election
     ├── Test: failover on primary death
     └── Test: node recovery

Dependencies:
  ✅ Không cần thêm

Docs cần update:
  ⬜ docs/core/replication.md (nếu cần thêm chi tiết)
  ⬜ docs/reference/edge-cases.md (thêm cluster edge cases)
```

---

### Module 5: Replication ⬜ Chưa bắt đầu

```
Scope: src/core/replication.ts
Mục tiêu: Data replication + sync

Tasks:
  ⬜ Tạo src/core/replication.ts
     ├── Implement ReplicationManager class
     ├── Implement replicate(key, value) — sync to replicas
     ├── Implement syncFromLeader(leader) — full sync
     ├── Implement getReplicas(key) — list replicas
     ├── Implement sync strategies (sync, async, hybrid)
     └── JSDoc

  ⬜ Tạo tests/core/replication.test.ts
     ├── Test: replicate data to replicas
     ├── Test: sync from leader after recovery
     ├── Test: replication factor
     └── Test: sync lag measurement

Dependencies:
  ✅ Không cần thêm

Docs cần update:
  ⬜ docs/core/replication.md (nếu cần thêm chi tiết)
```

---

### Module 6: Cache Invalidation ⬜ Chưa bắt đầu

```
Scope: src/core/invalidation.ts
Mục tiêu: TTL + event-driven invalidation

Tasks:
  ⬜ Tạo src/core/invalidation.ts
     ├── Implement InvalidationManager class
     ├── Implement setTTL(key, ttl) — set expiration
     ├── Implement checkTTL(key) — check if expired
     ├── Implement invalidate(key) — manual invalidation
     ├── Implement onDatabaseChange(event) — event-driven
     └── JSDoc

  ⬜ Tạo tests/core/invalidation.test.ts
     ├── Test: TTL expiration
     ├── Test: manual invalidation
     ├── Test: event-driven invalidation
     └── Test: concurrent invalidation

Dependencies:
  ✅ Không cần thêm

Docs cần update:
  ⬜ docs/core/cache-invalidation.md (nếu cần thêm chi tiết)
```

---

### Module 7: Benchmark ⬜ Chưa bắt đầu

```
Scope: src/benchmark/
Mục tiêu: Performance testing + comparison

Tasks:
  ⬜ Tạo src/benchmark/throughput.ts
     ├── Benchmark: operations per second
     ├── Compare: consistent vs naive hashing
     └── Output: console table

  ⬜ Tạo src/benchmark/data-movement.ts
     ├── Benchmark: % keys moved when adding node
     ├── Compare: consistent vs naive hashing
     └── Output: console table

  ⬜ Tạo src/benchmark/run.ts
     ├── Run all benchmarks
     └── Output: summary report

Dependencies:
  ✅ Không cần thêm

Docs cần update:
  ⬜ README.md (Benchmark section — thêm kết quả thực)
```

---

### Module 8: Visualization ⬜ Chưa bắt đầu

```
Scope: src/visualization/
Mục tiêu: Hash ring visualization + dashboard

Tasks:
  ⬜ Tạo src/visualization/hash-ring.tsx
     ├── Implement Canvas renderer
     ├── Implement hash ring drawing
     ├── Implement node animation
     └── Implement interactive (click node)

  ⬜ Tạo src/visualization/dashboard.tsx
     ├── Implement cluster stats display
     ├── Implement node health status
     └── Implement real-time updates

  ⬜ Tạo src/visualization/server.ts
     ├── Dev server cho visualization
     └── Proxy requests đến cache server

Dependencies:
  ⬜ react (npm install)
  ⬜ react-dom (npm install)
  ⬜ @types/react (npm install)

Docs cần update:
  ⬜ docs/architecture/tech-stack.md (React section)
```

---

## Dependencies Tracking

### Đã cài

```
✅ typescript      ^5.4.0    (devDependency)
✅ tsup            ^8.0.0    (devDependency)
✅ jest            ^29.7.0   (devDependency)
✅ @types/jest     ^29.5.0   (devDependency)
✅ ts-jest         ^29.1.0   (devDependency)
✅ tsx             ^4.0.0    (devDependency)
✅ @types/node     ^20.0.0   (devDependency)
```

### Cần cài thêm

```
⬜ murmurhash3     (Module 1: Consistent Hashing)
⬜ react           (Module 8: Visualization)
⬜ react-dom       (Module 8: Visualization)
⬜ @types/react    (Module 8: Visualization)
```

### Không cần cài

```
❌ redis           — Project này tự implement
❌ express         — Dùng TCP socket, không HTTP
❌ socket.io       — Dùng raw TCP, không WebSocket
❌ mongoose        — In-memory, không cần DB
```

---

## Conflict Tracking

### Hiện tại: Không có conflict

```
✅ Docs và code đều chưa có conflict
✅ Dependencies không conflict
✅ Không có breaking changes
```

### Khi phát hiện conflict

```
1. Ghi vào đây NGAY
2. Mô tả: file nào, dòng nào, vấn đề gì
3. Giải pháp: sửa code hay sửa docs
4. Commit với message: "fix: resolve conflict between X và Y"
```

---

## Changelog (Code changes)

### Chưa có code changes

```
> Chưa implement code nào. Bắt đầu từ Module 1.
```

---

## Checklist trước khi code mỗi module

```
□ Đọc docs liên quan
□ Kiểm tra dependencies đã cài chưa
□ Tạo feature branch
□ Viết code
□ Viết tests
□ Chạy tests — pass
□ Chạy lint — pass
□ Cập nhật docs nếu cần
□ Commit với convention
□ Merge vào main
```

---

## Timeline (Dự kiến)

```
Tuần 1: Module 1 (Core Foundation)
         → Consistent Hashing + Cache Node

Tuần 2: Module 2 (Eviction Strategies)
         → LRU, LFU, FIFO

Tuần 3: Module 3 (Network Layer)
         → TCP Server + Client

Tuần 4: Module 4 (Cluster Management)
         → Cluster Manager + Leader Election

Tuần 5: Module 5 (Replication)
         → Data Replication

Tuần 6: Module 6 (Cache Invalidation)
         → TTL + Event-driven

Tuần 7: Module 7 (Benchmark)
         → Performance Testing

Tuần 8: Module 8 (Visualization)
         → Hash Ring + Dashboard
```
