# Changelog — Bugs & Lessons Learned

> Ghi nhận các bugs đã gặp, nguyên nhân, và cách xử lý để tránh lặp lại.

---

## Format

```
### [Ngày] — Tên bug

**Mô tả:**
Mô tả ngắn gọn bug

**Nguyên nhân:**
Tại sao bug xảy ra

**Cách xử lý:**
Cách fix bug

**Lessons learned:**
Bài học rút ra để tránh lặp lại

**Severity:** Low | Medium | High | Critical
```

---

## Bugs đã ghi nhận

### [Chưa có bug nào]

> Chưa có bug nào được ghi nhận. Khi gặp bug, thêm vào đây theo format trên.

---

## Template khi gặp bug

```markdown
### [YYYY-MM-DD] — [Tên bug]

**Mô tả:**
[Mô tả ngắn gọn bug là gì]

**Nguyên nhân:**
[Giải thích tại sao bug xảy ra]

**Cách xử lý:**
[Các bước đã làm để fix]

**Lessons learned:**
[Bài học rút ra]

**Severity:** [Low/Medium/High/Critical]
```

---

## Prevention Checklist

> Checklist để tránh bug thường gặp

### Consistent Hashing

```
□ Test case: Thêm node → kiểm tra data redistribution
□ Test case: Xóa node → kiểm tra data không mất
□ Test case: Hash collision → xử lý đúng
□ Edge case: Chỉ có 1 node
□ Edge case: Tất cả nodes đều down
```

### Replication

```
□ Test case: Primary dies → leader election hoạt động
□ Test case: Network partition → split brain prevention
□ Test case: Replica sync sau khi recover
□ Edge case: Tất cả replicas die cùng lúc
□ Edge case: Primary recover sau khi elected mới
```

### Cache Invalidation

```
□ Test case: TTL expired → key bị xóa
□ Test case: Cache full → eviction hoạt động
□ Test case: Concurrent writes → race condition
□ Edge case: TTL = 0
□ Edge case: Cache size = 0
```

### Network

```
□ Test case: Connection timeout → retry logic
□ Test case: Connection refused → graceful degradation
□ Test case: Partial data received → buffer handling
□ Edge case: Network partition
□ Edge case: All connections drop simultaneously
```

---

## Common Pitfalls

> Các lỗi thường gặp khi phát triển distributed systems

### 1. Race Conditions

```
Vấn đề: 2 processes cùng sửa 1 data cùng lúc

Ví dụ:
  Process A: reads count = 5
  Process B: reads count = 5
  Process A: writes count = 6
  Process B: writes count = 6  → Sai! Phải là 7

Giải pháp:
  - Dùng locks (mutex, semaphore)
  - Dùng atomic operations
  - Dùng optimistic locking (version numbers)
```

### 2. Split Brain

```
Vấn đề: Network partition → 2 nodes đều nghĩ mình là leader

Ví dụ:
  Node A: "Mất connection với B, tôi là leader"
  Node B: "Mất connection với A, tôi là leader"
  → Cả 2 ghi data → DATA INCONSISTENCY

Giải pháp:
  - Majority quorum (cần N/2 + 1 nodes đồng ý)
  - Fencing tokens
  - Lease-based leadership
```

### 3. Thundering Herd

```
Vấn đề: Khi cache expires, tất cả requests cùng query database

Ví dụ:
  Cache key "user:123" expires
  100 requests cùng đến cùng lúc
  → Tất cả query database → database overload

Giải pháp:
  - Lock khi cache miss, chỉ 1 request query DB
  - Stale-while-revalidate
  - Request coalescing
```

### 4. Cache Stampede

```
Vấn đề: Khi 1 hot key expire, tất cả requests fail

Ví dụ:
  Hot key "product:featured" expire
  1000 requests cùng lúc → cache miss → DB query
  → DB overload → timeout → cascade failure

Giải pháp:
  - Background refresh trước khi expire
  - probabilistic early expiration
  - Circuit breaker
```

### 5. Memory Leak

```
Vấn đề: Memory không được release, gradually tăng

Ví dụ:
  - Timer không được clear
  - Event listeners không unsubscribed
  - Cache không evict旧 data

Giải pháp:
  - Monitor memory usage
  - Set memory limits
  - Regular cleanup intervals
```

---

## Debugging Tips

### Khi debug distributed systems

```
1. Log EVERYTHING (trong development)
   → Thêm logs ở mọi step
   → Sau khi fix, xóa logs thừa

2. Reproduce trong controlled environment
   → Đừng debug production trực tiếp
   → Tạo test case reproduce bug

3. Think about timing
   → Distributed bugs thường liên quan timing
   → Thử với delays, retries, concurrent operations

4. Check edge cases
   → 0 nodes, 1 node, N nodes
   → All down, partial down
   → Network partition, slow network
```

### Tools để debug

```
- Node.js debugger: node --inspect-brk
- Chrome DevTools: connect to Node.js process
- Logging: structured logging với timestamps
- Metrics: throughput, latency, error rates
- Network: Wireshark, tcpdump
```

---

## Update Policy

```
1. Khi gặp bug → ghi vào đây NGAY
2. Khi fix bug → cập nhật "Cách xử lý" và "Lessons learned"
3. Khi review code → check "Prevention Checklist"
4. Hàng tháng → review bugs, update "Common Pitfalls"
```
