# Tasks 01: Core Foundation

> Module 1: Consistent Hashing + Cache Node

---

## Mục tiêu

Implement consistent hashing algorithm và cache node cơ bản.

---

## Dependencies

```
✅ Đã cài: npm install murmurhash
```

---

## Files đã tạo

### ✅ src/core/types.ts

```
Mục đích: Định nghĩa interfaces và types chung cho toàn project

Đã tạo:
  ✅ type Value = string | number | boolean | object | null
  ✅ interface CacheEntry { key, value, createdAt, expiresAt, accessCount, lastAccessedAt }
  ✅ interface NodeConfig { maxSize: number, defaultTtl: number }
  ✅ interface HashConfig { virtualNodes: number, hashFunction?: HashFunction }
  ✅ type HashFunction = (key: string) => number
```

### ✅ src/core/hash-helpers.ts

```
Mục đích: Helper functions cho hashing

Đã tạo:
  ✅ import murmur from 'murmurhash'
  ✅ function murmurHash(key: string): number
  ✅ function sortedInsert(positions: number[], pos: number): number
  ✅ function sortedRemove(positions: number[], pos: number): number
```

### ✅ src/core/consistent-hashing.ts

```
Mục đích: Implement hash ring với virtual nodes

Đã tạo:
  ✅ interface HashNode { id: string }
  ✅ Class ConsistentHash
    ✅ Constructor(config?: Partial<HashConfig>)
    ✅ getNode(key: string): HashNode | null
    ✅ addNode(node: HashNode): void
    ✅ removeNode(nodeId: string): void
    ✅ getKeyDistribution(): Map<string, number>
    ✅ getRingSize(): number
    ✅ hasNode(nodeId: string): boolean
    ✅ getNodes(): HashNode[]
    ✅ Private: hashKey(), binarySearch()
```

### ✅ src/core/node.ts

```
Mục đích: Cache node lưu trữ key-value pairs

Đã tạo:
  ✅ Class CacheNode
    ✅ Constructor(id: string, config?: Partial<NodeConfig>)
    ✅ get(key: string): Value | null
    ✅ set(key: string, value: Value, ttl?: number): void
    ✅ delete(key: string): boolean
    ✅ has(key: string): boolean
    ✅ getSize(): number
    ✅ getMaxSize(): number
    ✅ clear(): void
    ✅ getKeys(): string[]
```

---

## Tests đã tạo

### ✅ tests/core/consistent-hashing.test.ts

```
Test cases đã pass:
  ✅ getNode — return null when ring empty
  ✅ getNode — return same node for same key
  ✅ getNode — return node for any key
  ✅ addNode — add node to ring
  ✅ addNode — handle multiple virtual nodes
  ✅ addNode — distribute keys across nodes
  ✅ removeNode — remove node from ring
  ✅ removeNode — redistribute keys to remaining nodes
  ✅ getKeyDistribution — return distribution map
  ✅ getRingSize — return number of positions
  ✅ hasNode — return true for existing node
  ✅ hasNode — return false for non-existing node
  ✅ getNodes — return all nodes
```

### ✅ tests/core/node.test.ts

```
Test cases đã pass:
  ✅ get — return null for non-existing key
  ✅ get — return value for existing key
  ✅ get — return null for expired key
  ✅ get — update accessCount on get
  ✅ set — store key-value pair
  ✅ set — store different value types
  ✅ set — overwrite existing key
  ✅ set — set custom TTL
  ✅ delete — delete existing key
  ✅ delete — return false for non-existing key
  ✅ has — return true for existing key
  ✅ has — return false for non-existing key
  ✅ has — return false for expired key
  ✅ getSize — return number of entries
  ✅ getMaxSize — return max size
  ✅ clear — clear all entries
  ✅ getKeys — return all keys
```

---

## Kết quả

```
Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
Coverage:    Đủ (cần check chi tiết)
```

---

## Changelog

```
2026-08-21: Tạo file tasks
2026-08-21: Hoàn thành Module 1
  - Tạo .gitignore, jest.config.cjs
  - Cài murmurhash (pure JS, không cần native)
  - Tạo 4 source files, 2 test files
  - Tất cả 30 tests pass
```

---

## Commit message

```
feat(core): add consistent hashing and cache node implementation

- Add src/core/types.ts: Value, CacheEntry, NodeConfig, HashConfig
- Add src/core/hash-helpers.ts: murmurHash, sortedInsert, sortedRemove
- Add src/core/consistent-hashing.ts: ConsistentHash class
- Add src/core/node.ts: CacheNode class
- Add tests/core/consistent-hashing.test.ts (13 tests)
- Add tests/core/node.test.ts (17 tests)
- Install murmurhash dependency
- Add .gitignore, jest.config.cjs

All 30 tests passing.
```
