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

## Trạng thái hiện tại

### ✅ Đã có

```
├── Documentation
│   ├── README.md                    ← Bạn đang đọc
│   ├── docs/architecture.md         ← Kiến trúc tổng quan
│   ├── docs/tech-stack.md           ← Technology choices
│   ├── docs/concepts.md             ← Giải thích khái niệm
│   ├── docs/consistent-hashing.md   ← Deep dive hashing
│   ├── docs/replication.md          ← Deep dive replication
│   ├── docs/cache-invalidation.md   ← Deep dive invalidation
│   ├── docs/setup.md                ← Hướng dẫn cài đặt
│   └── docs/contributing.md         ← Quy trình contribution
│
├── Agent Workflow
│   ├── agent/COMMIT_CONVENTION.md   ← Quy tắc commit
│   ├── agent/GIT_WORKFLOW.md        ← Quy trình Git
│   ├── agent/CODE_STYLE.md          ← Quy tắc code
│   └── agent/PR_TEMPLATE.md         ← Template PR
│
└── Infrastructure
    ├── package.json                 ← Dependencies
    ├── tsconfig.json                ← TypeScript config
    └── AGENTS.md                    ← Hướng dẫn cho AI
```

### 🔲 Chưa có (cần implement)

```
├── Core Logic
│   ├── src/core/consistent-hashing.ts  ← TIÊN CHỈ
│   ├── src/core/node.ts
│   ├── src/core/cluster.ts
│   └── src/core/replication.ts
│
├── Cache Strategies
│   ├── src/strategies/lru.ts
│   ├── src/strategies/lfu.ts
│   └── src/strategies/ttl.ts
│
├── Network Layer
│   ├── src/server/cache-server.ts
│   ├── src/server/protocol.ts
│   └── src/server/client.ts
│
├── Visualization
│   ├── src/visualization/hash-ring.tsx
│   └── src/visualization/dashboard.tsx
│
├── Benchmark
│   ├── src/benchmark/throughput.ts
│   └── src/benchmark/data-movement.ts
│
└── Tests
    ├── tests/consistent-hashing.test.ts
    ├── tests/replication.test.ts
    └── tests/cluster.test.ts
```

---

## Tech Stack

| Layer | Công nghệ | Lý do chọn |
|---|---|---|
| **Language** | TypeScript | Type safety, IDE support, ecosystem |
| **Runtime** | Node.js | Non-blocking I/O, phù hợp network services |
| **Network** | TCP sockets | Giao tiếp node-to-node, không phụ thuộc framework |
| **Frontend** | React + Canvas | Visualization hash ring interactive |
| **ORM** | Không dùng | In-memory cache, không cần DB cho core |
| **Testing** | Jest | Industry standard, mocking tốt |
| **Build** | tsup | Bundle nhanh, ES modules support |
| **Monorepo** | npm workspaces | Quản lý multiple packages |

> Chi tiết lý do chọn từng công nghệ: [docs/tech-stack.md](docs/tech-stack.md)

---

## Cấu trúc thư mục

```
distributed-cache/
├── src/
│   ├── core/                      # Core logic
│   │   ├── consistent-hashing.ts  # Hash ring implementation
│   │   ├── node.ts                # Cache node logic
│   │   ├── cluster.ts             # Cluster management
│   │   └── replication.ts         # Data replication
│   │
│   ├── strategies/                # Cache strategies
│   │   ├── lru.ts                 # Least Recently Used
│   │   ├── lfu.ts                 # Least Frequently Used
│   │   └── ttl.ts                 # Time-To-Live
│   │
│   ├── server/                    # Network layer
│   │   ├── cache-server.ts        # TCP server
│   │   ├── protocol.ts            # Wire protocol
│   │   └── client.ts              # Client library
│   │
│   ├── visualization/             # Frontend
│   │   ├── hash-ring.tsx          # Hash ring renderer
│   │   └── dashboard.tsx          # Metrics dashboard
│   │
│   └── benchmark/                 # Performance testing
│       ├── throughput.ts          # Ops per second
│       └── data-movement.ts       # Keys moved
│
├── tests/                         # Unit tests
│   ├── consistent-hashing.test.ts
│   ├── replication.test.ts
│   └── cluster.test.ts
│
├── docs/                          # Tài liệu
│   ├── architecture.md            # Kiến trúc tổng quan
│   ├── tech-stack.md              # Technology choices
│   ├── concepts.md                # Giải thích khái niệm
│   ├── consistent-hashing.md      # Deep dive
│   ├── replication.md             # Deep dive
│   ├── cache-invalidation.md      # Deep dive
│   ├── setup.md                   # Hướng dẫn cài đặt
│   └── contributing.md            # Quy trình contribution
│
├── agent/                         # Development workflow
│   ├── COMMIT_CONVENTION.md       # Quy tắc commit
│   ├── GIT_WORKFLOW.md            # Quy trình Git
│   ├── CODE_STYLE.md              # Quy tắc code
│   └── PR_TEMPLATE.md             # Template Pull Request
│
├── package.json
├── tsconfig.json
├── AGENTS.md
└── README.md
```

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

| Concept | Kiến thức | Trạng thái |
|---|---|---|
| **Consistent Hashing** | Hash ring, virtual nodes, key distribution | 🔲 Chưa implement |
| **Data Replication** | Primary/replica, failover, leader election | 🔲 Chưa implement |
| **Cache Invalidation** | TTL, write-through, event-driven | 🔲 Chưa implement |
| **Eviction Policies** | LRU, LFU | 🔲 Chưa implement |
| **Fault Tolerance** | Node failure detection, recovery | 🔲 Chưa implement |
| **Benchmarking** | Throughput, latency, data movement | 🔲 Chưa implement |

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

## Docs

| File | Nội dung |
|---|---|
| [architecture.md](docs/architecture.md) | Component diagram, data flow, design decisions |
| [tech-stack.md](docs/tech-stack.md) | Technology choices và lý do |
| [concepts.md](docs/concepts.md) | Giải thích toàn bộ khái niệm distributed systems |
| [consistent-hashing.md](docs/consistent-hashing.md) | Deep dive: hash ring, virtual nodes |
| [replication.md](docs/replication.md) | Deep dive: primary/replica, leader election |
| [cache-invalidation.md](docs/cache-invalidation.md) | Deep dive: TTL, write-through, event-driven |
| [setup.md](docs/setup.md) | Hướng dẫn cài đặt và sử dụng |
| [contributing.md](docs/contributing.md) | Quy trình contribution |

---

## License

MIT
