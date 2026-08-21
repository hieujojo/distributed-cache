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
  8.  docs/guides/rules.md
  9.  docs/architecture/design-system.md
  10. docs/architecture/design-patterns.md

BƯỚC 5 — Biết cách contribute:
  11. docs/guides/setup.md
  12. docs/guides/contributing.md

BƯỚC 6 — Reference khi cần:
  13. docs/reference/diagrams.md
  14. docs/reference/edge-cases.md
  15. docs/reference/changelog.md
```

---

## Cấu trúc thư mục

```
distributed-cache/
├── src/
│   ├── core/              # Core logic (chưa implement)
│   ├── strategies/        # Cache strategies
│   ├── server/            # TCP server
│   └── visualization/     # React + Canvas
│
├── docs/
│   ├── core/              # Kiến thức cốt lõi
│   │   ├── knowledge-base.md    ← Đọc trước tiên
│   │   ├── consistent-hashing.md
│   │   ├── replication.md
│   │   └── cache-invalidation.md
│   ├── architecture/      # Kiến trúc & design
│   ├── guides/            # Hướng dẫn & quy tắc
│   └── reference/         # Reference khi cần
│
├── agent/                 # Git workflow & conventions
├── package.json
├── tsconfig.json
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
✅ Đã có: Documentation (15 files), package.json, tsconfig.json
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
