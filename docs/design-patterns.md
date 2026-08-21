# Design Patterns

> Các design pattern được áp dụng trong project này, tại sao chọn chúng, và cách implement.

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

Cho phép chọn algorithm/runtime tại runtime thay vì hardcode.

### Áp dụng trong project

```
Eviction Policies: LRU, LFU, FIFO
→ Mỗi policy là 1 strategy
→ CacheNode chọn strategy khi khởi tạo
```

### Implementation

```typescript
// strategy.ts - Interface
export interface EvictionStrategy {
  onAccess(key: string): void;
  onInsert(key: string): void;
  onEvict(): string | null;
}

// lru.ts - Concrete Strategy
export class LRUStrategy implements EvictionStrategy {
  private accessOrder: string[] = [];

  onAccess(key: string): void {
    // Move to front
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.unshift(key);
  }

  onInsert(key: string): void {
    this.accessOrder.unshift(key);
  }

  onEvict(): string | null {
    return this.accessOrder.pop() || null;
  }
}

// lfu.ts - Concrete Strategy
export class LFUStrategy implements EvictionStrategy {
  private frequencies: Map<string, number> = new Map();

  onAccess(key: string): void {
    const freq = this.frequencies.get(key) || 0;
    this.frequencies.set(key, freq + 1);
  }

  onInsert(key: string): void {
    this.frequencies.set(key, 1);
  }

  onEvict(): string | null {
    // Find key with lowest frequency
    let minKey: string | null = null;
    let minFreq = Infinity;

    for (const [key, freq] of this.frequencies) {
      if (freq < minFreq) {
        minFreq = freq;
        minKey = key;
      }
    }

    if (minKey) {
      this.frequencies.delete(minKey);
    }

    return minKey;
  }
}

// node.ts - Context
export class CacheNode {
  private strategy: EvictionStrategy;

  constructor(strategy: EvictionStrategy) {
    this.strategy = strategy;
  }

  get(key: string): Value | null {
    this.strategy.onAccess(key);
    // ...
  }

  set(key: string, value: Value): void {
    this.strategy.onInsert(key);
    // ...
  }
}
```

### Tại sao chọn Strategy?

```
+ Dễ thêm policy mới (chỉ thêm class mới)
+ Không ảnh hưởng code hiện tại
+ Dễ test từng policy riêng
+ Runtime có thể switch policy
```

---

## 2. Observer Pattern

### Định nghĩa

Cho phép 1 object (subject) thông báo cho nhiều objects (observers) khi state thay đổi.

### Áp dụng trong project

```
Event-driven cache invalidation:
→ Khi primary thay đổi data
→ Thông báo tất cả replicas để invalidate/update
```

### Implementation

```typescript
// observer.ts
export interface Observer {
  update(event: CacheEvent): void;
}

// subject.ts
export class EventEmitter {
  private observers: Map<string, Observer[]> = new Map();

  subscribe(event: string, observer: Observer): void {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event)!.push(observer);
  }

  unsubscribe(event: string, observer: Observer): void {
    const observers = this.observers.get(event);
    if (observers) {
      const index = observers.indexOf(observer);
      if (index > -1) {
        observers.splice(index, 1);
      }
    }
  }

  notify(event: string, data: CacheEvent): void {
    const observers = this.observers.get(event) || [];
    for (const observer of observers) {
      observer.update(data);
    }
  }
}

// primary.ts - Subject
export class PrimaryNode extends EventEmitter {
  set(key: string, value: Value): void {
    // Store locally
    this.cache.set(key, value);

    // Notify all replicas
    this.notify('KEY_UPDATED', { key, value, timestamp: Date.now() });
  }
}

// replica.ts - Observer
export class ReplicaNode implements Observer {
  update(event: CacheEvent): void {
    if (event.type === 'KEY_UPDATED') {
      // Update local cache
      this.cache.set(event.key, event.value);
    } else if (event.type === 'KEY_DELETED') {
      this.cache.delete(event.key);
    }
  }
}
```

