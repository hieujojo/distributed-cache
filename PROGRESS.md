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

## Quy tắc Code Structure

### Size Guidelines

```
Function:  ≤ 100 dòng (nếu làm đúng 1 việc)
Class:     ≤ 1000 dòng (nếu làm đúng 1 việc)
File:      ≤ 2000 dòng (nếu chứa 1 class chính)
```

### Quy tắc thực sự

```
1. Function làm 1 việc → length không quan trọng
2. Class làm 1 việc → length không quan trọng
3. File chứa 1 class chính → length không quan trọng

Nếu vượt → examine lại:
  - Có đang làm nhiều việc không?
  - Có thể tách helper functions không?
  - Có thể tách ra file mới không?
```

### Single Responsibility

```
✅ Function: validateKey() — chỉ validate
✅ Function: hashKey() — chỉ hash
✅ Function: storeKey() — chỉ store

✗ Function: processKey() — validate + hash + store
→ PHẢI tách ra 3 functions riêng
```

### Khi cần tách file

```
Khi file > 2000 dòng:
  1. Tách theo responsibility
  2. Tách helper functions ra file riêng
  3. Giữ class chính trong file chính

Ví dụ:
  src/core/consistent-hashing.ts (2500 dòng)
  → Tách thành:
    src/core/consistent-hashing.ts (class chính)
    src/core/hash-helpers.ts (helper functions)
```

---

## Conflict Prevention Rules

### Rule 1: Mỗi task chỉ TẠO file mới

```
✅ Module 1: TẠO src/core/node.ts
✅ Module 2: TẠO src/strategies/lru.ts
✅ Module 3: TẠO src/server/cache-server.ts

✗ Module 1: TẠO src/core/node.ts
✗ Module 2: SỬA src/core/node.ts  ← KHÔNG ĐƯỢC
```

### Rule 2: Nếu cần sửa file → discuss trước

```
Khi cần sửa file đã tồn tại:
  1. Ghi vào PROGRESS.md (mục "Pending Changes")
  2. Giải thích tại sao cần sửa
  3. User approve → mới sửa
  4. Commit với message: "refactor: update X based on Y"
```

### Rule 3: Injection thay vì Modification

```
Thay vì sửa CacheNode để thêm eviction:
  → CacheNode nhận EvictionStrategy qua constructor

Trước (sửa code cũ):
  class CacheNode {
    evict() {
      // Hardcoded LRU logic
    }
  }

Sau (inject dependency):
  class CacheNode {
    constructor(private strategy: EvictionStrategy) {}
    evict() {
      this.strategy.onEvict();  // Delegate to strategy
    }
  }

→ Module 1 không cần sửa khi Module 2 thêm strategy mới
```

### Rule 4: Interface-based Design

```
Mọi module giao tiếp qua interfaces:

// src/core/types.ts
export interface EvictionStrategy {
  onAccess(key: string): void;
  onInsert(key: string): void;
  onEvict(): string | null;
}

// Module 2 implements interface
export class LRUStrategy implements EvictionStrategy { ... }

// Module 1 uses interface
class CacheNode {
  constructor(private strategy: EvictionStrategy) {}
}

→ Module 1 và Module 2 độc lập
→ Thêm strategy mới = thêm class mới, KHÔNG sửa code cũ
```

---

## Module Breakdown

### Module 1: Core Foundation ⬜ Chưa bắt đầu

```
Scope: src/core/
Mục tiêu: Implement consistent hashing + cache node cơ bản

Files sẽ TẠO:
  ⬜ src/core/types.ts           — Interfaces chung
  ⬜ src/core/consistent-hashing.ts — Hash ring
  ⬜ src/core/node.ts            — Cache node
  ⬜ src/core/hash-helpers.ts    — Helper functions
  ⬜ tests/core/consistent-hashing.test.ts
  ⬜ tests/core/node.test.ts

Dependencies:
  ✅ murmurhash3 (cần cài thêm)

Docs cần update:
  ⬜ README.md (Trạng thái)
```

---

### Module 2: Eviction Strategies ⬜ Chưa bắt đầu

```
Scope: src/strategies/
Mục tiêu: Implement LRU, LFU, FIFO eviction policies

Files sẽ TẠO:
  ⬜ src/strategies/index.ts     — Export + interface
  ⬜ src/strategies/lru.ts       — LRU strategy
  ⬜ src/strategies/lfu.ts       — LFU strategy
  ⬜ src/strategies/fifo.ts      — FIFO strategy
  ⬜ tests/strategies/lru.test.ts
  ⬜ tests/strategies/lfu.test.ts
  ⬜ tests/strategies/fifo.test.ts

Dependencies:
  ✅ Không cần thêm

Conflict với Module 1:
  ✅ KHÔNG — inject strategy qua constructor
```

