# Distributed Cache System

> Hệ thống cache phân tán xây dựng từ đầu bằng TypeScript — mô phỏng cách Redis hoạt động.

## Đọc docs theo thứ tự

```
BƯỚC 1 — Hiểu big picture:
  1. README.md (bạn đang đọc)
  2. docs/core/knowledge-base.md         ← Đọc TRƯỚC TIÊN

BƯỚC 2 — Hiểu kiến trúc:
  3. docs/architecture/architecture.md
  4. docs/architecture/tech-stack.md

BƯỚC 3 — Hiểu core algorithms:
  5. docs/core/consistent-hashing.md
  6. docs/core/replication.md
  7. docs/core/cache-invalidation.md

BƯỚC 4 — Biết quy tắc code:
  8. docs/guides/rules.md                ← Rules + lessons learned
  9. docs/guides/decisions.md            ← Design decisions
  10. docs/guides/testing.md             ← Testing guide
  11. docs/architecture/design-system.md
  12. docs/architecture/design-patterns.md

BƯỚC 5 — Biết cách contribute:
  13. CONTRIBUTING.md
  14. docs/guides/setup.md

BƯỚC 6 — Reference khi cần:
  15. docs/reference/diagrams.md
  16. docs/reference/edge-cases.md
  17. docs/reference/changelog.md        ← Bug tracking
```

---

## Khi bắt đầu code

```
1. Đọc HANDOVER.md          ← Context từ session trước
2. Đọc agent/WORKFLOW.md     ← Quy trình
3. Đọc agent/PROGRESS.md     ← Xem progress
4. Đọc tasks/<module>.md     ← Chi tiết task
5. Code theo tasks file
```

---

## Cấu trúc thư mục

```
distributed-cache/
├── src/                          # SOURCE CODE
│   ├── core/                     # Core logic (✅ Module 1, 4)
│   ├── strategies/               # Cache strategies (✅ Module 2)
│   ├── server/                   # Network layer (✅ Module 3)
│   ├── visualization/            # Frontend (⬜ Module 8)
│   └── benchmark/                # Performance testing (⬜ Module 7)
│
├── docs/                         # DOCUMENTATION
│   ├── core/                     # Kiến thức cốt lõi (4 files)
│   ├── architecture/             # Kiến trúc & design (4 files)
│   ├── guides/                   # Hướng dẫn & quy tắc (4 files)
│   └── reference/                # Reference khi cần (3 files)
│
├── agent/                        # AI WORKFLOW (7 files)
│   ├── WORKFLOW.md               ← Quy trình tổng hợp
│   ├── PROGRESS.md               ← Track progress + milestones
│   ├── MODULES.md                ← Tổng quan modules
│   ├── COMMIT_CONVENTION.md      ← Quy tắc commit
│   ├── GIT_WORKFLOW.md           ← Git workflow
│   ├── CODE_STYLE.md             ← Code style
│   └── PR_TEMPLATE.md            ← Template PR
│
├── tasks/                        # TASK TRACKING (9 files)
│   ├── 00-overview.md            ← Dependencies chung
│   └── 01-08 modules             ← Chi tiết từng module
│
├── tests/                        # TESTS
│   ├── core/                     # Core tests (✅ 93 tests)
│   ├── strategies/               # Strategy tests (✅ 19 tests)
│   └── server/                   # Server tests (✅ 77 tests)
│
├── HANDOVER.md                   ← Context handoff giữa sessions
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
├── LICENSE
├── package.json
├── tsconfig.json
└── README.md
```

---

## Tech Stack

| Layer | Công nghệ | Lý do |
|---|---|---|
| Language | TypeScript | Type safety, IDE support |
| Runtime | Node.js | Ecosystem, compatibility |
| Hash | murmurhash | Performance, proven in Redis/Cassandra |
| Network | TCP sockets | Low latency, Redis-compatible |
| Frontend | React + Canvas | Popular, efficient rendering |
| Testing | Jest | Standard for Node.js |
| Build | tsup | Fast bundler |

---

## Trạng thái

```
✅ Module 1: Core Foundation (consistent hashing, cache node)
✅ Module 2: Eviction Strategies (LRU, LFU, FIFO)
✅ Module 3: Network Layer (TCP server, client, protocol)
✅ Module 4: Cluster Management (cluster, election, failover)
⬜ Module 5: Replication
⬜ Module 6: Cache Invalidation
⬜ Module 7: Benchmark
⬜ Module 8: Visualization
```

---

## Quick Start

```bash
git clone https://github.com/hieujojo/distributed-cache.git
cd distributed-cache
npm install
npm test
```

---

## Security

Xem SECURITY.md để biết các security considerations.

---

## Design Decisions

Xem docs/guides/decisions.md để hiểu tại sao chọn tech stack và patterns hiện tại.

---

## License

MIT
