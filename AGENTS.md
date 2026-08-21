# AGENTS.md

> Hướng dẫn cho AI Assistant khi làm việc với codebase này.

---

## Tổng quan Project

Đây là **distributed cache system** được xây dựng từ đầu bằng TypeScript. Mục tiêu là implement và hiểu cách Redis hoạt động đằng sau.

**Trạng thái hiện tại**: Documentation phase — chưa có code implementation.

---

## Cấu trúc Codebase

```
distributed-cache/
├── src/                          # SOURCE CODE (chưa tạo)
│   ├── core/                     # Core logic
│   ├── strategies/               # Cache strategies
│   ├── server/                   # Network layer
│   ├── visualization/            # Frontend
│   └── benchmark/                # Performance testing
├── tests/                        # TESTS (chưa tạo)
├── docs/                         # DOCUMENTATION ✅ Đã có
│   ├── core/                     # Kiến thức cốt lõi
│   ├── architecture/             # Kiến trúc & design
│   ├── guides/                   # Hướng dẫn & quy tắc
│   └── reference/                # Reference khi cần
├── agent/                        # DEVELOPMENT WORKFLOW ✅ Đã có
│   ├── COMMIT_CONVENTION.md
│   ├── GIT_WORKFLOW.md
│   ├── CODE_STYLE.md
│   ├── PR_TEMPLATE.md
│   ├── MODULES.md
│   ├── PROGRESS.md
│   └── TASKS.md
├── package.json                  # ✅ Đã có
├── tsconfig.json                 # ✅ Đã có
├── README.md                     # ✅ Đã có
├── AGENTS.md                     # ✅ Đang edit
├── CONTRIBUTING.md               # ✅ Đã có
├── CODE_OF_CONDUCT.md            # ✅ Đã có
└── LICENSE                       # ✅ Đã có
```

---

## Bắt đầu từ đâu?

### Fase 1: Infrastructure ✅ Đã hoàn thành

```
✅ package.json — đã tạo
✅ tsconfig.json — đã tạo
✅ npm install — đã cài dependencies
⬜ Tạo cấu trúc thư mục src/ (chưa tạo)
```

### Fase 2: Code theo thứ tự

```
1. src/core/types.ts              ← Interfaces chung
2. src/core/hash-helpers.ts       ← Helper functions
3. src/core/consistent-hashing.ts ← Hash ring + virtual nodes
4. src/core/node.ts               ← Cache node
5. src/strategies/lru.ts          ← LRU eviction
6. src/strategies/lfu.ts          ← LFU eviction
7. src/strategies/fifo.ts         ← FIFO eviction
8. src/server/protocol.ts         ← Wire protocol
9. src/server/cache-server.ts     ← TCP server
10. src/server/client.ts          ← Client library
11. src/core/cluster.ts           ← Cluster management
12. src/core/election.ts          ← Leader election
13. src/core/failover.ts          ← Failover handling
14. src/core/replication.ts       ← Data replication
15. src/core/invalidation.ts      ← Cache invalidation
16. src/benchmark/throughput.ts   ← Performance testing
17. src/benchmark/data-movement.ts ← Data movement testing
18. src/visualization/hash-ring.tsx ← Hash ring visualization
19. src/visualization/dashboard.tsx ← Dashboard
```

---

## Coding Conventions

> Chi tiết xem: agent/CODE_STYLE.md

```
✅ TypeScript strict mode
✅ Named exports (không default exports)
✅ Interface cho mỗi class
✅ JSDoc cho mọi public API
✅ Custom errors cho error handling
```

---

## Design Decisions

> Chi tiết xem: docs/architecture/architecture.md

```
✅ Dùng TCP thay vì HTTP (ít overhead hơn)
✅ In-Memory thay vì Disk (nhanh hơn)
✅ Custom protocol thay vì Redis Protocol (để học)
✅ Build from scratch thay vì dùng Redis (educational)
```

---

## Kiến thức cần hiểu

> Chi tiết xem: docs/core/knowledge-base.md

```
1. CAP Theorem
2. Consistent Hashing
3. Replication
4. Fault Tolerance
5. Cache Invalidation
6. Eviction Policies
```

---

## Common Tasks

### Thêm feature mới

```bash
git checkout -b feature/<name>
# Code
npm test
git add .
git commit -m "feat(<scope>): <description>"
```

### Fix bug

```bash
# Viết test reproducing bug
# Fix code
npm test
git commit -m "fix(<scope>): <description>"
```

### Chạy tests

```bash
npm test              # Tất cả tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage
```

---

## Troubleshooting

```bash
# TypeScript errors
npx tsc --noEmit

# Test fails
npx jest tests/file.test.ts

# Port conflict
lsof -i :3000
kill -9 <PID>
```
