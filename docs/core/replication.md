# Data Replication — Phân tích sâu

## Bài toán

1 cache server có thể bị crash. Khi đó, toàn bộ data trên đó mất. Với hệ thống cache, điều này có nghĩa:
- Cache misses tăng vọt → toàn bộ requests đi vào database
- Database bị quá tải → hệ thống chậm hoặc crash

## Các strategy Replication

### 1. Single Replica (Primary + 1 Replica)

```
Client → Primary Server → Replica Server

Luồng ghi:
  1. Client ghi vào Primary
  2. Primary ack cho client
  3. Primary replicate sang Replica (async)
  4. Nếu Primary dies → Replica trở thành Primary mới
```

**Trade-offs:**
```
+ Đơn giản
+ Ghi nhanh (async replication)
- Có thể mất data nếu Primary dies trước khi replicate
- Đọc giới hạn (chỉ 1 replica)
```

### 2. Multiple Replicas (Primary + N Replicas)

```
Client → Primary → Replica 1
                 → Replica 2
                 → Replica 3

Replication factor = 3 (1 primary + 2 replicas)
```

**Trade-offs:**
```
+ Khả dụng cao hơn (2 server có thể fail)
+ Hiệu năng đọc tốt hơn (đọc từ bất kỳ replica nào)
- Cần nhiều storage hơn
- Replication lag tăng
```

### 3. Synchronous vs Asynchronous Replication

**Synchronous (Đồng bộ):**
```
Ghi vào Primary → Chờ TẤT CẢ replicas ack → Ack cho client

+ Không mất data (nếu Primary dies, replicas có data mới nhất)
- Latency ghi cao (phải chờ replicas)
- Nếu 1 replica chậm → toàn bộ ghi chậm
```

**Asynchronous (Bất đồng bộ):**
```
Ghi vào Primary → Ack cho client ngay → Replicate nền

+ Ghi nhanh
+ Replicas không block ghi
- Có thể mất data (nếu Primary dies trước khi replicate)
- Replication lag (replicas có thể có data cũ)
```

**Hybrid (Hầu hết hệ thống dùng):**
```
Ghi vào Primary → Chờ 1 replica ack → Ack cho client
                  → Các replica khác nhận data nền

+ Cân bằng giữa consistency và performance
+ Chịu được 1 replica failure mà không mất data
```

## Leader Election

Khi Primary server dies, cluster cần bầu Primary mới.

### Algorithm: Bully Algorithm

```
1. Mỗi node có ID duy nhất (ID cao = ưu tiên cao hơn)
2. Khi node phát hiện Primary down:
   a. Gửi thông điệp "Election" đến tất cả node có ID cao hơn
   b. Nếu không có response → nó trở thành Primary mới
   c. Nếu có người response → node đó chạy election
3. Cuối cùng, node có ID cao nhất thắng
```

### Algorithm: Raft-based (Đơn giản hóa)

```
1. Các node có states: Follower, Candidate, Leader
2. Tất cả bắt đầu là Follower
3. Nếu không nhận heartbeat từ Leader → timeout
4. Timeout → trở thành Candidate → yêu cầu votes
5. Đa số votes → trở thành Leader
6. Leader gửi heartbeats để duy trì quyền lực
```

**Chúng ta sẽ implement:** Election dựa trên Raft đơn giản

```
States:
  FOLLOWER → (timeout) → CANDIDATE → (đa số votes) → LEADER
  LEADER → (phát hiện ID cao hơn) → FOLLOWER
```

### Cơ chế Heartbeat

```
Leader gửi heartbeat mỗi N milliseconds:
  → Thông báo followers "tôi vẫn sống"
  → Followers reset election timeout
  → Nếu followers không nhận heartbeat → bắt đầu election

Thời gian điển hình:
  → Heartbeat interval: 150ms
  → Election timeout: 300-500ms (ngẫu nhiên để tránh split)
```

## Quy trình Failover

