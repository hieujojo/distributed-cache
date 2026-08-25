/**
 * Types và interfaces chung cho distributed cache system
 */

/**
 * Giá trị có thể lưu trong cache
 */
export type Value = string | number | boolean | object | null;

/**
 * Loại eviction policy
 */
export type EvictionPolicy = 'lru' | 'lfu' | 'fifo';

/**
 * Entry lưu trong cache node
 */
export interface CacheEntry {
  /** Key của entry */
  key: string;
  /** Giá trị lưu trữ */
  value: Value;
  /** Thời gian tạo */
  createdAt: number;
  /** Thời gian hết hạn (null = không hết hạn) */
  expiresAt: number | null;
  /** Số lần truy cập */
  accessCount: number;
  /** Thời gian truy cập cuối cùng */
  lastAccessedAt: number;
}

/**
 * Config cho CacheNode
 */
export interface NodeConfig {
  /** Số lượng key tối đa */
  maxSize: number;
  /** TTL mặc định (ms) */
  defaultTtl: number;
  /**
   * Loại eviction policy khi vượt maxSize.
   * 'lru' = Least Recently Used (mặc định)
   * 'lfu' = Least Frequently Used
   * 'fifo' = First In First Out
   */
  evictionPolicy?: EvictionPolicy;
  /**
   * Khoảng thời gian quét xoá entry hết hạn (ms).
   * 0 = tắt sweep (chỉ lazy delete).
   * Mặc định = 30000 (30 giây).
   */
  sweepIntervalMs?: number;
  /**
   * Callback được gọi khi key bị eviction hoặc xóa.
   * Dùng để dọn dẹp external tracking (ví dụ: replicatedKeys).
   */
  onEvicted?: (key: string) => void;
}

/**
 * Config cho ConsistentHash
 */
export interface HashConfig {
  /** Số lượng virtual nodes */
  virtualNodes: number;
  /** Hash function tùy chỉnh (optional) */
  hashFunction?: HashFunction;
}

/**
 * Hash function type
 */
export type HashFunction = (key: string) => number;
