/**
 * Invalidation Manager - Quản lý TTL và event-driven invalidation
 *
 * Responsibilities:
 *   - Set/get TTL cho cache keys
 *   - Manual invalidation (xóa key)
 *   - Event-driven invalidation (subscribe/unsubscribe)
 *   - Automatic expiration check (interval-based)
 */

import { EventEmitter } from 'events';

/** Loại invalidation event */
export type InvalidationEventType = 'KEY_UPDATED' | 'KEY_DELETED' | 'KEY_EXPIRED';

/** Invalidation event */
export interface InvalidationEvent {
  /** Loại event */
  type: InvalidationEventType;
  /** Key bị ảnh hưởng */
  key: string;
  /** Thời gian xảy ra */
  timestamp: number;
}

/** Callback type cho subscription */
export type InvalidationCallback = (event: InvalidationEvent) => void;

/**
 * InvalidationManager - Quản lý cache invalidation
 */
export class InvalidationManager {
  private ttlMap: Map<string, number>;
  private eventEmitter: EventEmitter;
  private checkInterval: ReturnType<typeof setInterval> | null;

  constructor() {
    this.ttlMap = new Map();
    this.eventEmitter = new EventEmitter();
    this.checkInterval = null;
    this.startExpirationCheck();
  }

  /**
   * Set TTL cho key
   * @param key - Key cần set TTL
   * @param ttl - Time to live (ms)
   */
  setTTL(key: string, ttl: number): void {
    const expiresAt = Date.now() + ttl;
    this.ttlMap.set(key, expiresAt);
  }

  /**
   * Kiểm tra key có còn valid không
   * @param key - Key cần kiểm tra
   * @returns true nếu key còn valid (chưa expired)
   */
  checkTTL(key: string): boolean {
    const expiresAt = this.ttlMap.get(key);

    // Không có TTL → coi như valid
    if (expiresAt === undefined) {
      return false;
    }

    // Kiểm tra còn hạn không
    const isValid = Date.now() < expiresAt;

    // Nếu expired → xóa và emit event
    if (!isValid) {
      this.ttlMap.delete(key);
      this.emit({
        type: 'KEY_EXPIRED',
        key,
        timestamp: Date.now(),
      });
    }

    return isValid;
  }

  /**
   * Manual invalidate key
   * @param key - Key cần invalidate
   */
  invalidate(key: string): void {
    this.ttlMap.delete(key);
    this.emit({
      type: 'KEY_DELETED',
      key,
      timestamp: Date.now(),
    });
  }

  /**
   * Xử lý event từ database (database-driven invalidation)
   * @param event - Invalidation event từ database
   */
  onDatabaseChange(event: InvalidationEvent): void {
    switch (event.type) {
      case 'KEY_UPDATED':
        // Key bị update → invalidate để fetch lại
        this.invalidate(event.key);
        break;
      case 'KEY_DELETED':
        // Key bị xóa → invalidate
        this.invalidate(event.key);
        break;
      case 'KEY_EXPIRED':
        // Key expired → xóa khỏi ttlMap
        this.ttlMap.delete(event.key);
        break;
    }
  }

  /**
   * Subscribe để nhận invalidation events
   * @param callback - Callback function
   */
  subscribe(callback: InvalidationCallback): void {
    this.eventEmitter.on('invalidation', callback);
  }

  /**
   * Hủy subscription
   * @param callback - Callback cần hủy
   */
  unsubscribe(callback: InvalidationCallback): void {
    this.eventEmitter.removeListener('invalidation', callback);
  }

  /**
   * Lấy số lượng keys đang có TTL
   */
  getTTLLength(): number {
    return this.ttlMap.size;
  }

  /**
   * Dừng expiration check (dùng khi test hoặc shutdown)
   */
  stopExpirationCheck(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Dispose toan bo resources — goi khi khong con can InvalidationManager.
   * Dọn interval timer + tất cả event listeners để tránh memory leak.
   */
  dispose(): void {
    this.stopExpirationCheck();
    this.eventEmitter.removeAllListeners();
  }

  /**
   * Bắt đầu expiration check (interval-based)
   * Kiểm tra mỗi 1000ms
   */
  private startExpirationCheck(): void {
    this.checkInterval = setInterval(() => {
      const now = Date.now();

      for (const [key, expiresAt] of this.ttlMap) {
        if (now >= expiresAt) {
          this.ttlMap.delete(key);
          this.emit({
            type: 'KEY_EXPIRED',
            key,
            timestamp: now,
          });
        }
      }
    }, 1000);
    // Không giữ process Node.js alive chỉ vì sweep timer
    if (typeof this.checkInterval === 'object' && 'unref' in this.checkInterval) {
      this.checkInterval.unref();
    }
  }

  /**
   * Emit invalidation event
   * @param event - Event cần emit
   */
  private emit(event: InvalidationEvent): void {
    this.eventEmitter.emit('invalidation', event);
  }
}