---

### Module 3: Network Layer ⬜ Chưa bắt đầu

```
Scope: src/server/
Mục tiêu: TCP server + client library

Files sẽ TẠO:
  ⬜ src/server/protocol.ts      — Wire protocol
  ⬜ src/server/cache-server.ts  — TCP server
  ⬜ src/server/client.ts        — Client library
  ⬜ tests/server/protocol.test.ts
  ⬜ tests/server/cache-server.test.ts
  ⬜ tests/server/client.test.ts

Dependencies:
  ✅ Không cần thêm (dùng net module built-in)

Conflict với Module 1, 2:
  ✅ KHÔNG — sử dụng interfaces từ Module 1
```

---

### Module 4: Cluster Management ⬜ Chưa bắt đầu

```
Scope: src/core/
Mục tiêu: Cluster manager + leader election + failover

Files sẽ TẠO:
  ⬜ src/core/cluster.ts         — Cluster manager (Singleton)
  ⬜ src/core/election.ts        — Leader election
  ⬜ src/core/failover.ts        — Failover handling
  ⬜ tests/core/cluster.test.ts
  ⬜ tests/core/election.test.ts
  ⬜ tests/core/failover.test.ts

Dependencies:
  ✅ Không cần thêm

Conflict với Module 1, 2, 3:
  ✅ KHÔNG — sử dụng interfaces từ Module 1
```

---

### Module 5: Replication ⬜ Chưa bắt đầu

```
Scope: src/core/
Mục tiêu: Data replication + sync

Files sẽ TẠO:
  ⬜ src/core/replication.ts     — Replication manager
  ⬜ tests/core/replication.test.ts

Dependencies:
  ✅ Không cần thêm

Conflict với Module 1-4:
  ✅ KHÔNG — sử dụng interfaces từ Module 1
```

---

### Module 6: Cache Invalidation ⬜ Chưa bắt đầu

```
Scope: src/core/
Mục tiêu: TTL + event-driven invalidation

Files sẽ TẠO:
  ⬜ src/core/invalidation.ts    — Invalidation manager
  ⬜ tests/core/invalidation.test.ts

Dependencies:
  ✅ Không cần thêm

Conflict với Module 1-5:
  ✅ KHÔNG — sử dụng interfaces từ Module 1
```

---

### Module 7: Benchmark ⬜ Chưa bắt đầu

```
Scope: src/benchmark/
Mục tiêu: Performance testing + comparison

Files sẽ TẠO:
  ⬜ src/benchmark/throughput.ts
  ⬜ src/benchmark/data-movement.ts
  ⬜ src/benchmark/run.ts

Dependencies:
  ✅ Không cần thêm

Conflict với Module 1-6:
  ✅ KHÔNG — chỉ đọc data từ cache, không sửa
```

---

### Module 8: Visualization ⬜ Chưa bắt đầu

```
Scope: src/visualization/
Mục tiêu: Hash ring visualization + dashboard

Files sẽ TẠO:
  ⬜ src/visualization/hash-ring.tsx
  ⬜ src/visualization/dashboard.tsx
  ⬜ src/visualization/server.ts

Dependencies:
  ⬜ react (cần cài thêm)
  ⬜ react-dom (cần cài thêm)
  ⬜ @types/react (cần cài thêm)

Conflict với Module 1-7:
  ✅ KHÔNG — chỉ đọc data, không sửa
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

### Pending Changes

```
> Chưa có pending changes nào
```

### Khi phát hiện conflict

```
1. Ghi vào đây NGAY
2. Mô tả: file nào, dòng nào, vấn đề gì
3. Giải pháp: sửa code hay sửa docs
4. User approve → mới sửa
5. Commit với message: "fix: resolve conflict between X và Y"
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
□ Kiểm tra: chỉ TẠO file mới, KHÔNG sửa file cũ
□ Viết code (tối đa 100 dòng/function, 1000 dòng/class)
□ Viết tests
□ Chạy tests — pass
□ Chạy lint — pass
□ Cập nhật docs nếu cần
□ Cập nhật PROGRESS.md (tick tasks)
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