```
Vận hành bình thường:
  Primary (S0) ←──── Clients
  Replica (S1) ←──── S0 replication

S0 crash:
  1. S1 ngừng nhận heartbeats
  2. S1 election timeout → trở thành Candidate
  3. S1 yêu cầu votes (nếu có nhiều nodes hơn)
  4. S1 thắng election → trở thành Primary
  5. Clients giờ ghi vào S1

Phục hồi:
  S0 trở lại online
  → Phát hiện S1 giờ là Primary
  → Trở thành Follower
  → S1 gửi full state sync cho S0
  → S0 catching up → trở thành Replica
```

## Data Consistency trong Failover

### Vấn đề: Split Brain

```
Network partition:
  S0 (Primary) ──X── S1 (Replica)
  (kết nối bị cắt)

Cả hai đều nghĩ mình là Primary:
  → Client A ghi vào S0
  → Client B ghi vào S1
  → Data conflict!
```

### Giải pháp: Majority Quorum

```
Cluster 3 nodes: S0, S1, S2

Ghi cần đa số (2/3):
  → S0 phải nhận ack từ ít nhất 1 node khác
  → Nếu partition: S0 chỉ reaches được chính nó → không ghi được
  → S1 + S2 có thể tạo đa số → S1 trở thành Primary

Kết quả: Chỉ có 1 leader tại bất kỳ thời điểm nào
```

## Tracking Replicated Keys

ReplicationManager dùng `Set<string>` để track哪些 key đã replicate. Để tránh Set grow vô hạn:

```
CacheNode.onEvicted(key)  →  ReplicationManager.untrackKey(key)

Khi key bị eviction (enforceMaxSize), xóa (delete), hoặc sweep (TTL expired):
  → CacheNode gọi onEvicted callback
  → ReplicationManager.xóa key khỏi replicatedKeys Set
  → Set chỉ chứa keys đang active trong cache
```

Không có untrackKey → Set grow vô hạn theo tổng số key đã từng set.

---

## Benchmark Metrics

### Replication Lag

```
Metric: Thời gian giữa ghi vào Primary và khả dụng trên Replica

Synchronous:   0ms (nhưng latency ghi cao hơn)
Asynchronous:  1-10ms (tùy network)
Hybrid:        0-5ms (tùy cấu hình)
```

### Failover Time

```
Metric: Thời gian từ Primary failure đến Primary mới phục vụ requests

Bully algorithm:    2-5 giây
Raft-based:         1-3 giây (với timeout tối ưu)
```

### Data Loss Window

```
Asynchronous:   tối đa replication lag worth of data
Synchronous:    0 data loss (nếu ít nhất 1 replica sync)
Hybrid:         tối đa 1 write data loss
```

## Sử dụng trong thực tế

| Hệ thống | Strategy Replication |
|---|---|
| **Redis** | Async replication, failover qua Sentinel |
| **PostgreSQL** | Streaming replication (async/sync tùy chỉnh) |
| **MongoDB** | Replica sets (election dựa trên Raft) |
| **Kafka** | ISR (In-Sync Replicas) |
| **etcd** | Raft consensus |

## Câu hỏi phỏng vấn thường gặp

1. **Khác nhau giữa sync và async replication là gì?**
   → Sync: chờ replica (consistent nhưng chậm)
   → Async: không chờ (nhanh nhưng có thể mất data)

2. **Xử lý leader election thế nào?**
   → Bully algorithm hoặc election dựa trên Raft

3. **Split brain là gì và phòng tránh thế nào?**
   → Hai node đều nghĩ mình là leader
   → Phòng tránh với majority quorum

4. **Khi follower trở lại online thì sao?**
   → Full state sync từ leader hiện tại, rồi catching up với các operations đã bỏ lỡ

5. **Chọn replication factor thế nào?**
   → Cân bằng giữa availability và chi phí storage
   → RF=3 nghĩa là 3x storage nhưng chịu được 2 failures
