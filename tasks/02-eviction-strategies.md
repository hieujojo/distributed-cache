# Tasks 02: Eviction Strategies

> Module 2: LRU, LFU, FIFO eviction policies

---

## Mục tiêu

Implement các eviction policies để xóa data khi cache đầy.

---

## Dependencies

```
✅ Không cần cài thêm
```

---

## Files đã tạo

### ✅ src/strategies/index.ts

```
Mục đích: Export interface và tất cả strategies

Đã tạo:
  ✅ Interface EvictionStrategy
  ✅ Type EvictionPolicy = 'lru' | 'lfu' | 'fifo'
```

### ✅ src/strategies/lru.ts

```
Mục đích: Least Recently Used eviction strategy

Đã tạo:
  ✅ Class LRUStrategy implements EvictionStrategy
  ✅ Private: accessOrder: string[]
  ✅ onAccess(): move to front
  ✅ onInsert(): add to front
  ✅ onEvict(): remove last
  ✅ onRemove(): remove from list
  ✅ getSize(): return accessOrder.length
```

### ✅ src/strategies/lfu.ts

```
Mục đích: Least Frequently Used eviction strategy

Đã tạo:
  ✅ Class LFUStrategy implements EvictionStrategy
  ✅ Private: frequencies: Map<string, number>
  ✅ onAccess(): increment frequency
  ✅ onInsert(): set frequency = 1
  ✅ onEvict(): remove lowest frequency
  ✅ onRemove(): remove from map
  ✅ getSize(): return frequencies.size
```

### ✅ src/strategies/fifo.ts

```
Mục đích: First In First Out eviction strategy

Đã tạo:
  ✅ Class FIFOStrategy implements EvictionStrategy
  ✅ Private: queue: string[]
  ✅ onAccess(): no-op
  ✅ onInsert(): add to end
  ✅ onEvict(): remove first
  ✅ onRemove(): remove from queue
  ✅ getSize(): return queue.length
```

---

## Tests đã tạo

### ✅ tests/strategies/lru.test.ts

```
✅ onAccess — move key to front
✅ onAccess — handle multiple accesses
✅ onInsert — add key to front
✅ onEvict — return least recently used key
✅ onEvict — return null when empty
✅ onRemove — remove specific key
✅ getSize — return correct size
```

### ✅ tests/strategies/lfu.test.ts

```
✅ onAccess — increment frequency
✅ onInsert — set frequency to 1
✅ onEvict — return lowest frequency key
✅ onEvict — return null when empty
✅ onRemove — remove key from tracking
✅ getSize — return correct size
```

### ✅ tests/strategies/fifo.test.ts

```
✅ onAccess — not change order
✅ onInsert — add key to end
✅ onEvict — return oldest key
✅ onEvict — return null when empty
✅ onRemove — remove specific key
✅ getSize — return correct size
```

---

## Kết quả

```
Test Suites: 5 passed, 5 total
Tests:       49 passed, 49 total
```

---

## Changelog

```
2026-08-21: Tạo file tasks
2026-08-21: Hoàn thành Module 2
  - Tạo 4 source files, 3 test files
  - Tất cả 49 tests pass
```

---

## Commits

```
feat(strategy): add eviction strategy interface
feat(strategy): add LRU eviction strategy
feat(strategy): add LFU eviction strategy
feat(strategy): add FIFO eviction strategy
test(strategy): add LRU, LFU, FIFO tests
```
