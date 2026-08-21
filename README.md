# Distributed Cache System

> Hệ thống cache phân tán đơn giản hóa được xây dựng từ đầu bằng TypeScript, mô phỏng cách Redis hoạt động.

## Tổng quan

Hầu hết developer chỉ **sử dụng** Redis mà không **hiểu** nó hoạt động thế nào. Project này implement các cơ chế cốt lõi đằng sau cache phân tán — consistent hashing, replication, cache invalidation — để thể hiện tư duy về distributed systems.

### Các tính năng chính

| Tính năng | Mô tả | Trạng thái |
|---|---|---|
| **Consistent Hashing** | Phân phối data trên ring, thêm/xóa node chỉ ảnh hưởng ~1/N keys | 🔲 Chưa implement |
| **Data Replication** | Nhân bản data, leader election tự động khi node dies | 🔲 Chưa implement |
| **Cache Invalidation** | TTL, write-through, event-driven invalidation | 🔲 Chưa implement |
| **Eviction Policies** | LRU, LFU khi cache đầy | 🔲 Chưa implement |
| **Visualization** | Hiển thị hash ring real-time trên browser | 🔲 Chưa implement |
| **Benchmark** | Đo throughput, latency, data movement | 🔲 Chưa implement |

---

## Tech Stack

| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| **Language** | TypeScript | Type safety, IDE support, ecosystem |
| **Runtime** | Node.js | Non-blocking I/O, phù hợp network services |
| **Network** | TCP sockets | Giao tiếp node-to-node, không phụ thuộc framework |
| **Frontend** | React + Canvas | Visualization hash ring interactive |
| **Testing** | Jest | Industry standard, mocking tốt |
| **Build** | tsup | Bundle nhanh, ES modules support |

---

## Cấu trúc thư mục

```
distributed-cache/
├── src/
│   ├── core/                      # Core logic
│   ├── strategies/                # Cache strategies
│   ├── server/                    # Network layer
│   └── visualization/             # Frontend
│
├── docs/
│   ├── core/                      # Core concepts
│   │   ├── concepts.md           # 17 khái niệm distributed systems
│   │   ├── consistent-hashing.md
│   │   ├── replication.md
│   │   └── cache-invalidation.md
│   ├── architecture/              # Kiến trúc
│   │   ├── architecture.md
│   │   └── tech-stack.md
│   ├── guides/                    # Hướng dẫn
│   │   ├── setup.md
│   │   └── contributing.md
│   ├── design-system.md           # Design system
│   ├── design-patterns.md         # Design patterns
│   ├── rules.md                   # Quy tắc cần tuân thủ
│   ├── changelog.md               # Bugs & lessons learned
│   ├── edge-cases.md              # Xử lý trường hợp đặc biệt
│   ├── knowledge-base.md          # Kiến thức trọng tâm
│   └── diagrams.md                # Sơ đồ minh họa
│
├── agent/                         # Development workflow
├── package.json
├── tsconfig.json
├── AGENTS.md
└── README.md
```

---

## Documentation

### Kiến thức cốt lõi

| File | Nội dung |
|---|---|
| [knowledge-base.md](docs/knowledge-base.md) | **Kiến thức trọng tâm** — Đọc file này trước tiên |
| [concepts.md](docs/core/concepts.md) | Giải thích 17 khái niệm distributed systems |
| [consistent-hashing.md](docs/core/consistent-hashing.md) | Deep dive: hash ring, virtual nodes |
| [replication.md](docs/core/replication.md) | Deep dive: primary/replica, leader election |
| [cache-invalidation.md](docs/core/cache-invalidation.md) | Deep dive: TTL, write-through, event-driven |

### Kiến trúc & Design

| File | Nội dung |
|---|---|
| [architecture.md](docs/architecture/architecture.md) | Component diagram, data flow, design decisions |
| [tech-stack.md](docs/architecture/tech-stack.md) | Technology choices và lý do |
| [design-system.md](docs/design-system.md) | Quy chuẩn thiết kế, naming, code structure |
| [design-patterns.md](docs/design-patterns.md) | Strategy, Observer, Factory, Singleton... |

### Quy tắc & Quy trình

| File | Nội dung |
|---|---|
| [rules.md](docs/rules.md) | Các quy tắc BẮT BUỘC khi làm việc với project |
| [setup.md](docs/guides/setup.md) | Hướng dẫn cài đặt và sử dụng |
| [contributing.md](docs/guides/contributing.md) | Quy trình contribution |

### Troubleshooting & Reference

| File | Nội dung |
|---|---|
| [edge-cases.md](docs/edge-cases.md) | Xử lý tràn RAM, timeout, crash... |
| [changelog.md](docs/changelog.md) | Ghi nhận bugs để tránh lặp lại |
| [diagrams.md](docs/diagrams.md) | Sơ đồ use case, relationship, flow |

---

## Quick Start

```bash
# Clone
git clone https://github.com/hieujojo/distributed-cache.git
cd distributed-cache

# Install
npm install

# Run tests
npm test

# Run benchmark
npm run benchmark

# Start visualization
npm run viz
```

---

## Learning Outcomes

| Concept | Kiến thức |
|---|---|
| **Consistent Hashing** | Hash ring, virtual nodes, key distribution |
| **Data Replication** | Primary/replica, failover, leader election |
| **Cache Invalidation** | TTL, write-through, event-driven |
| **Eviction Policies** | LRU, LFU |
| **Fault Tolerance** | Node failure detection, recovery |
| **Design Patterns** | Strategy, Observer, Factory, Singleton, Adapter, Proxy, Command |

---

## Benchmark Preview

```
Test: 100,000 keys, 5 nodes

Naive Hashing (key % N):
  Thêm 1 node → 80% keys bị redistribute

Consistent Hashing:
  Thêm 1 node → chỉ ~20% keys bị redistribute

→ Ít hơn 4 lần data movement
```

---

## License

MIT
