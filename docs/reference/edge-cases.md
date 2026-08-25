# Edge Cases — Xử lý các trường hợp đặc biệt

> Danh sách các edge cases có thể xảy ra, nguyên nhân, cách xử lý, và rủi ro.

---

## Mục lục

1. [Memory Issues](#1-memory-issues)
2. [Network Issues](#2-network-issues)
3. [Node Issues](#3-node-issues)
4. [Data Issues](#4-data-issues)
5. [Concurrency Issues](#5-concurrency-issues)

---

## 1. Memory Issues

### 1.1 Cache Full (Tràn RAM)

```
Tình trạng:
  Cache đã đạt maxCacheSize, không còn chỗ lưu data mới

Nguyên nhân:
  - maxCacheSize quá nhỏ
  - Data không được evict đúng cách
  - Memory leak (timer, listener không được clear)

Cách xử lý:
  1. Trigger eviction policy (LRU/LFU/FIFO)
  2. Nếu eviction không đủ → reject new writes
  3. Log warning để monitor

Rủi ro:
  - Nếu eviction policy bug → memory overflow → crash
  - Nếu không log → không biết cache full xảy ra

Code handling (src/core/node.ts — enforceMaxSize):
  private enforceMaxSize(): void {
    while (this.store.size > this.maxSize) {
      const victim = this.eviction.onEvict();
      if (victim === null) break;   // safety: avoid infinite loop
      if (this.store.has(victim)) {
        this.store.delete(victim);
      }
    }
  }

  // Called after every set():
  set(key, value, ttl?) {
    ...
    this.store.set(key, entry);
    this.eviction.onInsert(key);
    this.enforceMaxSize();          // ← enforced eviction
  }
```

### 1.2 Memory Leak

```
Tình trạng:
  RAM tăng dần theo time, không giảm

Nguyên nhân:
  - Timer không được clear (setInterval, setTimeout)
  - Event listeners không unsubscribed
  - Closure giữ reference không cần thiết
  - Global variables không được cleanup

Cách xử lý:
  1. Monitor memory usage định kỳ
  2. Set memory limit (process.memoryUsage())
  3. Cleanup timers khi node shutdown
  4. Unsubscribe listeners khi không cần

Rủi ro:
  - Nếu không detect → OOM crash
  - Nếu crash giữa chừng → data loss

Prevention:
  - Luôn clear timer khi hoàn thành
  - Luôn unsubscribe listener khi không cần
  - Timer PHẢI `.unref()` trong library code
  - Managers có state PHẢI có dispose()/destroy()
  - Set/Map dùng để track PHẢI có cơ chế xóa (onEvicted callback)
  - Test memory usage trong test suite
```

### 1.3 Large Value Size

```
Tình trạng:
  Value quá lớn (1MB, 10MB, 100MB)

Nguyên nhân:
  - Client gửi value quá lớn
  - Không có giới hạn size

Cách xử lý:
  1. Set max value size (default: 1MB)
  2. Validate trước khi store
  3. Reject nếu vượt quá

Rủi ro:
  - Nếu không limit → memory overflow
  - Nếu limit quá nhỏ →reject valid data

Prevention:
  - Validate value size trước khi set
  - Log warning khi value lớn
```

---

## 2. Network Issues

### 2.1 Connection Timeout

```
Tình trạng:
  Node không trả lời trong thời gian cho phép

Nguyên nhân:
  - Node crash
  - Network congestion
  - Node quá tải

Cách xử lý:
  1. Set timeout (default: 5s)
  2. Retry với exponential backoff
  3. Nếu vẫn fail → trigger failover
  4. Mark node as unhealthy

Rủi ro:
  - Timeout quá ngắn → false positive
  - Timeout quá dài → user chờ lâu
  - Retry quá nhiều → load tăng

Prevention:
  - Adaptive timeout dựa trên latency
  - Circuit breaker pattern
  - Max retry limit
```

### 2.2 Connection Refused

```
Tình trạng:
  Không kết nối được đến node

Nguyên nhân:
  - Node down
  - Port sai
  - Firewall block

Cách xử lý:
  1. Check node health trước
  2. Nếu health check fail → skip node
  3. Retry trên node khác (nếu có replicas)
  4. Log error để debug

Rủi ro:
  - Nếu retry trên cùng node → waste time
  - Nếu không có replica → request fail

Prevention:
  - Health check định kỳ
  - Load balancing giữa nodes
  - Graceful degradation
```

### 2.3 Network Partition

```
Tình trạng:
  2 nodes không communication được, nhưng cả 2 vẫn sống

Nguyên nhân:
  - Network switch failure
  - Cable cut
  - Configuration error

Cách xử lý:
  1. Detect partition (heartbeat timeout)
  2. Use majority quorum (5 nodes → cần 3 đồng ý)
  3. Minority partition → reject writes
  4. Sync data khi partition healed

Rủi ro:
  - Split brain (cả 2 partition elect leader riêng)
  - Data inconsistency
  - Stale reads

Prevention:
  - Majority quorum
  - Fencing tokens
  - Lease-based leadership
```

---

## 3. Node Issues

### 3.1 Primary Node Dies

```
Tình trạng:
  Primary (leader) node crash

Nguyên nhân:
  - OOM (Out of Memory)
  - Unhandled exception
  - Hardware failure

Cách xử lý:
  1. Detect via heartbeat timeout
  2. Start leader election
  3. Elect new primary (highest ID)
  4. Update cluster state
  5. Re-replicate data từ surviving replicas

Rủi ro:
  - Election time →ngắn hạn unavailability
  - Split brain nếu detection wrong
  - Data loss nếu all replicas down

Prevention:
  - Replication factor >= 3
  - Heartbeat interval 5s, timeout 15s
  - Automatic failover
```

### 3.2 Replica Node Dies

```
Tình trạng:
  Replica node crash

Nguyên nhân:
  - Tương tự primary node dies

Cách xử lý:
  1. Primary detect replica down
  2. Create new replica từ primary data
  3. Update replication factor

Rủi ro:
  - Nếu replication factor quá thấp → data loss risk
  - Nếu tạo replica mới quá chậm → availability risk

Prevention:
  - Monitoring replica health
  - Auto-scaling replicas
```

### 3.3 Node Recover After Crash

```
Tình trạng:
  Node recover sau khi crash, có data cũ

Nguyên nhân:
  - Temporary failure (restart, network issue)

Cách xử lý:
  1. Node connect lại cluster
  2. Primary sync data mới nhất
  3. Node becomes replica again
  4. Verify data consistency

Rủi ro:
  - Node có data stale → serve incorrect data
  - Sync quá chậm → network bandwidth issue

Prevention:
  - Always sync from primary after recovery
  - Verify checksum after sync
```

---

## 4. Data Issues

### 4.1 Cache-DB Inconsistency

```
Tình trạng:
  Cache có data cũ, DB có data mới

Nguyên nhân:
  - Write-through fails
  - Event-driven invalidation fails
  - Network partition

Cách xử lý:
  1. TTL-based expiration (eventual consistency)
  2. Write-through for critical data
  3. Event-driven invalidation
  4. Periodic cache refresh

Rủi ro:
  - Stale data served to users
  - Data inconsistency across nodes

Prevention:
  - TTL for all cached data
  - Event-driven invalidation
  - Monitoring cache hit/miss ratio
```

### 4.2 Key Collision

```
Tình trạng:
  2 different keys hash to same position

Nguyên nhân:
  - Hash collision (md5, sha1)
  - Bad hash function

Cách xử lý:
  1. Use good hash function (murmurhash3)
  2. Virtual nodes to spread keys
  3. Collision resolution (linked list)

Rủi ro:
  - Performance degradation (O(N) lookup)
  - Data corruption if not handled

Prevention:
  - Use murmurhash3 or similar
  - Monitor collision rate
```

### 4.3 Data Loss on Node Failure

```
Tình trạng:
  Node crash → data trên node đó mất

Nguyên nhân:
  - No replication
  - All replicas fail simultaneously

Cách xử lý:
  1. Replication factor >= 3
  2. Synchronous replication for critical data
  3. Periodic backup

Rủi ro:
  - Data loss if all replicas down
  - Performance impact of synchronous replication

Prevention:
  - Replication factor >= 3
  - Geographic distribution of replicas
```

---

## 5. Concurrency Issues

### 5.1 Race Condition on Cache Write

```
Tình trạng:
  2 processes cùng set 1 key cùng lúc

Nguyên nhân:
  - Concurrent writes
  - No locking mechanism

Cách xử lý:
  1. Mutex lock per key
  2. Optimistic locking (version number)
  3. Last-write-wins

Rủi ro:
  - Lost updates
  - Inconsistent state

Prevention:
  - Lock per key (not global lock)
  - Version numbers
  - Atomic operations
```

### 5.2 Race Condition on Leader Election

```
Tình trạng:
  2 nodes cùng elect mình làm leader

Nguyên nhân:
  - Network partition
  - Detection delay

Cách xử lý:
  1. Majority quorum (N/2 + 1 nodes must agree)
  2. Fencing tokens (increment on each election)
  3. Lease-based leadership

Rủi ro:
  - Split brain
  - Data inconsistency

Prevention:
  - Quorum-based election
  - Fencing tokens
```

### 5.3 Thundering Herd on Cache Miss

```
Tình trạng:
  Khi hot key expire, 100 requests cùng query DB

Nguyên nhân:
  - Cache miss on hot key
  - No request coalescing

Cách xử lý:
  1. Lock per key on cache miss
  2. First request queries DB, others wait
  3. Stale-while-revalidate
  4. Probabilistic early expiration

Rủi ro:
  - DB overload
  - Timeout cascade
  - Increased latency

Prevention:
  - Request coalescing
  - Stale-while-revalidate
  - Circuit breaker
```

---

## Summary

| Category | Edge Cases | Severity | Prevention |
|---|---|---|---|
| **Memory** | Cache full, Memory leak, Large value | High | Eviction, monitoring, size limit |
| **Network** | Timeout, Refused, Partition | High | Timeout, retry, quorum |
| **Node** | Primary dies, Replica dies, Recovery | Critical | Replication, failover |
| **Data** | Inconsistency, Collision, Loss | High | TTL, hash function, replication |
| **Concurrency** | Race condition, Thundering herd | High | Locking, coalescing |