### Tại sao chọn Observer?

```
+ Loose coupling: Primary không cần biết có bao nhiêu replicas
+ Dynamic: Thêm/xóa replicas runtime
+ Event-driven: Phù hợp cho distributed systems
```

---

## 3. Factory Pattern

### Định nghĩa

Tạo objects mà không expose logic creation ra bên ngoài.

### Áp dụng trong project

```
Tạo CacheNode với các strategy khác nhau:
→ Factory quyết định tạo node với strategy nào
```

### Implementation

```typescript
// factory.ts
export class CacheNodeFactory {
  static create(config: NodeConfig): CacheNode {
    // Chọn strategy dựa trên config
    let strategy: EvictionStrategy;

    switch (config.evictionPolicy) {
      case 'lru':
        strategy = new LRUStrategy();
        break;
      case 'lfu':
        strategy = new LFUStrategy();
        break;
      case 'fifo':
        strategy = new FIFOStrategy();
        break;
      default:
        strategy = new LRUStrategy(); // Default
    }

    return new CacheNode(config.id, strategy, config.maxSize);
  }
}

// Usage
const node = CacheNodeFactory.create({
  id: 'node-1',
  evictionPolicy: 'lru',
  maxSize: 1024 * 1024,
});
```

### Tại sao chọn Factory?

```
+ Centralized creation logic
+ Dễ test (mock factory)
+ Dễ thay đổi creation logic
+ Client không cần biết cách tạo object
```

---

## 4. Singleton Pattern

### Định nghĩa

Đảm bảo chỉ có 1 instance của class tồn tại.

### Áp dụng trong project

```
ClusterManager:
→ Chỉ có 1 cluster manager quản lý tất cả nodes
→ Nếu có nhiều instances → data inconsistency
```

### Implementation

```typescript
// singleton.ts
export class ClusterManager {
  private static instance: ClusterManager | null = null;

  private constructor() {
    // Private constructor prevents direct instantiation
    this.nodes = new Map();
  }

  static getInstance(): ClusterManager {
    if (!ClusterManager.instance) {
      ClusterManager.instance = new ClusterManager();
    }
    return ClusterManager.instance;
  }

  // Reset for testing
  static resetInstance(): void {
    ClusterManager.instance = null;
  }
}

// Usage
const manager = ClusterManager.getInstance();
const manager2 = ClusterManager.getInstance();
console.log(manager === manager2); // true
```

### Tại sao chọn Singleton?

```
+ Đảm bảo 1 instance
+ Global access point
+ Lazy initialization
```

### Cẩn thận khi dùng

```
❌ Không lạm dụng Singleton
❌ Không dùng cho classes có state phức tạp
✅ Chỉ dùng khi THỰC SỰ cần 1 instance
✅ Dễ test (có resetInstance())
```

---

## 5. Adapter Pattern

### Định nghĩa

Chuyển đổi interface của 1 class thành interface khác mà client mong đợi.

### Áp dụng trong project

```
TCP Server adapter:
→ Chuyển đổi raw TCP data thành CacheRequest
→ Chuyển đổi CacheResponse thành TCP response
```

### Implementation

```typescript
// adapter.ts
export class TCPAdapter {
  private server: TCPSServer;

  constructor(server: TCPServer) {
    this.server = server;
  }

  // Chuyển đổi raw TCP → CacheRequest
  parseRequest(raw: Buffer): CacheRequest {
    const parts = raw.toString().split(' ');
    const command = parts[0].toUpperCase();

    switch (command) {
      case 'GET':
        return { type: 'GET', key: parts[1] };
      case 'SET':
        return {
          type: 'SET',
          key: parts[1],
          value: parts[2],
          ttl: parts[3] ? parseInt(parts[3]) : undefined,
        };
      case 'DEL':
        return { type: 'DEL', key: parts[1] };
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  }

  // Chuyển đổi CacheResponse → raw TCP
  serializeResponse(response: CacheResponse): Buffer {
    if (response.type === 'VALUE') {
      return Buffer.from(`VALUE ${response.value}\r\n`);
    } else if (response.type === 'NULL') {
      return Buffer.from('NULL\r\n');
    } else if (response.type === 'OK') {
      return Buffer.from('OK\r\n');
    } else if (response.type === 'ERROR') {
      return Buffer.from(`ERROR ${response.message}\r\n`);
    }
    throw new Error('Invalid response type');
  }
}
```

