/**
 * Eviction Strategy Interface + Factory
 */

import { EvictionPolicy } from '../core/types';

/** LRU Strategy */
import { LRUStrategy } from './lru';
/** LFU Strategy */
import { LFUStrategy } from './lfu';
/** FIFO Strategy */
import { FIFOStrategy } from './fifo';

/**
 * Interface cho eviction strategies
 */
export interface EvictionStrategy {
  /**
   * Gọi khi key được truy cập
   * @param key - Key vừa truy cập
   */
  onAccess(key: string): void;

  /**
   * Gọi khi key mới được thêm
   * @param key - Key vừa thêm
   */
  onInsert(key: string): void;

  /**
   * Trả về key cần evict
   * @returns Key cần xóa, hoặc null nếu không có
   */
  onEvict(): string | null;

  /**
   * Gọi khi key bị xóa thủ công
   * @param key - Key bị xóa
   */
  onRemove(key: string): void;

  /**
   * Số lượng entries đang track
   */
  getSize(): number;
}

/**
 * Re-export EvictionPolicy cho convenience
 */
export type { EvictionPolicy };

/**
 * Factory — tạo EvictionStrategy từ policy name
 */
export function createEvictionStrategy(policy: EvictionPolicy): EvictionStrategy {
  switch (policy) {
    case 'lfu':
      return new LFUStrategy();
    case 'fifo':
      return new FIFOStrategy();
    case 'lru':
    default:
      return new LRUStrategy();
  }
}
