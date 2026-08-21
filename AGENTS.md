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
│   │   ├── consistent-hashing.ts  # Hash ring + virtual nodes
│   │   ├── node.ts               # Cache node
│   │   ├── cluster.ts            # Cluster management
│   │   └── replication.ts        # Data replication
│   ├── strategies/               # Cache strategies
│   │   ├── lru.ts                # Least Recently Used
│   │   ├── lfu.ts                # Least Frequently Used
│   │   └── ttl.ts                # Time-To-Live
│   ├── server/                   # Network layer
│   │   ├── cache-server.ts       # TCP server
│   │   ├── protocol.ts           # Wire protocol
│   │   └── client.ts             # Client library
│   ├── visualization/            # Frontend
│   │   ├── hash-ring.tsx         # Hash ring renderer
│   │   └── dashboard.tsx         # Metrics dashboard
│   └── benchmark/                # Performance testing
│       ├── throughput.ts
│       └── data-movement.ts
├── tests/                        # TESTS (chưa tạo)
├── docs/                         # DOCUMENTATION (đã có)
├── agent/                        # DEVELOPMENT WORKFLOW (đã có)
├── package.json                  # (chưa tạo)
└── tsconfig.json                 # (chưa tạo)
```

---

## Bắt đầu từ đâu?

### Fase 1: Infrastructure (trước khi code)

```bash
# 1. Tạo package.json
npm init -y

# 2. Install dependencies
npm install typescript tsup jest @types/jest ts-jest

# 3. Tạo tsconfig.json
npx tsc --init

# 4. Tạo cấu trúc thư mục
mkdir -p src/{core,strategies,server,visualization,benchmark}
mkdir -p tests
```

### Fase 2: Code theo thứ tự

```
1. src/core/consistent-hashing.ts  ← BẮT ĐẦU TỪ ĐÂY
   → Implement hash ring
   → Implement virtual nodes
   → Thêm tests

2. src/core/node.ts
   → Cache node với get/set/delete
   → Thêm LRU eviction
   → Thêm TTL

3. src/core/cluster.ts
   → Cluster management
   → Node discovery
   → Health check

4. src/core/replication.ts
   → Primary-replica sync
   → Leader election
   → Failover

5. src/server/cache-server.ts
   → TCP server
   → Protocol parser
   → Client library

6. src/visualization/
   → React + Canvas hash ring
   → Dashboard metrics

7. src/benchmark/
   → Throughput test
   → Data movement comparison
```

---

## Coding Conventions

### TypeScript

```typescript
// 1. Luôn dùng TypeScript strict mode
// tsconfig.json: "strict": true

// 2. Named exports (không default exports)
export class ConsistentHash { ... }
export function hash(key: string): number { ... }

// 3. Interface cho mỗi class
interface CacheNode {
  id: string;
  host: string;
  port: number;
}

// 4. JSDoc cho mọi public API
/**
 * Phân phối key lên hash ring
 * @param key - Key cần tìm node
 * @returns Node chịu trách nhiệm cho key
 */
getNode(key: string): CacheNode { ... }

// 5. Error handling với custom errors
class NodeNotFoundError extends Error { ... }
class ConnectionTimeoutError extends Error { ... }
```

### Testing

```typescript
// 1. Test file naming: <file>.test.ts
// consistent-hashing.test.ts

// 2. Describe blocks theo function/method
describe('ConsistentHash', () => {
  describe('getNode', () => {
    it('should return same node for same key', () => { ... });
    it('should distribute keys evenly', () => { ... });
  });
});

// 3. Mock external dependencies
jest.mock('tcp-server', () => ({ ... }));

// 4. Coverage target: >= 80%
```

### Commit Messages

```
<type>(<scope>): <subject>

Types: feat, fix, docs, test, bench, refactor, style, chore
Scopes: core, server, strategy, vis, docs, agent

Example:
feat(core): add consistent hashing implementation
```

---

## Design Decisions

### Tại sao TCP thay vì HTTP?

```
TCP:
  + Lower overhead
  + Persistent connections
  + Phù hợp cho inter-node communication

HTTP:
  + Tooling tốt hơn (curl, Postman)
  + Dễ debug hơn

Decision: Dùng TCP cho node-to-node
         Có thể thêm HTTP cho client-facing API
```

### Tại sao In-Memory?

```
In-Memory:
  + Rất nhanh (nanoseconds)
  + Phù hợp cho cache (temporary data)
  - Giới hạn bởi RAM

Disk:
  + Persistent
  + Capacity lớn hơn
  - Chậm hơn

Decision: Cache = temporary data → In-memory phù hợp nhất
```

### Tại sao không dùng Redis?

```
Redis:
  + Production-ready
  + Feature-rich

Build from scratch:
  + Hiểu nguyên lý hoạt động
  + Control hoàn toàn
  + Educational value

Decision: Build from scratch để học
```

---

## Kiến thức cần hiểu

### Distributed Systems

```
1. CAP Theorem
   → Consistency, Availability, Partition tolerance
   → Chọn 2 trong 3

2. Consistent Hashing
   → Hash ring
   → Virtual nodes
   → Minimal data movement

3. Replication
   → Primary-Replica
   → Synchronous vs Async
   → Leader election

4. Fault Tolerance
   → Heartbeat detection
   → Automatic failover
   → Split brain prevention
```

### Design Patterns

```
1. Strategy Pattern (eviction policies)
2. Observer Pattern (event-driven)
3. Factory Pattern (create nodes)
4. Singleton (cluster manager)
```

---

## Common Tasks

### Thêm feature mới

```bash
# 1. Tạo branch
git checkout -b feature/<name>

# 2. Code
# Viết code trong src/

# 3. Test
npm test

# 4. Commit
git add .
git commit -m "feat(<scope>): <description>"
```

### Fix bug

```bash
# 1. Viết test reproducing bug
# 2. Fix code
# 3. Verify test passes
# 4. Commit
git commit -m "fix(<scope>): <description>"
```

### Chạy tests

```bash
# Tất cả tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

---

## Troubleshooting

### TypeScript compilation error

```bash
# Kiểm tra TypeScript version
npx tsc --version

# Check errors
npx tsc --noEmit
```

### Test fails

```bash
# Chạy 1 test file
npx jest tests/consistent-hashing.test.ts

# Debug mode
npx jest --inspect-brk tests/file.test.ts
```

### Port conflict

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```
