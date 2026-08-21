/**
 * Eviction Strategy Interface
 */

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
 * Loại eviction policy
 */
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo';
