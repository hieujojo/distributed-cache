# Cache Invalidation — Phân tích sâu

## Bài toán

Cache lưu data để truy cập nhanh. Nhưng data trong database có thể thay đổi. Khi đó, cache có thể giữ data **cũ (stale)**.

```
Timeline:
  T0: User đọc "balance: $100" → cache
  T1: User khác nạp $50 → DB cập nhật thành $150
  T2: User đầu tiên đọc "balance: $100" → STALE từ cache!

Đây là "cache invalidation problem" — một trong hai bài toán 
khó nhất trong khoa học máy tính (cùng với naming things).
```

## Các strategy Invalidation

### 1. TTL (Time-To-Live)

```
Mỗi key có thời hạn:
  SET user:123 "John" TTL=60s

Sau 60 giây, key tự động bị xóa.
Lần đọc tiếp theo → cache miss → lấy từ DB → lưu vào cache
```

**Trade-offs:**
```
+ Đơn giản
+ Thời gian stale giới hạn (data tối đa N giây)
+ Tự cleanup (không leak memory)
- Nếu TTL quá ngắn → frequent cache misses
- Nếu TTL quá dài → data cũ tồn tại lâu
- Không có real-time consistency
```

**Khi nào dùng:**
- Data thay đổi không thường xuyên
- Chấp nhận data cũ trong vài giây/phút
- User profiles, product catalogs, config data

### 2. Write-through

```
Thao tác ghi:
  1. Ghi vào cache
  2. Ghi vào database
  3. Ack cho client

Cả cache và DB luôn đồng bộ.
```

**Trade-offs:**
```
+ Cache luôn fresh
+ Mô hình tư duy đơn giản
- Latency ghi tăng (phải ghi 2 nơi)
- Nếu ghi DB thất bại, cache có data mà DB không có
- Cache được populate ngay cả khi data không bao giờ được đọc
```

**Khi nào dùng:**
- Data được đọc nhiều sau khi ghi
- Cần strong consistency
- Chấp nhận latency ghi

### 3. Write-behind (Write-back)

```
Thao tác ghi:
  1. Ghi vào cache
  2. Ack cho client ngay
  3. Ghi vào DB bất đồng bộ (nền)

Ghi nhanh, eventual consistency.
```

**Trade-offs:**
```
+ Ghi rất nhanh (chỉ ghi cache)
+ Có thể batch DB writes để hiệu quả hơn
- Nguy cơ mất data nếu cache dies trước khi ghi DB
- Implement phức tạp hơn
- Chỉ eventual consistency
```

**Khi nào dùng:**
- Workload ghi nhiều
- Chấp nhận inconsistency ngắn hạn
- Cần throughput ghi cao

### 4. Read-through

```
Thao tác đọc (cache miss):
  1. Key không tìm thấy trong cache
  2. Lấy từ database
  3. Lưu vào cache
  4. Trả về cho caller

Cache tự populate khi miss.
```

**Trade-offs:**
```
+ Đơn giản cho caller (chỉ đọc cache)
+ Cache populate on demand (không lãng phí memory)
- Lần đọc đầu tiên chậm (cache miss)
- Cache có thể cold sau restart
```

### 5. Event-driven Invalidation

```
Database thay đổi → Publish event → Cache subscribe → Xóa key

Luồng:
  1. DB update xảy ra
  2. DB publish event: "user:123 updated"
  3. Cache nhận event
  4. Cache xóa key "user:123"
  5. Lần đọc tiếp → cache miss → data fresh từ DB
```

**Các cách implement:**
```
→ Database triggers (PostgreSQL NOTIFY)
→ Message queue (Redis Pub/Sub, RabbitMQ)
→ CDC (Change Data Capture) tools (Debezium)
```

**Trade-offs:**
```
+ Gần real-time consistency
+ Chỉ key bị ảnh hưởng mới bị invalidate
- Cần infrastructure events
- Event delivery không guaranteed (cần acknowledgment)
- Hệ thống phức tạp hơn
```

**Khi nào dùng:**
- Cần strong consistency
- Data thay đổi không thường xuyên nhưng phải fresh
- Đã có message queue infrastructure

## Eviction Policies (Chính sách xóa)

