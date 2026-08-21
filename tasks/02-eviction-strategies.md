# Tasks 02: Eviction Strategies

> Module 2: LRU, LFU, FIFO eviction policies

---

## Mục tiêu

Implement các eviction policies để xóa data khi cache đầy.

---

## Dependencies

```
Không cần cài thêm
```

---

## Files sẽ tạo

### ⬜ src/strategies/index.ts

```
Mục đích: Export interface và tất cả strategies

Sẽ tạo:
  - Interface EvictionStrategy:
    - onAccess(key: string): void
    - onInsert(key: string): void
    - onEvict(): string | null
    - onRemove(key: string): void
    - getSize(): number

  - Type EvictionPolicy = 'lru' | 'lfu' | 'fifo'

  - Export all:
    export { EvictionStrategy, EvictionPolicy }
    export { LRUStrategy } from './lru'
    export { LFUStrategy } from './lfu'
    export { FIFOStrategy } from './fifo'

Tham chiếu: Không
Sửa đổi: Không (file mới)
```

### ⬜ src/strategies/lru.ts

```
Mục đích: Least Recently Used eviction strategy

Sẽ tạo:
  - import { EvictionStrategy } from './index'

  Class LRUStrategy implements EvictionStrategy:
    Private: accessOrder: string[]

    onAccess(key: string): void:
      - const index = accessOrder.indexOf(key)
      - Nếu tìm thấy → xóa khỏi vị trí hiện tại (splice)
      - Chèn vào đầu mảng (unshift)
      - Purpose: Đánh dấu key vừa được truy cập

    onInsert(key: string): void:
      - accessOrder.unshift(key)
      - Purpose: Thêm key mới vào đầu (most recent)

    onEvict(): string | null:
      - Nếu accessOrder rỗng → return null
      - const key = accessOrder.pop()
      - return key
      - Purpose: Xóa key cuối cùng (least recent)

    onRemove(key: string): void:
      - const index = accessOrder.indexOf(key)
      - Nếu tìm thấy → splice(index, 1)
      - Purpose: Xóa key khỏi tracking

    getSize(): number:
      - return accessOrder.length

Tham chiếu:
  - EvictionStrategy từ './index'

Sửa đổi: Không (file mới)
```

### ⬜ src/strategies/lfu.ts

```
Mục đích: Least Frequently Used eviction strategy

Sẽ tạo:
  - import { EvictionStrategy } from './index'

  Class LFUStrategy implements EvictionStrategy:
    Private: frequencies: Map<string, number>

    onAccess(key: string): void:
      - const freq = frequencies.get(key) || 0
      - frequencies.set(key, freq + 1)
      - Purpose: Tăng tần suất truy cập

    onInsert(key: string): void:
      - frequencies.set(key, 1)
      - Purpose: Bắt đầu với frequency = 1

    onEvict(): string | null:
      - Nếu frequencies rỗng → return null
      - Tìm key có frequency thấp nhất
      - let minKey = null, minFreq = Infinity
      - Duyệt frequencies, tìm min
      - Xóa minKey khỏi frequencies
      - return minKey
      - Purpose: Xóa key ít dùng nhất

    onRemove(key: string): void:
      - frequencies.delete(key)
      - Purpose: Xóa khỏi tracking

    getSize(): number:
      - return frequencies.size

Tham chiếu:
  - EvictionStrategy từ './index'

Sửa đổi: Không (file mới)
```

### ⬜ src/strategies/fifo.ts

```
Mục đích: First In First Out eviction strategy

Sẽ tạo:
  - import { EvictionStrategy } from './index'

  Class FIFOStrategy implements EvictionStrategy:
    Private: queue: string[]

    onAccess(key: string): void:
      - Không làm gì
      - Purpose: FIFO không quan tâm access pattern

    onInsert(key: string): void:
      - queue.push(key)
      - Purpose: Thêm vào cuối queue

    onEvict(): string | null:
      - Nếu queue rỗng → return null
      - const key = queue.shift()
      - return key
      - Purpose: Xóa key đầu tiên (oldest)

    onRemove(key: string): void:
      - const index = queue.indexOf(key)
      - Nếu tìm thấy → splice(index, 1)
      - Purpose: Xóa khỏi queue

    getSize(): number:
      - return queue.length

Tham chiếu:
  - EvictionStrategy từ './index'

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

### ⬜ tests/strategies/lru.test.ts

```
Test cases:
  1. describe('LRUStrategy')
     - describe('onAccess')
       - it('should move key to front')
       - it('should handle multiple accesses')
     - describe('onInsert')
       - it('should add key to front')
     - describe('onEvict')
       - it('should return least recently used key')
       - it('should return null when empty')
       - it('should update order after access')
     - describe('onRemove')
       - it('should remove specific key')
```

### ⬜ tests/strategies/lfu.test.ts

```
Test cases:
  1. describe('LFUStrategy')
     - describe('onAccess')
       - it('should increment frequency')
       - it('should handle multiple accesses')
     - describe('onInsert')
       - it('should set frequency to 1')
     - describe('onEvict')
       - it('should return lowest frequency key')
       - it('should return null when empty')
       - it('should handle equal frequencies')
     - describe('onRemove')
       - it('should remove key from tracking')
```

### ⬜ tests/strategies/fifo.test.ts

```
Test cases:
  1. describe('FIFOStrategy')
     - describe('onAccess')
       - it('should not change order')
     - describe('onInsert')
       - it('should add key to end')
     - describe('onEvict')
       - it('should return oldest key')
       - it('should return null when empty')
     - describe('onRemove')
       - it('should remove specific key')
```

---

## Changelog

```
2026-08-21: Tạo file tasks
```

---

## Commit message dự kiến

```
feat(strategy): add LRU, LFU, FIFO eviction strategies

- Add src/strategies/index.ts: EvictionStrategy interface
- Add src/strategies/lru.ts: LRUStrategy class
- Add src/strategies/lfu.ts: LFUStrategy class
- Add src/strategies/fifo.ts: FIFOStrategy class
- Add tests/strategies/*.test.ts

Each strategy implements EvictionStrategy interface:
  - LRU: tracks access order, evicts least recent
  - LFU: tracks frequency, evicts least frequent
  - FIFO: tracks insertion order, evicts oldest
```
