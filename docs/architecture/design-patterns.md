# Design Patterns

> Các design pattern được áp dụng trong project này. Mỗi pattern bao gồm: định nghĩa, tại sao dùng, khi nào dùng, và ví dụ cụ thể trong project.

---

## Mục lục

1. [Strategy Pattern](#1-strategy-pattern)
2. [Observer Pattern](#2-observer-pattern)
3. [Factory Pattern](#3-factory-pattern)
4. [Singleton Pattern](#4-singleton-pattern)
5. [Adapter Pattern](#5-adapter-pattern)
6. [Proxy Pattern](#6-proxy-pattern)
7. [Command Pattern](#7-command-pattern)

---

## 1. Strategy Pattern

### Định nghĩa

**Strategy Pattern** cho phép bạn chọn một trong nhiều algorithm khác nhau tại runtime, và thay đổi algorithm mà không cần sửa code client.

### Tại sao dùng trong project?

```
Eviction Policies có nhiều loại:
- LRU (Least Recently Used): Xóa key ít dùng nhất
- LFU (Least Frequently Used): Xóa key ít dùng nhất (tần suất)
- FIFO (First In First Out): Xóa key cũ nhất

Vấn đề:
- Nếu hardcode LRU trong CacheNode → khó thêm LFU sau
- Nếu dùng if/else → code phức tạp, dễ bug

Strategy Pattern giải quyết:
- Mỗi policy = 1 strategy class
- CacheNode chỉ cần知道 interface, không cần biết implementation
- Thêm policy mới = thêm class mới, không sửa code cũ
```

### Khi nào dùng?

```
✅ Dùng khi:
- Có nhiều cách làm 1 việc
- Muốn switch giữa các cách runtime
- Không muốn code chứa nhiều if/else

❌ Không dùng khi:
- Chỉ có 1 cách làm
- Algorithm không thay đổi
```

### Trong project này

```
CacheNode có thể dùng bất kỳ eviction strategy nào:

CacheNode + LRUStrategy  → Cache xóa key ít dùng nhất
CacheNode + LFUStrategy  → Cache xóa key ít frequent nhất
CacheNode + FIFOStrategy → Cache xóa key cũ nhất

Khi muốn thêm RandomStrategy:
- Chỉ cần tạo class RandomStrategy implements EvictionStrategy
- Không sửa CacheNode, không sửa LRUStrategy
```

---

## 2. Observer Pattern

### Định nghĩa

**Observer Pattern** cho phép 1 object (subject) thông báo cho nhiều objects (observers) khác khi state thay đổi, mà không cần biết các observers là ai.

### Tại sao dùng trong project?

```
Data Replication cần thông báo cho replicas:

Primary node thay đổi data
  → Cần thông báo cho tất cả replicas
  → Nhưng primary KHÔNG BIẾT có bao nhiêu replicas
  → Có thể thêm/xóa replicas runtime

Observer Pattern giải quyết:
- Primary = Subject (publisher)
- Replicas = Observers (subscribers)
- Primary chỉ cần publish event, không cần知道 ai subscribe
- Replica tự quyết định subscribe/unsubscribe
```

### Khi nào dùng?

```
✅ Dùng khi:
- 1 object cần thông báo cho nhiều objects khác
- Không muốn tight coupling giữa publisher và subscriber
- Muốn dynamic subscription runtime

❌ Không dùng khi:
- Chỉ có 1 subscriber
- Không cần dynamic subscription
```

### Trong project này

```
Khi Primary thay đổi data:
1. Primary publish event "KEY_UPDATED"
2. Tất cả replicas nhận được event
3. Replicas update local cache

Khi thêm replica mới:
- Replica mới subscribe event từ Primary
- Primary không cần biết có replica mới

Khi xóa replica:
- Replica unsubscribe event
- Primary vẫn hoạt động bình thường
```

---

## 3. Factory Pattern

### Định nghĩa

**Factory Pattern** ẩn logic tạo object, cho phép bạn tạo nhiều loại object khác nhau mà client không cần biết cách tạo.

### Tại sao dùng trong project?

```
CacheNode có thể tạo với nhiều configuration khác nhau:

- CacheNode với LRU policy, max 1000 keys
- CacheNode với LFU policy, max 5000 keys
- CacheNode với TTL 60s, max 2000 keys

Vấn đề:
- Nếu client tự tạo → phải biết cách tạo từng loại
- Code tạo object lặp đi lặp lại

Factory Pattern giải quyết:
- CacheNodeFactory.create(config)
- Client chỉ cần nói muốn gì (config)
- Factory quyết định tạo như nào
```

### Khi nào dùng?

```
✅ Dùng khi:
- Có nhiều loại object với cùng interface
- Logic tạo object phức tạp
- Muốn ẩn implementation details

❌ Không dùng khi:
- Chỉ có 1 loại object
- Tạo object đơn giản (new ClassName())
```

### Trong project này

```
CacheNodeFactory:
- Nhận config từ client
- Chọn strategy phù hợp (LRU, LFU, FIFO)
- Tạo CacheNode với strategy đó
- Trả về CacheNode ready to use

Client không cần biết:
- Có bao nhiêu loại strategy
- Cách tạo từng loại strategy
- Strategy nào phù hợp với config nào
```

---

## 4. Singleton Pattern

### Định nghĩa

**Singleton Pattern** đảm bảo chỉ có 1 instance duy nhất của class tồn tại trong toàn bộ application, và cung cấp global access point đến instance đó.

### Tại sao dùng trong project?

```
ClusterManager quản lý tất cả nodes:

- Nếu có 2 ClusterManagers → conflict khi quản lý nodes
- Nếu có 0 ClusterManagers → không ai quản lý nodes
- Cần ĐÚNG 1 instance duy nhất

Singleton Pattern giải quyết:
- Constructor private → không cho new trực tiếp
- static getInstance() → trả về instance duy nhất
- Đảm bảo chỉ có 1 ClusterManager
```

### Khi nào dùng?

```
✅ Dùng khi:
- Thực sự cần 1 instance duy nhất
- Ví dụ: ClusterManager, ConnectionPool, ConfigManager

❌ KHÔNG dùng khi:
- Dùng bừa bãi → tight coupling, khó test
- Chỉ "thoải mái" có 1 instance → không đủ lý do

❌ CẢNH BÁO:
- Singleton rất dễ abuse
- Chỉ dùng khi THỰC SỰ cần thiết
- Luôn có thể test bằng cách reset instance
```

### Trong project này

```
ClusterManagerSingleton:

- Constructor private
- static getInstance() trả về instance duy nhất
- static resetInstance() cho testing

Vì sao cần Singleton?
- ClusterManager cần biết tất cả nodes
- Nếu có nhiều instances → data inconsistency
```

---

## 5. Adapter Pattern

### Định nghĩa

**Adapter Pattern** chuyển đổi interface của 1 class thành interface khác mà client mong đợi, cho phép các classes không tương thích làm việc cùng nhau.

### Tại sao dùng trong project?

```
TCP Server nhận raw TCP data:
- Dữ liệu đến dạng Buffer (binary)
- Cần chuyển thành CacheRequest object

Cache Server trả response:
- CacheResponse object
- Cần chuyển thành TCP Buffer

Adapter Pattern giải quyết:
- TCPAdapter chuyển đổi giữa raw TCP và business objects
- Business logic không cần biết về TCP protocol
- Có thể thay đổi protocol mà không ảnh hưởng business logic
```

### Khi nào dùng?

```
✅ Dùng khi:
- Có 2 interface không tương thích
- Muốn tách biệt business logic và protocol details
- Muốn dễ dàng đổi protocol sau này

❌ Không dùng khi:
- Interface đã tương thích
- Không cần tách biệt logic và protocol
```

### Trong project này

```
TCPAdapter:

Input: Raw TCP Buffer → "SET user:123 John 60"
Output: CacheRequest { type: 'SET', key: 'user:123', value: 'John', ttl: 60 }

Input: CacheResponse { type: 'VALUE', value: 'John' }
Output: Buffer: "VALUE John\r\n"

Business logic chỉ làm việc với CacheRequest/CacheResponse
Không cần biết data đến từ TCP, HTTP, hay WebSocket
```

---

## 6. Proxy Pattern

### Định nghĩa

**Proxy Pattern** cung cấp 1 placeholder hoặc surrogate cho 1 object khác để kiểm soát truy cập, thêm logging, caching, hoặc functionality khác.

### Tại sao dùng trong project?

```
Cache Proxy kiểm soát truy cập data:

Client muốn đọc data:
1. Check cache trước (nhanh)
2. Cache hit → return ngay
3. Cache miss → query database → cache → return

Vấn đề:
- Nếu client tự query database → chậm, không có cache benefit
- Nếu hardcode cache logic trong client → tight coupling

Proxy Pattern giải quyết:
- CacheProxy = đại diện cho database
- Client gọi proxy như gọi database
- Proxy tự quyết định: cache hay query DB
```

### Khi nào dùng?

```
✅ Dùng khi:
- Muốn thêm functionality mà không sửa original object
- Muốn kiểm soát truy cập
- Muốn lazy loading, caching, logging

❌ Không dùng khi:
- Không cần thêm functionality
- Original object đã đủ
```

### Trong project này

```
CacheProxy:

- Client gọi proxy.get('user:123')
- Proxy check cache:
  - Hit → return cached value
  - Miss → query DB → cache → return
- Client không biết data đến từ cache hay DB

Proxy cũng có thể:
- Thêm logging cho mọi request
- Thêm authentication
- Thêm rate limiting
```

---

## 7. Command Pattern

### Định nghĩa

**Command Pattern** đóng gói 1 request thành object, cho phép bạn lưu, log, undo, hoặc redo requests.

### Tại sao dùng trong project?

```
Cache operations cần được track:

- Ai đã SET key nào?
- Khi nào DEL key?
- Nếu có bug → cần replay lại operations

Command Pattern giải quyết:
- Mỗi operation = 1 Command object
- Command có execute() và undo()
- Có thể lưu history, replay, undo
```

### Khi nào dùng?

```
✅ Dùng khi:
- Cần audit log (ai làm gì)
- Cần undo/redo
- Cần queue operations
- Cần replay operations

❌ Không dùng khi:
- Không cần track operations
- Operations đơn giản, không cần undo
```

### Trong project này

```
Command History:

- SetCommand: execute() = SET key, undo() = DEL key
- DelCommand: execute() = DEL key, undo() = SET key

Khi có bug:
- Có thể undo tất cả operations
- Có thể replay operations trên node khác
- Có thể log tất cả operations để audit
```

---

## So sánh các Patterns

| Pattern | Mục đích | Khi dùng | Trong project |
|---|---|---|---|
| **Strategy** | Chọn algorithm runtime | Nhiều cách làm 1 việc | Eviction policies (LRU, LFU) |
| **Observer** | Thông báo state change | 1→N communication | Event-driven replication |
| **Factory** | Ẩn logic tạo object | Nhiều loại object | Tạo CacheNode với config |
| **Singleton** | 1 instance duy nhất | Cần global state | ClusterManager |
| **Adapter** | Chuyển đổi interface | 2 interface không tương thích | TCP protocol ↔ business objects |
| **Proxy** | Kiểm soát truy cập | Thêm caching, logging | Cache layer trước database |
| **Command** | Đóng gói request | Cần audit, undo | Cache operations history |

---

## Nguồn tham khảo

```
1. "Design Patterns: Elements of Reusable Object-Oriented Software" - Gang of Four
2. "Head First Design Patterns" - Eric Freeman
3. Refactoring.Guru - https://refactoring.guru/design-patterns
4. "Patterns of Enterprise Application Architecture" - Martin Fowler
```