Khi cache đầy (đạt max memory), xóa key nào?

### LRU (Least Recently Used)

```
Xóa key chưa được truy cập lâu nhất.

Mẫu truy cập:
  GET user:1   → [user:1]
  GET user:2   → [user:2, user:1]
  GET user:3   → [user:3, user:2, user:1]
  GET user:1   → [user:1, user:3, user:2]
  SET user:4   → Xóa user:2 (least recently used)

Implement:
  → Hash map cho lookup O(1)
  → Doubly linked list cho reorder O(1)
```

### LFU (Least Frequently Used)

```
Xóa key được truy cập ít nhất.

Số lần truy cập:
  user:1 → 100 lần
  user:2 → 3 lần
  user:3 → 50 lần

Xóa: user:2 (tần suất thấp nhất)
```

### FIFO (First In, First Out)

```
Xóa key cũ nhất (bất kể mẫu truy cập).

Đơn giản nhưng thường không tối ưu.
```

## So sánh các Strategy

| Strategy | Consistency | Write Latency | Độ phức tạp | Use Case |
|---|---|---|---|---|
| **TTL** | Eventual | Không có | Thấp | Product catalog, config |
| **Write-Through** | Strong | Cao | Thấp | User profile, session |
| **Write-Back** | Eventual | Rất thấp | Cao | Write-heavy logs |
| **Read-Through** | Eventual | Không có | Thấp | Read-heavy workloads |
| **Event-Driven** | Gần Strong | Không có | Cao | Real-time data, chat |

## Lỗi thường gặp

### Cache Stampede

```
Vấn đề:
  Key phổ biến hết hạn → nhiều requests đồng thời
  → Tất cả đều hit database → DB quá tải

Giải pháp:
  → Lock mechanism: request đầu tiên lấy từ DB, các request khác chờ
  → Probabilistic early expiration: random refresh trước TTL
  → Background refresh: refresh trước khi hết hạn
```

### Thundering Herd

```
Tương tự stampede nhưng cho ghi:
  Cache bị invalidate → nhiều concurrent writes
  → Tất cả cố update cache đồng thời

Giải pháp:
  → Mutex/lock per key
  → Write coalescing: merge nhiều writes thành 1
```

### Hot Key

```
Vấn đề:
  Một key được truy cập nhiều gấp 1000 lần so với các key khác
  → Server giữ key này bị quá tải

Giải pháp:
  → Replicate hot key sang nhiều servers
  → Local cache trên mỗi server
  → Client-side caching
```

## Benchmark Metrics

### Staleness Duration

```
Metric: Data có thể stale trong bao lâu

TTL:             Tối đa TTL duration
Write-through:   0 (luôn fresh)
Event-driven:    Network latency (thường <100ms)
```

### Cache Hit Ratio

```
Metric: % reads được phục vụ từ cache

Càng cao càng tốt:
  > 90% → xuất sắc
  80-90% → tốt
  < 80% → cần tối ưu

Các yếu tố ảnh hưởng:
  → TTL duration (dài hơn → hit ratio cao hơn)
  → Mẫu truy cập (zipf distribution → hit ratio cao hơn)
  → Kích thước cache (lớn hơn → hit ratio cao hơn)
```

### Memory Efficiency

```
Metric: Useful data / Total cache memory

Với eviction policies:
  → LRU: tốt cho temporal locality
  → LFU: tốt cho tần suất truy cập
  → TTL: memory usage giới hạn
```

## Câu hỏi phỏng vấn thường gặp

1. **Cache invalidation là gì và tại sao nó khó?**
   → Giữ cache đồng bộ với DB trong distributed nodes

2. **TTL vs Write-Through — khi nào dùng cái nào?**
   → TTL: chấp nhận stale, đơn giản
   → Write-through: strong consistency, chi phí ghi cao hơn

3. **Cache stampede là gì? Phòng tránh thế nào?**
   → Nhiều requests hit DB sau khi cache hết hạn
   → Phòng tránh với locking hoặc early refresh

4. **LRU vs LFU — khi nào dùng cái nào?**
   → LRU: temporal locality (vừa truy cập quan trọng nhất)
   → LFU: tần suất quan trọng (items phổ biến giữ lại lâu hơn)
