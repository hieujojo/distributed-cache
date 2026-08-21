# Distributed Cache System

> Hệ thống cache phân tán đơn giản hóa được xây dựng từ đầu bằng TypeScript, mô phỏng cách Redis hoạt động.

## Tổng quan

Hầu hết developer chỉ **sử dụng** Redis mà không **hiểu** nó hoạt động thế nào. Project này implement các cơ chế cốt lõi đằng sau cache phân tán — consistent hashing, replication, cache invalidation — để thể hiện tư duy về distributed systems.

### Các tính năng chính

| Tính năng | Mô tả |
|---|---|
| **Consistent Hashing** | Phân phối data trên ring, thêm/xóa node chỉ ảnh hưởng ~1/N keys |
| **Data Replication** | Nhân bản data, leader election tự động khi node dies |
| **Cache Invalidation** | TTL, write-through, event-driven invalidation |
| **Eviction Policies** | LRU, LFU khi cache đầy |
| **Visualization** | Hiển thị hash ring real-time trên browser |
| **Benchmark** | Đo throughput, latency, data movement |

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
│   │   ├── ttl.ts                 # Time-To-Live
│   │   └── write-through.ts       # Write-through
│   │
│   ├── server/                    # Network layer
│   │   ├── cache-server.ts        # TCP server
│   │   ├── protocol.ts            # Wire protocol
│   │   └── client.ts              # Client library
│   │
│   ├── visualization/             # Frontend
│   │   ├── hash-ring.tsx          # Hash ring renderer
│   │   ├── node-map.tsx           # Node status
│   │   └── dashboard.tsx          # Metrics dashboard
│   │
│   └── benchmark/                 # Performance testing
│       ├── throughput.ts          # Ops per second
│       ├── latency.ts             # Response time
│       └── data-movement.ts       # Keys moved
│
├── tests/                         # Unit tests
│   ├── consistent-hashing.test.ts
│   ├── replication.test.ts
│   ├── cache-invalidation.test.ts
│   └── cluster.test.ts
│
├── docs/                          # Tài liệu
│   ├── architecture.md            # Kiến trúc tổng quan
│   ├── tech-stack.md              # Technology choices
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
├── benchmark/
│   └── results/                   # Kết quả benchmark
│
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint + Test + Build
│       └── benchmark.yml          # Performance benchmark
│
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

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
npm run dev
```

## Learning Outcomes

| Concept | Kiến thức |
|---|---|
| **Consistent Hashing** | Hash ring, virtual nodes, key distribution |
| **Data Replication** | Primary/replica, failover, leader election |
| **Cache Invalidation** | TTL, write-through, event-driven |
| **Eviction Policies** | LRU, LFU |
| **Fault Tolerance** | Node failure detection, recovery |
| **Benchmarking** | Throughput, latency, data movement |

## Benchmark Preview

```
Test: 100,000 keys, 5 nodes

Naive Hashing (key % N):
  Thêm 1 node → 80% keys bị redistribute

Consistent Hashing:
  Thêm 1 node → chỉ ~20% keys bị redistribute

→ Ít hơn 4 lần data movement
```

## License

MIT
