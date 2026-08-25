# Design System

> Các nguyên tắc và quy chuẩn thiết kế được áp dụng xuyên suốt project. Đọc file này trước khi bắt đầu code để hiểu **tại sao** code được viết theo cách đó.

---

## Mục lục

1. [Nguyên tắc thiết kế](#1-nguyên-tắc-thiết-kế)
2. [Naming Conventions](#2-naming-conventions)
3. [Cấu trúc Code](#3-cấu-trúc-code)
4. [Xử lý lỗi](#4-xử-lý-lỗi)
5. [Logging](#5-logging)
6. [Cấu hình](#6-cấu-hình)
7. [Thiết kế API](#7-thiết-kế-api)

---

## 1. Nguyên tắc thiết kế

### SOLID Principles

| Nguyên tắc | Nghĩa là gì | Áp dụng trong project |
|---|---|---|
| **S**ingle Responsibility | Mỗi class/function làm 1 việc duy nhất | `ConsistentHash` chỉ làm hashing, không làm replication |
| **O**pen/Closed | Mở để thêm mới, đóng để sửa đổi | Thêm eviction policy mới chỉ cần thêm class, không sửa code cũ |
| **L**iskov Substitution | Class con thay thế được class cha | Bất kỳ `EvictionStrategy` nào cũng dùng được trong `CacheNode` |
| **I**nterface Segregation | Chia nhỏ interfaces, không force implement cái không cần | `Readable` và `Writable` riêng, không merge thành 1 interface lớn |
| **D**ependency Inversion | Phụ thuộc vào abstraction, không phải implementation | `CacheNode` phụ thuộc vào `EvictionStrategy` interface, không phụ thuộc vào `LRUStrategy` cụ thể |

### KISS (Keep It Simple, Stupid)

```
✅ VIẾT: Code đơn giản nhất có thể để giải quyết bài toán
✅ VIẾT: 1 function làm 1 việc, đọc 1 lần là hiểu
❌ KHÔNG: Over-engineer với patterns không cần thiết
❌ KHÔNG: Viết code "thông minh" khó hiểu
```

**Ví dụ thực tế:**
- Nếu chỉ cần lưu 1 key-value → dùng `Map<string, Value>`, không cần Redis
- Nếu chỉ cần check TTL → dùng `Date.now() - timestamp > ttl`, không cần timer library

### YAGNI (You Aren't Gonna Need It)

```
✅ VIẾT: Code cho requirement HIỆN TẠI
❌ KHÔNG: Viết cho "có thể cần sau này"

Ví dụ:
- Hiện tại chỉ cần LRU → chỉ implement LRU
- Đừng implement LFU, FIFO, Random... phòng khi cần
- Khi cần →implement sau
```

---

## 2. Naming Conventions

### Files

```
Sử dụng kebab-case cho tất cả files:

✅ consistent-hashing.ts
✅ cache-node.ts
✅ replication-manager.ts
✅ hash-ring.tsx

❌ ConsistentHashing.ts
❌ cacheNode.ts
❌ ReplicationManager.ts
```

**Tại sao kebab-case?**
- Dễ đọc hơn camelCase khi tên dài
- Phổ biến nhất trong Node.js ecosystem
- Compatible với mọi OS (Windows, macOS, Linux)

### Classes

```
Sử dụng PascalCase:

✅ class ConsistentHash { }
✅ class CacheNode { }
✅ class ReplicationManager { }

❌ class consistentHash { }
❌ class cache_node { }
```

### Interfaces

```
Sử dụng PascalCase, KHÔNG cần I prefix:

✅ interface CacheNode { }
✅ interface HashRing { }
✅ interface ReplicationStrategy { }

❌ interface ICacheNode { }
❌ interface IHashRing { }
```

**Tại sao không cần I prefix?**
- TypeScript/JavaScript ecosystem hiện tại đã bỏ I prefix
- Ngắn gọn hơn
- Đọc code dễ phân biệt vì interface không có implementation

### Functions

```
Sử dụng camelCase:

✅ function getNode(key: string): CacheNode { }
✅ function hashValue(value: string): number { }

❌ function GetNode(key: string): CacheNode { }
❌ function get_node(key: string): CacheNode { }
```

### Variables

```
Sử dụng camelCase:

✅ const maxRetries = 3;
✅ const heartbeatInterval = 5000;

❌ const MAX_RETRIES = 3;
❌ const max_retries = 3;
```

### Constants

```
Sử dụng UPPER_SNAKE_CASE cho constants thực sự:

✅ const MAX_CACHE_SIZE = 1024 * 1024;
✅ const DEFAULT_TTL = 60 * 1000;

❌ const maxCacheSize = 1024 * 1024;
❌ const MAXCACHESIZE = 1024 * 1024;
```

**Phân biệt constants và variables:**
- Constants: Giá trị không thay đổi, dùng UPPER_SNAKE_CASE
- Variables: Giá trị có thể thay đổi, dùng camelCase

---

## 3. Cấu trúc Code

### File Structure

```
Mỗi file chỉ export 1 class/function chính:

✅ consistent-hashing.ts → export class ConsistentHash
✅ node.ts → export class CacheNode
✅ cluster.ts → export class ClusterManager

❌ consistent-hashing.ts → export class ConsistentHash + export class HashUtils + export function hash
```

**Tại sao 1 file = 1 class?**
- Dễ tìm: Biết tên class là biết file nào
- Dễ refactor: Di chuyển class chỉ cần move 1 file
- Dễ test: Import 1 file = test 1 class

### Import Order

```
Thứ tự import:

1. Node.js built-in modules
2. External packages (npm)
3. Internal modules (cùng project)

Ví dụ:
1. import { createHash } from 'crypto';
2. import { murmurhash3 } from 'murmurhash';
3. import { CacheNode } from './node';
```

**Tại sao thứ tự này?**
- Built-in modules ổn định nhất
- External packages ổn định hơn internal modules
- Internal modules thay đổi nhiều nhất

### Class Structure

```
Thứ tự trong class:

1. Private properties (state)
2. Constructor (khởi tạo)
3. Public methods (API bên ngoài dùng)
4. Private methods (helper functions)

Ví dụ:
class ConsistentHash {
  // 1. State
  private ring: Map<number, CacheNode>;

  // 2. Khởi tạo
  constructor(config: HashConfig) { ... }

  // 3. API công khai
  getNode(key: string): CacheNode { ... }
  addNode(node: CacheNode): void { ... }

  // 4. Helper functions
  private hash(key: string): number { ... }
  private binarySearch(hash: number): number { ... }
}
```

**Tại sao thứ tự này?**
- Đọc từ trên xuống: biết state trước, biết cách dùng sau
- Public methods ở giữa → dễ tìm khi đọc API
- Private methods ở cuối → chi tiết implementation

---

## 4. Xử lý lỗi

### Custom Errors

```
Tạo custom error cho MỖI loại lỗi cụ thể:

- NodeNotFoundError: Không tìm thấy node
- ConnectionTimeoutError: Kết nối timeout
- ClusterQuorumError: Không đủ nodes để bầu leader
- InvalidKeyError: Key không hợp lệ
- CacheFullError: Cache đầy, không còn chỗ

Tại sao custom error?
- Dễ debug: Biết ngay lỗi gì
- Dễ handle: Catch từng loại error riêng
- Dễ test: Kiểm tra từng error case
```

### Error Handling Rules

```
1. KHÔNG swallow errors:
   try { ... } catch (e) { /* bỏ qua */ }  // ❌
   try { ... } catch (e) { throw e; }      // ✅

2. Handle cụ thể từng loại:
   catch (error) {
     if (error instanceof ConnectionTimeoutError) {
       // Xử lý timeout
     } else {
       throw error; // Lỗi khác → throw lên trên
     }
   }

3. Luôn log error:
   catch (error) {
     logger.error('Replication failed', { error, nodeId });
     throw error;
   }
```

---

## 5. Logging

### Log Levels

```
DEBUG → Thông tin debug, chỉ xem khi development
INFO  → Thông tin chung: node added, request received
WARN  → Cảnh báo: timeout, retry
ERROR → Lỗi nghiêm trọng: crash, data loss
```

**Khi nào dùng level nào?**
- `DEBUG`: "Received GET request for key user:123"
- `INFO`: "Node node-1 added to cluster"
- `WARN`: "Connection timeout to node-3, retrying..."
- `ERROR`: "Failed to replicate data, quorum lost"

### Log Format

```
Sử dụng structured logging (JSON format):

✅ logger.info('Node added', { nodeId: 'node-1', totalNodes: 3 })
❌ console.log('Node added')

Tại sao structured logging?
- Dễ search/filter khi có nhiều logs
- Dễ integrate với logging services (ELK, Datadog)
- Có timestamp, context tự động
```

---

## 6. Cấu hình

### Configuration Rules

```
1. Sử dụng environment variables cho cấu hình
2. Có default values hợp lý
3. Document trong .env.example

Ví dụ:
- MAX_CACHE_SIZE: Giới hạn RAM (default: 1MB)
- HEARTBEAT_INTERVAL: Tần suất ping (default: 5s)
- REPLICATION_FACTOR: Số replicas (default: 3)
```

### Config Categories

```
Cache Config:
  → maxCacheSize: RAM limit per node
  → defaultTTL: Thời gian sống mặc định
  → evictionPolicy: LRU, LFU, FIFO
  → sweepIntervalMs: TTL cleanup interval (default 30s, 0=off)
  → onEvicted: callback khi key bị xóa (dùng để sync external tracking)

Network Config:
  → host: IP address
  → port: Port number
  → timeout: Connection timeout

Replication Config:
  → replicationFactor: Số replicas per key
  → syncInterval: Tần suất sync data

Cluster Config:
  → heartbeatInterval: Tần suất ping
  → heartbeatTimeout: Thời gian chờ trước khi coi node died
  → virtualNodes: Số virtual nodes trên hash ring
```

---

## 7. Thiết kế API

### REST API (Client-facing)

```
Dùng cho client interactions:

GET    /api/nodes          → Liệt kê tất cả nodes
GET    /api/nodes/:id      → Chi tiết 1 node
GET    /api/stats          → Thống kê cluster
GET    /api/health         → Health check

Tại sao REST?
- Phổ biến nhất, dễ hiểu
- Tooling tốt (curl, Postman, browser)
- Easy to cache
```

### TCP Protocol (Node-to-node)

```
Dùng cho inter-node communication:

SET <key> <value> [TTL]    → Lưu key-value
GET <key>                  → Lấy value
DEL <key>                  → Xóa key
PING                       → Heartbeat
REPLICATE <key> <value>    → Replicate data

Tại sao TCP?
- Ít overhead hơn HTTP
- Persistent connections
- Phù hợp cho high-frequency communication
```

---

## Tóm tắt

| Nguyên tắc | Tại sao quan trọng | Áp dụng |
|---|---|---|
| **SOLID** | Code dễ maintain, dễ extend | Mỗi class 1 responsibility |
| **KISS** | Code dễ hiểu, dễ debug | Viết đơn giản nhất có thể |
| **YAGNI** | Không over-engineer | Code cho requirement hiện tại |
| **Naming** | Dễ đọc, dễ tìm | kebab-case files, PascalCase classes |
| **Errors** | Dễ debug, dễ handle | Custom error classes, không swallow |
| **Logging** | Dễ debug production issues | Structured logging, không console.log |
| **Config** | Dễ thay đổi môi trường | Environment variables |
