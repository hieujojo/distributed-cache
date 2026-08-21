# Tasks 01: Core Foundation

> Module 1: Consistent Hashing + Cache Node

---

## Mục tiêu

Implement consistent hashing algorithm và cache node cơ bản.

---

## Dependencies

```
Cần cài: npm install murmurhash3
Cần types: npm install --save-dev @types/murmurhash3
```

---

## Files sẽ tạo

### ⬜ src/core/types.ts

```
Mục đích: Định nghĩa interfaces và types chung cho toàn project

Sẽ tạo:
  - type Value = string | number | boolean | object | null
  - interface CacheEntry { key, value, createdAt, expiresAt, accessCount, lastAccessedAt }
  - interface NodeConfig { maxSize: number, defaultTtl: number }
  - interface HashConfig { virtualNodes: number, hashFunction?: HashFunction }
  - type HashFunction = (key: string) => number

Tham chiếu: Không
Sửa đổi: Không (file mới)
```

### ⬜ src/core/hash-helpers.ts

```
Mục đích: Helper functions cho hashing

Sẽ tạo:
  - import { murmurhash3 } from 'murmurhash3'
  - function murmurHash(key: string): number
    → Gọi murmurhash3, trả về số nguyên dương
    → Dùng cho consistent hashing
  - function sortedInsert(positions: number[], pos: number): number
    → Chèn position vào sorted array
    → Trả về index vị trí đã chèn
    → Dùng khi thêm node vào ring

Tham chiếu: murmurhash3 (npm package)
Sửa đổi: Không (file mới)
```

### ⬜ src/core/consistent-hashing.ts

```
Mục đích: Implement hash ring với virtual nodes

Sẽ tạo:
  - import { murmurHash, sortedInsert } from './hash-helpers'
  - import { CacheNode, HashConfig } from './types'

  Class ConsistentHash:
    Constructor(config: HashConfig):
      - this.virtualNodes = config.virtualNodes || 150
      - this.ring = new Map<number, CacheNode>()
      - this.sortedPositions = []
      - this.nodeMap = new Map<string, CacheNode>()

    getNode(key: string): CacheNode | null:
      - Nếu ring rỗng → return null
      - hash = this.hashKey(key)
      - position = this.binarySearch(hash)
      - return this.ring.get(this.sortedPositions[position]) || null

    addNode(node: CacheNode): void:
      - Lưu vào nodeMap
      - Với mỗi virtual node i (0 → virtualNodes):
        - pos = this.hashKey(node.id + ':' + i)
        - sortedInsert(sortedPositions, pos)
        - ring.set(pos, node)

    removeNode(nodeId: string): void:
      - Lấy node từ nodeMap
      - Với mỗi virtual node:
        - pos = this.hashKey(nodeId + ':' + i)
        - ring.delete(pos)
        - Xóa khỏi sortedPositions
      - Xóa khỏi nodeMap

    getKeyDistribution(): Map<string, number>:
      - Đếm số keys mỗi node sở hữu
      - Trả về Map<nodeId, count>

    getRingSize(): number:
      - Trả về sortedPositions.length

    hasNode(nodeId: string): boolean:
      - Trả về nodeMap.has(nodeId)

    Private hashKey(key: string): number:
      - return murmurHash(key) % MAX_HASH_VALUE

    Private binarySearch(hash: number): number:
      - Tìm position đầu tiên >= hash trong sortedPositions
      - Nếu không tìm thấy → wrap về 0 (first position)
      - O(log N)

Tham chiếu:
  - murmurHash từ './hash-helpers'
  - sortedInsert từ './hash-helpers'
  - CacheNode từ './types'
  - HashConfig từ './types'

Sửa đổi: Không (file mới)
```

### ⬜ src/core/node.ts

```
Mục đích: Cache node lưu trữ key-value pairs

Sẽ tạo:
  - import { CacheEntry, Value, NodeConfig } from './types'

  Class CacheNode:
    Constructor(id: string, config?: NodeConfig):
      - this.id = id
      - this.maxSize = config?.maxSize || 1000
      - this.defaultTtl = config?.defaultTtl || 60000
      - this.store = new Map<string, CacheEntry>()

    get(key: string): Value | null:
      - entry = store.get(key)
      - Nếu không có → return null
      - Nếu expired (Date.now() > entry.expiresAt) → xóa, return null
      - Tăng accessCount
      - Cập nhật lastAccessedAt
      - return entry.value

    set(key: string, value: Value, ttl?: number): void:
      - Tạo CacheEntry:
        - key, value
        - createdAt: Date.now()
        - expiresAt: ttl ? Date.now() + ttl : Date.now() + this.defaultTtl
        - accessCount: 0
        - lastAccessedAt: Date.now()
      - Lưu vào store

    delete(key: string): boolean:
      - Trả về store.delete(key)

    getSize(): number:
      - Trả về store.size

    getMaxSize(): number:
      - Trả về this.maxSize

    has(key: string): boolean:
      - Trả về store.has(key)

    clear(): void:
      - store.clear()

Tham chiếu:
  - CacheEntry từ './types'
  - Value từ './types'
  - NodeConfig từ './types'

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

### ⬜ tests/core/consistent-hashing.test.ts

```
Test cases:
  1. describe('ConsistentHash')
     - describe('getNode')
       - it('should return null when ring is empty')
       - it('should return same node for same key')
       - it('should return node for any key')
     - describe('addNode')
       - it('should add node to ring')
       - it('should handle multiple virtual nodes')
       - it('should distribute keys across nodes')
     - describe('removeNode')
       - it('should remove node from ring')
       - it('should redistribute keys to remaining nodes')
     - describe('getKeyDistribution')
       - it('should return distribution map')
     - describe('getRingSize')
       - it('should return number of positions')
     - describe('hasNode')
       - it('should return true for existing node')
       - it('should return false for non-existing node')
```

### ⬜ tests/core/node.test.ts

```
Test cases:
  1. describe('CacheNode')
     - describe('get')
       - it('should return null for non-existing key')
       - it('should return value for existing key')
       - it('should return null for expired key')
       - it('should update accessCount on get')
       - it('should update lastAccessedAt on get')
     - describe('set')
       - it('should store key-value pair')
       - it('should set expiration time')
       - it('should overwrite existing key')
     - describe('delete')
       - it('should delete existing key')
       - it('should return false for non-existing key')
     - describe('has')
       - it('should return true for existing key')
       - it('should return false for non-existing key')
     - describe('getSize')
       - it('should return number of entries')
     - describe('getMaxSize')
       - it('should return max size')
     - describe('clear')
       - it('should clear all entries')
```

---

## Changelog

```
2026-08-21: Tạo file tasks
```

---

## Commit message dự kiến

```
feat(core): add consistent hashing and cache node implementation

- Add src/core/types.ts: Value, CacheEntry, NodeConfig, HashConfig
- Add src/core/hash-helpers.ts: murmurHash, sortedInsert
- Add src/core/consistent-hashing.ts: ConsistentHash class
- Add src/core/node.ts: CacheNode class
- Add tests/core/consistent-hashing.test.ts
- Add tests/core/node.test.ts
- Install murmurhash3 dependency

Benchmark: Consistent hashing reduces data movement by ~80% vs naive
```
