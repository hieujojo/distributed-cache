# Giải thích Toàn bộ Khái niệm

> File này giải thích **tất cả** các khái niệm liên quan đến distributed systems được sử dụng trong project. Đọc file này trước khi bắt đầu code.

---

## Mục lục

1. [Cache là gì?](#1-cache-là-gì)
2. [Distributed Cache là gì?](#2-distributed-cache-là-gì)
3. [Hashing](#3-hashing)
4. [Consistent Hashing](#4-consistent-hashing)
5. [Virtual Nodes](#5-virtual-nodes)
6. [Data Replication](#6-data-replication)
7. [Primary-Replica](#7-primary-replica)
8. [Leader Election](#8-leader-election)
9. [Heartbeat](#9-heartbeat)
10. [Failover](#10-failover)
11. [Split Brain](#11-split-brain)
12. [CAP Theorem](#12-cap-theorem)
13. [Cache Invalidation](#13-cache-invalidation)
14. [TTL (Time-To-Live)](#14-ttl-time-to-live)
15. [Eviction Policies](#15-eviction-policies)
16. [Write Strategies](#16-write-strategies)
17. [Event-Driven Architecture](#17-event-driven-architecture)

---

## 1. Cache là gì?

### Định nghĩa

Cache là **bộ nhớ tạm thời** lưu trữ data thường xuyên truy cập để truy cập nhanh hơn.

### Ví dụ đơn giản

```
Database (chậm):           Cache (nhanh):
─────────────────          ──────────────
Query SQL: 50ms            Get value: 0.1ms
Disk I/O: 10ms             Memory read: 0.01ms
Network: 20ms              Local access: 0.001ms

Tổng: ~80ms                Tổng: ~0.1ms
```

### Tại sao cần cache?

```
1. Giảm latency:    Đọc từ RAM nhanh gấp 100,000 lần so với disk
2. Giảm load:       Database chỉ nhận query khi cache miss
3. Tăng throughput:  Xử lý được nhiều requests hơn
```

### Cache hoạt động thế nào?

```
Client muốn đọc data:

1. Check cache trước (nhanh)
   ├── Cache HIT  → Return data ngay (0.1ms)
   └── Cache MISS → Query database (80ms) → Lưu vào cache → Return

2. Client muốn ghi data:
   ├── Ghi vào database
   └── Xóa/invalidate cache (để data mới được đọc lần sau)
```

---

## 2. Distributed Cache là gì?

### Vấn đề của cache đơn (single cache)

```
Single Cache:
  + Đơn giản
  - Giới hạn bởi 1 server (RAM server: 16GB, 32GB...)
  - Server down → mất hết cache
  - Không scale được

Distributed Cache:
  + Nhiều servers share cache
  + Scale được (thêm server = thêm RAM)
  + Fault tolerance (server down vẫn có server khác)
  + Load balancing (phân phối requests)
```

### Ví dụ: Redis Cluster

```
                    ┌─────────┐
Client ───────────→│  Node 1 │ ──→ data_A, data_B
                    └─────────┘
                    ┌─────────┐
Client ───────────→│  Node 2 │ ──→ data_C, data_D
                    └─────────┘
                    ┌─────────┐
Client ───────────→│  Node 3 │ ──→ data_E, data_F
                    └─────────┘

→ 3 nodes, mỗi node chứa 1 phần data
→ Nếu Node 1 down, vẫn có Node 2, 3
```

### Câu hỏi lớn: Phân phối data thế nào?

```
Vấn đề: Có 1000 keys, 3 nodes
→ Node nào chứa key nào?

Cách 1: Random → Không determinist, khó tìm lại
Cách 2: Round-robin → Không cân bằng khi nodes khác nhau
Cách 3: Modular hashing → Dễ redistribute khi thêm node
Cách 4: Consistent hashing → Ít redistribute nhất
```

---

## 3. Hashing

### Hash Function là gì?

```
Hash function: Input bất kỳ → Output cố định (hash value)

Ví dụ:
  hash("user:123") → 847293
  hash("product:456") → 193847
  hash("order:789") → 582736

Properties:
  1. Deterministic: cùng input → cùng output
  2. Fast: tính hash nhanh
  3. Uniform: output phân bố đều
  4. Avalanche: input thay đổi nhỏ → output thay đổi lớn
```

### Modular Hashing (Cách truyền thống)

```
Phân phối key lên N nodes:

node_index = hash(key) % N

Ví dụ:
  hash("user:123") = 847293
  N = 3 nodes

  node_index = 847293 % 3 = 0 → Node 0
```

### Vấn đề của Modular Hashing

```
Khi thêm node mới (N = 3 → N = 4):

Trước (N=3):
  hash("user:123") % 3 = 0 → Node 0
  hash("product:456") % 3 = 1 → Node 1
  hash("order:789") % 3 = 2 → Node 2
  hash("item:101") % 3 = 0 → Node 0
  hash("item:202") % 3 = 1 → Node 1

Sau (N=4):
  hash("user:123") % 4 = 1 → Node 1 (CHANGED!)
  hash("product:456") % 4 = 3 → Node 3 (CHANGED!)
  hash("order:789") % 4 = 1 → Node 1 (CHANGED!)
  hash("item:101") % 4 = 1 → Node 1 (CHANGED!)
  hash("item:202") % 4 = 2 → Node 2 (CHANGED!)

→ Gần như TẤT CẢ keys đều bị redistribute!
→ Phải copy data từ node cũ sang node mới → rất chậm
```

---

## 4. Consistent Hashing

### Ý tưởng cốt lõi

```
Thay vì dùng modular hashing, dùng HASH RING:

                    0
                    │
            ┌───────┴───────┐
            │               │
     Node 2 ─              ─ Node 1
            │               │
            └───────┬───────┘
                    │
                  max

Hash function map cả KEY và NODE lên cùng 1 ring.
Key được gán cho node gần nhất theo chiều kim đồng hồ.
```

### How it works

```
1. Hash tất cả nodes lên ring:
   hash("Node1") → vị trí 120°
   hash("Node2") → vị trí 240°
   hash("Node3") → vị trí 0°

2. Hash key cần tìm node:
   hash("user:123") → vị trí 90°

3. Tìm node gần nhất theo chiều kim đồng hồ:
   90° → 120° (Node1) → user:123 thuộc Node1
```

### Khi thêm node mới

```
Trước (3 nodes):
  Node1 (120°), Node2 (240°), Node3 (0°)

Thêm Node4 tại 180°:

Chỉ keys từ 120° đến 180° (chiếm ~1/6 ring) bị chuyển sang Node4
Còn lại giữ nguyên!

→ Thêm 1 node = chỉ ~1/N keys bị ảnh hưởng
→ So với modular hashing: ~100% keys bị ảnh hưởng
```

### Khi xóa node

```
Xóa Node1 (120°):

Keys của Node1 (từ 240° đến 120°) sẽ được chuyển sang Node2
→ Chỉ 1 phần keys bị ảnh hưởng
```

### Implementation

```typescript
class ConsistentHash {
  private ring: Map<number, Node> = new Map();
  private sortedPositions: number[] = [];

  getNode(key: string): Node {
    const hash = this.hash(key);
    // Tìm node gần nhất theo chiều kim đồng hồ
    const position = this.binarySearch(hash);
    return this.ring.get(this.sortedPositions[position])!;
  }

  private hash(key: string): number {
    // Dùng MD5 hoặc MurmurHash
    return murmurhash3(key) % MAX_VALUE;
  }

  private binarySearch(hash: number): number {
    // O(log N) - tìm node gần nhất
  }
}
```

---

## 5. Virtual Nodes

### Vấn đề: Load không cân bằng

```
Nếu mỗi node chỉ có 1 vị trí trên ring:

Ring:
  0°──────120°──────240°──────360°
  Node3    Node1    Node2

Nếu "user:123" hash = 90° → thuộc Node1
Nếu "user:456" hash = 91° → thuộc Node1
Nếu "user:789" hash = 92° → thuộc Node1

→ Node1 có thể bị overload nếu nhiều keys nằm gần 120°
```

### Giải pháp: Virtual Nodes

```
Mỗi physical node có N virtual nodes trên ring:

Node1_v1 (40°), Node1_v2 (160°), Node1_v3 (280°)
Node2_v1 (80°), Node2_v2 (200°), Node2_v3 (320°)
Node3_v1 (120°), Node3_v2 (240°), Node3_v3 (0°)

→ Keys phân bố đều hơn
→ Thêm/xóa node vẫn minimal data movement
```

### Số lượng virtual nodes

```
Ít (10-50):     Ít cân bằng, ít memory
Trung bình (100-200): Cân bằng tốt
Nhiều (500-1000): Rất cân bằng, nhiều memory

Project này dùng: 150 virtual nodes (default)
```

---

## 6. Data Replication

### Định nghĩa

Replication = **Copy data từ 1 node sang nhiều nodes** khác

### Tại sao cần replication?

```
Single node:
  + Đơn giản
  - Node down → MẤT HẾT DATA
  - Không có redundancy

Replicated:
  + Node down → vẫn có bản copy
  + Có thể serve requests từ nhiều nodes
  + Tăng availability
```

### Các loại replication

```
1. Synchronous (đồng bộ):
   ┌─────────┐         ┌─────────┐
   │ Primary │────────→│ Replica │
   │         │←────────│         │
   └─────────┘  ack    └─────────┘

   → Primary đợi replica confirm trước khi trả lời client
   + Data consistent
   - Chậm hơn

2. Async (bất đồng bộ):
   ┌─────────┐         ┌─────────┐
   │ Primary │────────→│ Replica │
   │         │         │         │
   └─────────┘         └─────────┘
      │
      ▼
   Trả lời client ngay

   → Primary không đợi replica
   + Nhanh hơn
   - Có thể mất data nếu primary chết trước khi sync

3. Hybrid (kết hợp):
   → Sync với 1 replica, async với còn lại
   → Balance giữa consistency và performance
```

---

## 7. Primary-Replica

### Định nghĩa

```
Primary (Leader):
  → Nhận TẤT CẢ write requests
  → Sync data sang replicas
  → Quản lý replication

Replica (Follower):
  → Nhận data từ primary
  → Serve read requests (optional)
  → Stand by nếu primary die
```

### Flow

```
Write:
  Client → Primary → Write to memory → Sync to Replicas → ACK

Read:
  Client → Primary (hoặc Replica) → Read from memory → Return

Failover:
  Primary dies → One replica promoted to Primary → Continue
```

### Quy tắc

```
1. Only primary can write (single writer)
2. Replicas are read-only (unless specified)
3. If primary dies, elect new primary
4. If replica dies, primary creates new replica
```

---

## 8. Leader Election

### Vấn đề

```
Primary node dies → Ai sẽ là primary mới?

Cần 1 algorithm để nodes bầu leader mới.
```

### Bully Algorithm (đơn giản nhất)

```
1. Khi node phát hiện primary down:
   → Gửi message "ELECTION" đến nodes có ID lớn hơn

2. Nếu node có ID lớn hơn trả lời:
   → Nhận "I AM ALIVE" → không bầu nữa

3. Nếu không ai trả lời:
   → Tự becoming primary
   → Gửi message "I AM NEW LEADER"

4. Khi nhận "I AM NEW LEADER":
   → Acknowledge → implement new primary
```

### Vấn đề: Split Brain

```
Có thể xảy ra trường hợp:

Node A: "Tôi là leader"
Node B: "Không, tôi là leader"
→ Cả 2 đều ghi data → DATA INCONSISTENCY!

Giải pháp: Majority Quorum
→ Cần majority (N/2 + 1) nodes đồng ý
→ Nếu 5 nodes, cần 3 nodes đồng ý
```

---

## 9. Heartbeat

### Định nghĩa

Heartbeat = **Tín hiệu định kỳ** nodes gửi cho nhau để xác nhận còn sống

### Cách hoạt động

```
Primary ──heartbeat──→ Replica (mỗi 5 giây)
Primary ──heartbeat──→ Replica
Primary ──heartbeat──→ Replica

Nếu Replica không nhận heartbeat trong 15 giây:
→ Coi primary đã die → Start leader election
```

### Timeout

```
Heartbeat interval:  5 giây (gửi mỗi 5s)
Timeout:             15 giây (nếu 15s không nhận → coi như die)

Lý do timeout > interval:
  → Network có thể delay
  → Không muốn false positive (tưởng die nhưng không die)
```

---

## 10. Failover

### Định nghĩa

Failover = **Chuyển service sang node khác** khi node chính bị lỗi

### Types

```
1. Automatic Failover:
   → Hệ thống tự phát hiện và chuyển
   → Cần leader election algorithm

2. Manual Failover:
   → Admin manually switch
   → An toàn hơn nhưng chậm

3. Graceful Failover:
   → Node chủ động stop trước khi chuyển
   → Không mất request

Project này: Automatic failover với heartbeat detection
```

---

## 11. Split Brain

### Định nghĩa

Split Brain = **Nhiều nodes都认为各自是primary**导致数据不一致**

### Ví dụ

```
Network partition xảy ra:

  Node A ←──X──→ Node B
  (không kết nối được)

  Node A: "Mất connection với Node B, tôi là leader"
  Node B: "Mất connection với Node A, tôi là leader"

  Cả 2 đều ghi data → DATA INCONSISTENCY!
```

### Giải pháp

```
1. Majority Quorum:
   → Cần majority nodes đồng ý
   → 5 nodes: cần 3 nodes
   → Nếu chỉ có 2 nodes: KHÔNG bầu leader

2. Fencing Token:
   → Mỗi lần elect leader, tăng token
   → Old leader có token cũ → bị reject

3. Lease:
   → Leader có lease (thời hạn)
   → Phải renew trước khi hết hạn
   → Nếu partition → lease hết hạn → old leader stop
```

---

## 12. CAP Theorem

### Định nghĩa

```
Distributed system không thể simultaneously có:

C - Consistency:      Mọi node đều thấy data mới nhất
A - Availability:     Mọi request đều được trả lời
P - Partition tolerant: Hệ thống hoạt động khi network partition

Chỉ chọn 2 trong 3:
  CP: Consistent + Partition tolerant (牺牲 availability)
  AP: Available + Partition tolerant (牺牲 consistency)
  CA: Consistent + Available (không partition tolerant → useless)
```

### Ví dụ

```
Redis Cluster: AP (available, partition tolerant)
  → Có thể stale data, nhưng luôn trả lời

ZooKeeper: CP (consistent, partition tolerant)
  → Có thể không available, nhưng data luôn consistent

Project này: AP
  → Focus availability, tolerate eventual consistency
```

---

## 13. Cache Invalidation

### Vấn đề

```
Database có data mới, nhưng cache vẫn giữ data cũ.
→ User đọc cache → thấy data sai
```

### 2 khó khăn lớn nhất trong CS

```
Phil Karlton:
"There are only two hard things in Computer Science:
 cache invalidation and naming things"

Cache invalidation khó vì:
1. Khi nào invalidate?
2. Invalidate cache nào?
3. Invalidate trên tất cả nodes?
4. Xử lý race condition?
```

### Strategies

```
1. Time-based (TTL):
   → Mỗi key có expiration time
   → Hết hạn → tự xóa
   + Đơn giản
   - Có thể stale trước khi hết hạn

2. Event-driven:
   → Khi DB thay đổi → gửi event → invalidate cache
   → Luôn fresh
   - Phức tạp hơn

3. Write-through:
   → Ghi cache TRƯỚC, rồi ghi DB
   → Cache luôn consistent
   - Viết chậm hơn

4. Write-back:
   → Ghi cache trước, ghi DB sau (deferred)
   → Viết nhanh
   - Có thể mất data nếu crash
```

---

## 14. TTL (Time-To-Live)

### Định nghĩa

TTL = **Thời gian sống** của 1 key trong cache

### Cách hoạt động

```
SET user:123 "John" TTL=60s

T=0s:   Set key, TTL=60s
T=30s:  Get user:123 → "John" (TTL=30s còn lại)
T=60s:  Get user:123 → null (expired)

Implementation:
  → Dùng timer/interval check mỗi giây
  → Hoặc lazy expiration (check khi get)
```

### Lazy vs Active Expiration

```
Lazy:
  → Chỉ check TTL khi GET key
  + Tiết kiệm CPU
  - Có thể expired nhưng vẫn trong memory

Active:
  → Background thread check định kỳ
  + Expired keys bị xóa ngay
  - Tốn CPU hơn

Project này: Lazy (đơn giản hơn)
```

---

## 15. Eviction Policies

### Vấn đề

```
Cache đầy → Không còn chỗ → Phải xóa bớt data
→ Xóa cái nào?
```

### Các Policies

```
1. LRU (Least Recently Used):
   → Xóa key ít được truy cập nhất
   → Phổ biến nhất
   + Phù hợp cho most workloads
   - Có thể xóa hot key nếu暂时 không dùng

2. LFU (Least Frequently Used):
   → Xóa key ít được truy cập nhất (tần suất)
   + Đánh giá đúng frequency
   - Mới thêm khó có frequency cao
   - Không thích ứng với pattern thay đổi

3. FIFO (First In First Out):
   → Xóa key cũ nhất
   + Đơn giản nhất
   - Không quan tâm access pattern

4. Random:
   → Xóa random key
   + O(1)
   - Không optimize

5. TTL-based:
   → Xóa key hết hạn trước
   + Đơn giản
   - Có thể xóa key vẫn còn useful
```

### Implementation

```typescript
// LRU Cache
class LRUCache {
  private cache: Map<string, Value>;
  private accessOrder: string[]; // Track access order

  get(key: string): Value | null {
    if (!this.cache.has(key)) return null;

    // Move to front (most recently used)
    this.moveToFront(key);

    return this.cache.get(key);
  }

  set(key: string, value: Value): void {
    if (this.isFull()) {
      // Evict least recently used
      const lruKey = this.accessOrder.pop()!;
      this.cache.delete(lruKey);
    }

    this.cache.set(key, value);
    this.moveToFront(key);
  }

  private moveToFront(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.unshift(key);
  }
}
```

---

## 16. Write Strategies

### Write-through

```
Client → Cache → Database

1. Ghi vào cache
2. Cache ghi vào database
3. Cache confirm với client

+ Cache luôn consistent
+ Read từ cache luôn fresh
- Viết chậm hơn (phải ghi 2 nơi)
```

### Write-back (Write-behind)

```
Client → Cache → (deferred) Database

1. Ghi vào cache
2. Cache confirm với client NGAY
3. Cache ghi vào database SAU (batch, interval)

+ Viết rất nhanh
- Có thể mất data nếu crash trước khi sync
- Phức tạp hơn
```

### Write-around

```
Client → Database
Client → Cache (MISS → query DB → cache)

1. Ghi trực tiếp vào database (không qua cache)
2. Cache được populate khi có read request

+ Không flooding cache với unused data
- First read always cache miss
```

### Read-through

```
Client → Cache → (if miss) → Database

1. Client đọc từ cache
2. Cache miss → Cache query DB → Cache store → Return

+ Transparent với client
- First read slow (cache miss)
```

---

## 17. Event-Driven Architecture

### Định nghĩa

Event-driven = **Components giao tiếp bằng events** thay vì direct calls

### Ví dụ

```
Traditional (direct call):
  Service A → Service B (synchronous)
  → A đợi B hoàn thành

Event-driven:
  Service A → Publish event "USER_CREATED"
  Service B → Subscribe event "USER_CREATED" → Process
  Service C → Subscribe event "USER_CREATED" → Send email

  → A không cần biết B, C tồn tại
  → Loose coupling
```

### Trong Distributed Cache

```
Khi primary thay đổi data:
  → Publish event "KEY_UPDATED: user:123"
  → Replicas subscribe → Invalidate local cache
  → Hoặc: Apply change to local cache

Loose coupling:
  → Primary không cần biết có bao nhiêu replicas
  → Tự động sync khi có thay đổi
```

---

## Tóm tắt

### Các khái niệm chính trong project này

| Khái niệm | Mục đích | Implementation |
|---|---|---|
| **Consistent Hashing** | Phân phối data minimal movement | Hash ring + virtual nodes |
| **Replication** | Redundancy, fault tolerance | Primary-replica |
| **Leader Election** | Xử lý primary failure | Bully algorithm |
| **Heartbeat** | Phát hiện node failure | Timer-based ping |
| **Failover** | Chuyển service khi node dies | Auto failover |
| **CAP Theorem** | Trade-off decisions | AP system |
| **TTL** | Auto-expire data | Lazy expiration |
| **LRU/LFU** | Evict data khi cache đầy | Access tracking |
| **Write-through** | Consistency | Sync write |

### Nguồn tham khảo

```
1. "Designing Data-Intensive Applications" - Martin Kleppmann
   → Sách best về distributed systems

2. "Distributed Systems" - Maarten van Steen
   → Textbook miễn phí: https://www.distributed-systems.net/

3. DynamoDB Paper (2007)
   → Amazon's distributed cache với consistent hashing

4. Redis Documentation
   → https://redis.io/documentation

5. "Understanding Distributed Systems" - Roberto Vitillo
   → Practical guide cho developers
```
