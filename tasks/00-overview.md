# Tasks Overview — Tổng quan Tasks & Dependencies

> File này quản lý dependencies chung và tổng quan toàn bộ tasks.

---

## Dependencies

### Đã cài ✅

```
typescript      ^5.4.0    (devDependency)
tsup            ^8.0.0    (devDependency)
jest            ^29.7.0   (devDependency)
@types/jest     ^29.5.0   (devDependency)
ts-jest         ^29.1.0   (devDependency)
tsx             ^4.0.0    (devDependency)
@types/node     ^20.0.0   (devDependency)
murmurhash      (Module 1: Consistent Hashing)
```

### Cần cài thêm ⬜

```
Không có
```

### Không cần cài ❌

```
redis           — Project tự implement
express         — Dùng TCP socket
socket.io       — Dùng raw TCP
mongoose        — In-memory cache
```

---

## Config files đã tạo ✅

```
✅ .gitignore
✅ jest.config.cjs    ← Lưu ý: .cjs không phải .ts
✅ tsconfig.json
✅ package.json
```

---

## Source structure

### Đã tạo ✅

```
✅ src/core/types.ts           (Module 1)
✅ src/core/hash-helpers.ts    (Module 1)
✅ src/core/consistent-hashing.ts (Module 1)
✅ src/core/node.ts            (Module 1)
✅ src/strategies/index.ts     (Module 2)
✅ src/strategies/lru.ts       (Module 2)
✅ src/strategies/lfu.ts       (Module 2)
✅ src/strategies/fifo.ts      (Module 2)
✅ src/server/protocol.ts      (Module 3)
✅ src/server/cache-server.ts  (Module 3)
✅ src/server/client.ts        (Module 3)
✅ src/core/cluster.ts         (Module 4)
✅ src/core/election.ts        (Module 4)
✅ src/core/failover.ts        (Module 4)
```

### Chưa tạo ⬜

```
✅ src/core/replication.ts     (Module 5)
✅ src/core/invalidation.ts    (Module 6)
✅ src/benchmark/throughput.ts (Module 7)
✅ src/benchmark/data-movement.ts (Module 7)
✅ src/benchmark/run.ts        (Module 7)
✅ src/visualization/hash-ring.tsx (Module 8)
✅ src/visualization/dashboard.tsx (Module 8)
✅ src/visualization/server.ts (Module 8)
```

---

## Module Dependency Graph

```
Module 1 (Core Foundation) ✅
  ├── TẠO: types.ts, hash-helpers.ts, consistent-hashing.ts, node.ts
  ├── Dependencies: murmurhash
  └── Không phụ thuộc module nào

Module 2 (Eviction Strategies) ✅
  ├── TẠO: index.ts, lru.ts, lfu.ts, fifo.ts
  ├── Dependencies: Không cần thêm
  └── Phụ thuộc: Module 1 (types.ts)

Module 3 (Network Layer) ✅
  ├── TẠO: protocol.ts, cache-server.ts, client.ts
  ├── Dependencies: Không cần thêm (net module built-in)
  └── Phụ thuộc: Module 1 (node.ts)

Module 4 (Cluster Management) ✅
  ├── TẠO: cluster.ts, election.ts, failover.ts
  ├── Dependencies: Không cần thêm
  └── Phụ thuộc: Module 1, Module 3

Module 5 (Replication) ⬜
  ├── TẠO: replication.ts
  ├── Dependencies: Không cần thêm
  └── Phụ thuộc: Module 1, Module 4

Module 6 (Cache Invalidation) ⬜
  ├── TẠO: invalidation.ts
  ├── Dependencies: Không cần thêm
  └── Phụ thuộc: Module 1

Module 7 (Benchmark) ⬜
  ├── TẠO: throughput.ts, data-movement.ts, run.ts
  ├── Dependencies: Không cần thêm
  └── Phụ thuộc: Module 1, Module 3

Module 8 (Visualization) ⬜
  ├── TẠO: hash-ring.tsx, dashboard.tsx, server.ts
  ├── Dependencies: react, react-dom, @types/react
  └── Phụ thuộc: Module 1, Module 4
```

---

## Conflict Map

```
Module 1 → Module 2: KHÔNG (inject strategy)
Module 1 → Module 3: KHÔNG (sử dụng interface)
Module 1 → Module 4: KHÔNG (quản lý nodes)
Module 1 → Module 5: KHÔNG (sync data)
Module 1 → Module 6: KHÔNG (invalidate)
Module 1 → Module 7: KHÔNG (read-only)
Module 1 → Module 8: KHÔNG (read-only)

→ Tất cả modules KHÔNG conflict
→ Mỗi module TẠO file mới, KHÔNG sửa file cũ
```

---

## Changelog

```
2026-08-21: Tạo tasks/ folder + 9 files
2026-08-22: Fix murmurhash3 → murmurhash, jest.config.ts → jest.config.cjs
2026-08-22: Đánh dấu Module 1-2 hoàn thành
2026-08-22: Hoàn thành Module 3 (Network Layer)
2026-08-22: Hoàn thành Module 4 (Cluster Management)
```
