# Knowledge Base — Kiến thức trọng tâm

> File này chứa TẤT CẢ kiến thức cần nắm để hiểu rõ distributed cache hoạt động thế nào. Đọc file này là hiểu 80% project.

---

## Mục lục

1. [Cache hoạt động thế nào?](#1-cache-hoạt-động-thế-nào)
2. [Distributed Cache là gì?](#2-distributed-cache-là-gì)
3. [Consistent Hashing — Core Algorithm](#3-consistent-hashing)
4. [Replication — Data Redundancy](#4-replication)
5. [Cache Invalidation — When to Delete](#5-cache-invalidation)
6. [Fault Tolerance — When Things Break](#6-fault-tolerance)
7. [CAP Theorem — Trade-offs](#7-cap-theorem)
8. [Eviction Policies — Memory Management](#8-eviction-policies)

---

## 1. Cache hoạt động thế nào?

### Basic Concept

```
Cache = Bộ nhớ tạm thời lưu data thường xuyên truy cập

Client ──GET user:123──→ Cache
                          │
              ┌───────────┴───────────┐
              │                       │
           HIT (có)              MISS (không có)
              │                       │
              ▼                       ▼
         Return value          Query DB → Cache → Return

Tại sao nhanh?
  RAM: 0.1ms (nano-seconds)
  Disk: 10ms (milli-seconds)
  Network: 20ms (milli-seconds)

→ Cache nhanh gấp 100-1000 lần so với query DB
```

### Cache Operations

```
SET key value [TTL]
  → Lưu key-value vào cache
  → Nếu có TTL → tự expire sau TTL giây

GET key
  → Lấy value từ cache
  → Nếu expire → return null (cache miss)

DEL key
  → Xóa key khỏi cache
  → Nếu key không tồn tại → không làm gì
```

---

## 2. Distributed Cache là gì?

### Vấn đề của Single Cache

```
Single Cache (1 server):
  + Đơn giản
  - Giới hạn bởi RAM của 1 server (16GB, 32GB)
  - Server down → MẤT HẾT CACHE
  - Không scale được

Distributed Cache (nhiều servers):
  + Nhiều servers share cache
  + Scale được (thêm server = thêm RAM)
  + Fault tolerance (server down vẫn có server khác)
  + Load balancing (phân phối requests)
```

### Architecture

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

3 nodes, mỗi node chứa 1 phần data
Nếu Node 1 down → vẫn có Node 2, 3
```

### Câu hỏi lớn: Phân phối data thế nào?

```
Có 1000 keys, 3 nodes → Node nào chứa key nào?

Cách 1: Random
  → Không determinist, khó tìm lại

Cách 2: Round-robin
  → Không cân bằng khi nodes khác nhau

Cách 3: Modular hashing (key % N)
  → Dễ redistribute khi thêm node
  → Nhưng redistribute QUÁ NHIỀU keys

Cách 4: Consistent hashing (HASH RING)
  → Ít redistribute nhất
  → Được dùng trong Redis, DynamoDB, Cassandra
```

---

## 3. Consistent Hashing

### Modular Hashing — Vấn đề

```
Công thức: node_index = hash(key) % N

Ví dụ:
  hash("user:123") = 847293
  N = 3 nodes
  node_index = 847293 % 3 = 0 → Node 0

Khi thêm node mới (N = 3 → N = 4):
  hash("user:123") % 4 = 1 → Node 1 (CHANGED!)

→ Gần như TẤT CẢ keys đều bị redistribute!
→ Phải copy data từ node cũ sang node mới → rất chậm
```

### Hash Ring — Giải pháp

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

### Virtual Nodes

```
Vấn đề: Load không cân bằng nếu mỗi node chỉ có 1 vị trí

Giải pháp: Mỗi physical node có N virtual nodes trên ring

Node1_v1 (40°), Node1_v2 (160°), Node1_v3 (280°)
Node2_v1 (80°), Node2_v2 (200°), Node2_v3 (320°)
Node3_v1 (120°), Node3_v2 (240°), Node3_v3 (0°)

→ Keys phân bố đều hơn
→ Thêm/xóa node vẫn minimal data movement

Số lượng virtual nodes tùy chỉnh được:
  Ít (10-50): Ít cân bằng, ít memory
  Trung bình (100-200): Cân bằng tốt, phổ biến nhất
  Nhiều (500+): Rất cân bằng, nhiều memory
```

---

## 4. Replication

### Tại sao cần replication?

```
Single node:
  + Đơn giản
  - Node down → MẤT HẾT DATA

Replicated:
  + Node down → vẫn có bản copy
  + Có thể serve requests từ nhiều nodes
  + Tăng availability
```

### Primary-Replica

```
Primary (Leader):
  → Nhận TẤT CẢ write requests
  → Sync data sang replicas
  → Quản lý replication

Replica (Follower):
  → Nhận data từ primary
  → Serve read requests (optional)
  → Stand by nếu primary die

Write: Client → Primary → Sync to Replicas → ACK
Read:  Client → Primary/Replica → Return
```

### Synchronous vs Async

```
Synchronous:
  Client → Primary → Replica → ACK → Client
  + Data consistent
  - Chậm hơn (phải đợi replica confirm)

Async:
  Client → Primary → ACK → Client
  (Primary sync to replicas sau)
  + Nhanh hơn
  - Có thể mất data nếu primary chết trước khi sync

Hybrid:
  → Sync với 1 replica, async với còn lại
  → Balance giữa consistency và performance
```

---

## 5. Cache Invalidation

### Vấn đề

```
Database có data mới, nhưng cache vẫn giữ data cũ.
→ User đọc cache → thấy data sai

→ "There are only two hard things in Computer Science:
   cache invalidation and naming things"
```

### Strategies

```
1. TTL (Time-To-Live):
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
   → Luôn consistent
   - Viết chậm hơn

4. Write-back:
   → Ghi cache trước, ghi DB sau (deferred)
   → Viết nhanh
   - Có thể mất data nếu crash
```

---

## 6. Fault Tolerance

### Heartbeat

```
Heartbeat = Tín hiệu định kỳ nodes gửi cho nhau

Primary ──heartbeat──→ Replica (mỗi 5 giây)

Nếu Replica không nhận heartbeat trong 15 giây:
→ Coi primary đã die → Start leader election

Heartbeat interval:  5 giây
Timeout:             15 giây (3x heartbeat interval)
```

### Leader Election

```
Khi primary dies, cần bầu primary mới:

Bully Algorithm:
1. Node phát hiện primary down
2. Gửi message "ELECTION" đến nodes có ID lớn hơn
3. Nếu không ai trả lời → self-elect làm leader
4. Gửi "I AM NEW LEADER" đến tất cả
```

### Split Brain

```
Network partition → 2 nodes đều elect leader riêng:

Node A: "Mất connection với B, tôi là leader"
Node B: "Mất connection với A, tôi là leader"

Giải pháp: Majority Quorum
→ Cần majority (N/2 + 1) nodes đồng ý
→ 5 nodes: cần 3 nodes
→ Nếu partition: minority partition reject writes
```

---

## 7. CAP Theorem

```
Distributed system không thể simultaneously có:

C - Consistency:      Mọi node đều thấy data mới nhất
A - Availability:     Mọi request đều được trả lời
P - Partition tolerant: Hệ thống hoạt động khi network partition

Chọn 2 trong 3:
  CP: Consistent + Partition tolerant (hi sinh availability)
  AP: Available + Partition tolerant (hi sinh consistency)
  CA: Consistent + Available (không partition tolerant → useless)

Project này: AP (Available + Partition tolerant)
→ Focus availability, tolerate eventual consistency
```

---

## 8. Eviction Policies

```
Cache đầy → Phải xóa bớt data → Xóa cái nào?

CacheNode.set() enforced eviction:
  → Sau mỗi lần ghi, kiểm tra store.size > maxSize
  → Nếu vượt → gọi eviction strategy.onEvict() liên tục
  → Victim key bị xóa khỏi store
  → Lặp cho đến khi store.size <= maxSize

LRU (Least Recently Used):
  → Xóa key ít được truy cập nhất
  → Phổ biến nhất, mặc định cho CacheNode
  + Phù hợp cho most workloads

LFU (Least Frequently Used):
  → Xóa key ít được truy cập nhất (tần suất)
  + Đánh giá đúng frequency
  - Mới thêm khó có frequency cao

FIFO (First In First Out):
  → Xóa key cũ nhất
  + Đơn giản nhất
  - Không quan tâm access pattern

Background TTL sweep:
  → setInterval xoá expired entries định kỳ (mặc định 30s)
  → Timer .unref() để không giữ process Node.js sống
  → expired-but-unaccessed entries không nằm trong RAM mãi

External tracking (onEvicted callback):
  → CacheNode gọi onEvicted(key) khi key bị xóa
  → ReplicationManager dùng để untrackKey(key)
  → Set/Map track trạng thái phải có cơ chế xóa
```

---

## Tóm tắt kiến thức

```
1. Cache = Bộ nhớ tạm, nhanh gấp 100-1000x so với DB

2. Distributed Cache = Nhiều servers share cache
   → Scale được, fault tolerant

3. Consistent Hashing = Hash ring + virtual nodes
   → Thêm/xóa node chỉ ảnh hưởng ~1/N keys

4. Replication = Copy data sang nhiều nodes
   → Fault tolerance, availability

5. Cache Invalidation = Khi nào xóa cache
   → TTL, event-driven, write-through

6. Fault Tolerance = Heartbeat + Leader Election
   → Detect failure, recover automatically

7. CAP Theorem = Trade-off consistency vs availability
   → Project này chọn AP (available, eventual consistency)

8. Eviction Policies = Xóa data khi cache đầy (enforced on set())
   → LRU phổ biến nhất, sweep xoá expired entries định kỳ
```

---

## Nguồn tham khảo

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
