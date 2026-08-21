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
│   │   ├── consistent-hashing.ts
│   │   ├── node.ts
│   │   ├── cluster.ts
│   │   └── replication.ts
│   ├── strategies/                # Cache strategies
│   │   ├── lru.ts
│   │   ├── lfu.ts
│   │   └── ttl.ts
│   ├── server/                    # Network layer
│   │   ├── cache-server.ts
│   │   ├── protocol.ts
│   │   └── client.ts
│   └── visualization/            # Frontend
│       ├── hash-ring.tsx
│       └── dashboard.tsx
│
├── docs/
│   ├── core/                      # Core concepts
│   │   ├── concepts.md           # Giải thích khái niệm
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
│   └── design-patterns.md        # Design patterns
│
├── agent/                         # Development workflow
│   ├── COMMIT_CONVENTION.md
│   ├── GIT_WORKFLOW.md
│   ├── CODE_STYLE.md
│   └── PR_TEMPLATE.md
│
├── tests/
├── package.json
├── tsconfig.json
├── AGENTS.md
└── README.md
```

---

## Documentation

### Core Concepts

| File | Nội dung |
|---|---|
| [concepts.md](docs/core/concepts.md) | Giải thích toàn bộ khái niệm distributed systems |
| [consistent-hashing.md](docs/core/consistent-hashing.md) | Deep dive: hash ring, virtual nodes |
| [replication.md](docs/core/replication.md) | Deep dive: primary/replica, leader election |
| [cache-invalidation.md](docs/core/cache-invalidation.md) | Deep dive: TTL, write-through, event-driven |

### Architecture

| File | Nội dung |
|---|---|
| [architecture.md](docs/architecture/architecture.md) | Component diagram, data flow, design decisions |
| [tech-stack.md](docs/architecture/tech-stack.md) | Technology choices và lý do |

### Design

| File | Nội dung |
|---|---|
| [design-system.md](docs/design-system.md) | Quy chuẩn thiết kế, naming, code structure |
| [design-patterns.md](docs/design-patterns.md) | Strategy, Observer, Factory, Singleton... |

### Guides

| File | Nội dung |
|---|---|
| [setup.md](docs/guides/setup.md) | Hướng dẫn cài đặt và sử dụng |
| [contributing.md](docs/guides/contributing.md) | Quy trình contribution |

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
