/**
 * First In First Out (FIFO) Eviction Strategy
 */

import { EvictionStrategy } from './index';

/**
 * FIFO Strategy - Xóa key cũ nhất
 */
export class FIFOStrategy implements EvictionStrategy {
  private queue: string[];

  constructor() {
    this.queue = [];
  }

  /**
   * Gọi khi key được truy cập
   * FIFO không quan tâm access pattern
   */
  onAccess(_key: string): void {
    // No-op: FIFO không thay đổi order khi access
  }

  /**
   * Gọi khi key mới được thêm
   * Thêm key vào cuối queue
   */
  onInsert(key: string): void {
    this.queue.push(key);
  }

  /**
   * Trả về key cần evict (oldest)
   */
  onEvict(): string | null {
    if (this.queue.length === 0) {
      return null;
    }
    return this.queue.shift() ?? null;
  }

  /**
   * Gọi khi key bị xóa thủ công
   */
  onRemove(key: string): void {
    const index = this.queue.indexOf(key);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
  }

  /**
   * Số lượng entries đang track
   */
  getSize(): number {
    return this.queue.length;
  }
}