### Tại sao chọn Adapter?

```
+ Tách biệt protocol handling và business logic
+ Dễ test (mock adapter)
+ Dễ đổi protocol (thêm UDP, WebSocket...)
+ Clean separation of concerns
```

---

## 6. Proxy Pattern

### Định nghĩa

Đại diện cho 1 object khác, kiểm soát truy cập.

### Áp dụng trong project

```
Cache Proxy:
→ Kiểm tra cache trước khi query database
→ Cache hit → return ngay
→ Cache miss → query DB → cache → return
```

### Implementation

```typescript
// proxy.ts
export class CacheProxy implements CacheInterface {
  private cache: CacheNode;
  private database: Database;

  constructor(cache: CacheNode, database: Database) {
    this.cache = cache;
    this.database = database;
  }

  async get(key: string): Promise<Value | null> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached !== null) {
      return cached; // Cache hit
    }

    // Cache miss → query DB
    const value = await this.database.get(key);
    if (value !== null) {
      this.cache.set(key, value); // Populate cache
    }

    return value;
  }

  async set(key: string, value: Value): Promise<void> {
    // Write-through: ghi cả cache và DB
    await this.database.set(key, value);
    this.cache.set(key, value);
  }
}
```

### Tại sao chọn Proxy?

```
+ Transparent: Client không biết đang dùng cache
+ Control access: Có thể add auth, logging...
+ Caching: Tự động cache
+ Lazy loading: Load data khi cần
```

---

## 7. Command Pattern

### Định nghĩa

Đóng gói request thành object, cho phép undo/redo.

### Áp dụng trong project

```
Cache Operations:
→ Đóng gói SET/GET/DEL thành commands
→ Có thể log, replay, undo
```

### Implementation

```typescript
// command.ts
export interface Command {
  execute(): Promise<void>;
  undo(): Promise<void>;
  describe(): string;
}

// set-command.ts
export class SetCommand implements Command {
  constructor(
    private node: CacheNode,
    private key: string,
    private value: Value
  ) {}

  async execute(): Promise<void> {
    this.node.set(this.key, this.value);
  }

  async undo(): Promise<void> {
    this.node.delete(this.key);
  }

  describe(): string {
    return `SET ${this.key} = ${this.value}`;
  }
}

// History
export class CommandHistory {
  private history: Command[] = [];

  async execute(command: Command): Promise<void> {
    await command.execute();
    this.history.push(command);
  }

  async undo(): Promise<void> {
    const command = this.history.pop();
    if (command) {
      await command.undo();
    }
  }
}
```

### Tại sao chọn Command?

```
+ Audit log: Biết ai làm gì
+ Undo/Redo: Dễ revert
+ Replay: Test lại operations
+ Queue: Đóng gói operations để process sau
```

---

## Tóm tắt

| Pattern | Áp dụng | Khi nào dùng |
|---|---|---|
| **Strategy** | Eviction policies | Cần chọn algorithm runtime |
| **Observer** | Event-driven replication | Cần通知 nhiều objects |
| **Factory** | Create cache nodes | Cần centralized creation |
| **Singleton** | ClusterManager | Cần 1 instance duy nhất |
| **Adapter** | TCP protocol | Cần convert interface |
| **Proxy** | Cache layer | Cần control access |
| **Command** | Cache operations | Cần audit/undo |

---

## Nguồn tham khảo

```
1. "Design Patterns" - Gang of Four
2. "Head First Design Patterns"
3. Refactoring.Guru - https://refactoring.guru/design-patterns
4. "Patterns of Enterprise Application Architecture" - Martin Fowler
```
