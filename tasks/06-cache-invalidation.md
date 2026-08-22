# Tasks 06: Cache Invalidation

> Module 6: TTL + event-driven invalidation

---

## Mục tiêu

Implement cache invalidation strategies.

---

## Dependencies

```
Không cần cài thêm
```

---

## Files sẽ tạo

### ✅ src/core/invalidation.ts

```
Mục đích: Quản lý TTL và event-driven invalidation

Sẽ tạo:
  - import { EventEmitter } from 'events'

  - Interface InvalidationEvent:
    - type: 'KEY_UPDATED' | 'KEY_DELETED' | 'KEY_EXPIRED'
    - key: string
    - timestamp: number

  Class InvalidationManager:
    Private ttlMap: Map<string, number>
    Private eventEmitter: EventEmitter
    Private checkInterval: NodeJS.Timeout | null

    Constructor():
      - this.ttlMap = new Map()
      - this.eventEmitter = new EventEmitter()
      - this.startExpirationCheck()

    setTTL(key: string, ttl: number): void:
      - const expiresAt = Date.now() + ttl
      - ttlMap.set(key, expiresAt)

    checkTTL(key: string): boolean:
      - const expiresAt = ttlMap.get(key)
      - Nếu không có → return false (không có TTL)
      - return Date.now() < expiresAt

    invalidate(key: string): void:
      - ttlMap.delete(key)
      - Emit event KEY_DELETED

    onDatabaseChange(event: InvalidationEvent): void:
      - Switch event.type:
        - 'KEY_UPDATED': invalidate key
        - 'KEY_DELETED': invalidate key
        - 'KEY_EXPIRED': xóa khỏi ttlMap

    subscribe(callback: (event: InvalidationEvent) => void): void:
      - eventEmitter.on('invalidation', callback)

    unsubscribe(callback: (event: InvalidationEvent) => void): void:
      - eventEmitter.removeListener('invalidation', callback)

    Private startExpirationCheck():
      - setInterval mỗi 1000ms
      - Duyệt ttlMap
      - Nếu key expired → emit KEY_EXPIRED, xóa

    Private emit(event: InvalidationEvent):
      - eventEmitter.emit('invalidation', event)

Tham chiếu:
  - EventEmitter từ 'events' (Node.js built-in)

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

### ✅ tests/core/invalidation.test.ts

```
Test cases:
  1. describe('InvalidationManager')
     - describe('setTTL')
       - it('should set expiration time')
       - it('should overwrite existing TTL')
     - describe('checkTTL')
       - it('should return true if not expired')
       - it('should return false if expired')
       - it('should return false if no TTL')
     - describe('invalidate')
       - it('should remove key from TTL map')
       - it('should emit KEY_DELETED event')
     - describe('onDatabaseChange')
       - it('should handle KEY_UPDATED event')
       - it('should handle KEY_DELETED event')
       - it('should handle KEY_EXPIRED event')
     - describe('subscribe/unsubscribe')
       - it('should receive invalidation events')
       - it('should stop receiving events after unsubscribe')
```

---

## Changelog

```
2026-08-21: Tạo file tasks
```

---

## Commit message dự kiến

```
feat(core): add cache invalidation manager

- Add src/core/invalidation.ts: InvalidationManager
- Add tests/core/invalidation.test.ts

InvalidationManager supports:
  - TTL-based expiration (lazy check)
  - Manual invalidation
  - Event-driven invalidation (subscribe/unsubscribe)
  - Automatic expiration check (interval-based)
```
