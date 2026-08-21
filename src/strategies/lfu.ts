/**
 * Least Frequently Used (LFU) Eviction Strategy
 */

import { EvictionStrategy } from './index';

/**
 * LFU Strategy - Xóa key ít dùng nhất (theo tần suất)
 */
export class LFUStrategy implements EvictionStrategy {
  private frequencies: Map<string, number>;

  constructor() {
    this.frequencies = new Map();
  }

  /**
   * Gọi khi key được truy cập
   * Tăng tần suất truy cập
   */
  onAccess(key: string): void {
    const freq = this.frequencies.get(key) || 0;
    this.frequencies.set(key, freq + 1);
  }

  /**
   * Gọi khi key mới được thêm
   * Bắt đầu với frequency = 1
   */
  onInsert(key: string): void {
    this.frequencies.set(key, 1);
  }

  /**
   * Trả về key cần evict (lowest frequency)
   */
  onEvict(): string | null {
    if (this.frequencies.size === 0) {
      return null;
    }

    let minKey: string | null = null;
    let minFreq = Infinity;

    for (const [key, freq] of this.frequencies) {
      if (freq < minFreq) {
        minFreq = freq;
        minKey = key;
      }
    }

    if (minKey !== null) {
      this.frequencies.delete(minKey);
    }

    return minKey;
  }

  /**
   * Gọi khi key bị xóa thủ công
   */
  onRemove(key: string): void {
    this.frequencies.delete(key);
  }

  /**
   * Số lượng entries đang track
   */
  getSize(): number {
    return this.frequencies.size;
  }
}
