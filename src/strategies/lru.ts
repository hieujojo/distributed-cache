/**
 * Least Recently Used (LRU) Eviction Strategy
 */

import { EvictionStrategy } from './index';

/**
 * LRU Strategy - Xóa key ít được truy cập nhất
 */
export class LRUStrategy implements EvictionStrategy {
  private accessOrder: string[];

  constructor() {
    this.accessOrder = [];
  }

  /**
   * Gọi khi key được truy cập
   * Di chuyển key lên đầu (most recent)
   */
  onAccess(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.unshift(key);
  }

  /**
   * Gọi khi key mới được thêm
   * Thêm key vào đầu (most recent)
   */
  onInsert(key: string): void {
    this.accessOrder.unshift(key);
  }

  /**
   * Trả về key cần evict (least recently used)
   */
  onEvict(): string | null {
    if (this.accessOrder.length === 0) {
      return null;
    }
    return this.accessOrder.pop() ?? null;
  }

  /**
   * Gọi khi key bị xóa thủ công
   */
  onRemove(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Số lượng entries đang track
   */
  getSize(): number {
    return this.accessOrder.length;
  }
}
