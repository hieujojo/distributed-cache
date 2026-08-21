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
  8. docs/guides/rules.md
  9. docs/architecture/design-system.md
  10. docs/architecture/design-patterns.md

BƯỚC 5 — Biết cách contribute:
  11. CONTRIBUTING.md
  12. docs/guides/setup.md

BƯỚC 6 — Reference khi cần:
  13. docs/reference/diagrams.md
  14. docs/reference/edge-cases.md
  15. docs/reference/changelog.md
```

---

## Khi bắt đầu code

```
1. Đọc agent/WORKFLOW.md     ← Quy trình
2. Đọc agent/PROGRESS.md     ← Xem progress
3. Đọc tasks/<module>.md     ← Chi tiết task
4. Code theo tasks file
```

---

## Cấu trúc thư mục

```
distributed-cache/
├── src/                          # SOURCE CODE (chưa tạo)
│   ├── core/                     # Core logic
│   ├── strategies/               # Cache strategies
│   ├── server/                   # Network layer
│   ├── visualization/            # Frontend
│   └── benchmark/                # Performance testing
│
├── docs/                         # DOCUMENTATION
│   ├── core/                     # Kiến thức cốt lõi
│   ├── architecture/             # Kiến trúc & design
│   ├── guides/                   # Hướng dẫn & quy tắc
│   └── reference/                # Reference khi cần
│
├── agent/                        # AI WORKFLOW
│   ├── WORKFLOW.md               ← Quy trình tổng hợp
│   ├── PROGRESS.md               ← Track progress
│   ├── MODULES.md                ← Tổng quan modules
│   ├── COMMIT_CONVENTION.md      ← Quy tắc commit
│   ├── GIT_WORKFLOW.md           ← Git workflow
│   ├── CODE_STYLE.md             ← Code style
│   └── PR_TEMPLATE.md            ← Template PR
│
├── tasks/                        # TASK TRACKING
│   ├── 00-overview.md            ← Dependencies chung
│   ├── 01-core-foundation.md     ← Module 1
│   ├── 02-eviction-strategies.md ← Module 2
│   ├── 03-network-layer.md       ← Module 3
│   ├── 04-cluster-management.md  ← Module 4
│   ├── 05-replication.md         ← Module 5
│   ├── 06-cache-invalidation.md  ← Module 6
│   ├── 07-benchmark.md           ← Module 7
│   └── 08-visualization.md       ← Module 8
│
├── package.json
├── tsconfig.json
├── README.md
├── AGENTS.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
└── LICENSE
```

---

## Tech Stack

| Layer | Công nghệ |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Network | TCP sockets |
| Frontend | React + Canvas |
| Testing | Jest |
| Build | tsup |

---

## Trạng thái

```
✅ Đã có: Documentation (24 files), package.json, tsconfig.json
🔲 Chưa có: Source code implementation
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

## License

MIT
