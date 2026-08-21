# Design System

> Quy chuẩn thiết kế được áp dụng xuyên suốt project.

---

## Mục lục

1. [Nguyên tắc thiết kế](#1-nguyên-tắc-thiết-kế)
2. [Naming Conventions](#2-naming-conventions)
3. [Code Structure](#3-code-structure)
4. [Error Handling](#4-error-handling)
5. [Logging](#5-logging)
6. [Configuration](#6-configuration)
7. [API Design](#7-api-design)

---

## 1. Nguyên tắc thiết kế

### SOLID Principles

```
S - Single Responsibility: Mỗi class/function làm 1 việc
O - Open/Closed: Mở để extend, đóng để modify
L - Liskov Substitution: Subclass thay thế được parent class
I - Interface Segregation: Chia nhỏ interfaces
D - Dependency Inversion: Phụ thuộc vào abstraction, không phải implementation
```

### KISS (Keep It Simple, Stupid)

```
✅ Viết code đơn giản nhất có thể
✅ Đọc được = maintain được
❌ ĐừngOver-engineer
❌ Đừng show off với complex patterns
```

### YAGNI (You Aren't Gonna Need It)

```
✅ Code cho requirement hiện tại
❌ Đừng code cho "có thể cần sau này"
```

---

## 2. Naming Conventions

### Files

```
src/
├── consistent-hashing.ts    # kebab-case
├── cache-node.ts            # kebab-case
├── replication-manager.ts   # kebab-case
└── hash-ring.tsx            # kebab-case + extension
```

### Classes

```typescript
// PascalCase
class ConsistentHash { }
class CacheNode { }
class ReplicationManager { }
class ClusterManager { }
```

### Interfaces

```typescript
// PascalCase + I prefix (hoặc không prefix tùy preference)
interface CacheNode { }
interface HashRing { }
interface ReplicationStrategy { }
```

### Functions

```typescript
// camelCase
function getNode(key: string): CacheNode { }
function hashValue(value: string): number { }
function replicateData(data: CacheEntry): void { }
```

### Variables

```typescript
// camelCase
const maxRetries = 3;
const heartbeatInterval = 5000;
const defaultVirtualNodes = 150;
```

### Constants

```typescript
// UPPER_SNAKE_CASE
const MAX_CACHE_SIZE = 1024 * 1024;
const DEFAULT_TTL = 60 * 1000;
const HEARTBEAT_TIMEOUT = 15000;
```

---

## 3. Code Structure

### File Structure

```
Mỗi file chỉ export 1 class/function chính:

// consistent-hashing.ts
export class ConsistentHash { ... }

// node.ts
export class CacheNode { ... }

// cluster.ts
export class ClusterManager { ... }
```

### Import Order

```typescript
// 1. Node.js built-in
import { createHash } from 'crypto';
import { Socket } from 'net';

// 2. External packages
import { murmurhash3 } from 'murmurhash';

// 3. Internal modules
import { CacheNode } from './node';
import { HashRing } from './hash-ring';
```

### Class Structure

```typescript
export class ConsistentHash {
  // 1. Private properties
  private ring: Map<number, CacheNode>;
  private sortedPositions: number[];

  // 2. Constructor
  constructor(config: HashConfig) { ... }

  // 3. Public methods
  getNode(key: string): CacheNode { ... }
  addNode(node: CacheNode): void { ... }

  // 4. Private methods
  private hash(key: string): number { ... }
  private binarySearch(hash: number): number { ... }
}
```

---

## 4. Error Handling

### Custom Errors

```typescript
// Tạo custom error cho mỗi loại
export class NodeNotFoundError extends Error {
  constructor(key: string) {
    super(`Node not found for key: ${key}`);
    this.name = 'NodeNotFoundError';
  }
}

export class ConnectionTimeoutError extends Error {
  constructor(nodeId: string) {
    super(`Connection timeout to node: ${nodeId}`);
    this.name = 'ConnectionTimeoutError';
  }
}

export class ClusterQuorumError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClusterQuorumError';
  }
}
```

### Error Handling Pattern

```typescript
// Không swallow errors
try {
  await replicateData(data);
} catch (error) {
  if (error instanceof ConnectionTimeoutError) {
    logger.warn(`Replication timeout for ${nodeId}`);
    // Trigger failover
    await this.triggerFailover(nodeId);
  } else {
    throw error; // Re-throw unknown errors
  }
}
```

---

## 5. Logging

### Log Levels

```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}
```

### Log Format

```typescript
// Structured logging
logger.info('Node added to cluster', {
  nodeId: node.id,
  totalNodes: this.nodes.size,
  timestamp: Date.now(),
});

// Không dùng console.log trong production
console.log('debug');              // ❌
logger.debug('debug info');        // ✅
```

---

## 6. Configuration

### Config File

```typescript
// config.ts
export const config = {
  // Cache
  maxCacheSize: parseInt(process.env.MAX_CACHE_SIZE || '1048576'),
  defaultTTL: parseInt(process.env.DEFAULT_TTL || '60000'),

  // Replication
  replicationFactor: parseInt(process.env.REPLICATION_FACTOR || '3'),
  syncInterval: parseInt(process.env.SYNC_INTERVAL || '1000'),

  // Heartbeat
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL || '5000'),
  heartbeatTimeout: parseInt(process.env.HEARTBEAT_TIMEOUT || '15000'),

  // Hashing
  virtualNodes: parseInt(process.env.VIRTUAL_NODES || '150'),

  // Network
  host: process.env.HOST || 'localhost',
  port: parseInt(process.env.PORT || '3000'),
};
```

### Environment Variables

```bash
# .env.example
MAX_CACHE_SIZE=1048576
DEFAULT_TTL=60000
REPLICATION_FACTOR=3
SYNC_INTERVAL=1000
HEARTBEAT_INTERVAL=5000
HEARTBEAT_TIMEOUT=15000
VIRTUAL_NODES=150
HOST=localhost
PORT=3000
```

---

## 7. API Design

### REST API (Client-facing)

```
GET    /api/nodes              # List all nodes
GET    /api/nodes/:id          # Get node details
GET    /api/stats              # Cluster statistics
GET    /api/health             # Health check
```

### TCP Protocol (Node-to-node)

```
SET <key> <value> [TTL]        # Set key-value
GET <key>                      # Get value
DEL <key>                      # Delete key
PING                           # Heartbeat
REPLICATE <key> <value>        # Replicate data
ELECT <nodeId>                 # Leader election
```

---

## Tóm tắt

| Nguyên tắc | Áp dụng |
|---|---|
| **SOLID** | Mỗi class 1 responsibility |
| **KISS** | Code đơn giản nhất có thể |
| **YAGNI** | Code cho requirement hiện tại |
| **Naming** | kebab-case files, PascalCase classes |
| **Errors** | Custom error classes, không swallow |
| **Logging** | Structured logging, không console.log |
| **Config** | Environment variables |
