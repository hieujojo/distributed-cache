/**
 * Cache Node - Lưu trữ key-value pairs trong memory
 */

import { CacheEntry, Value, NodeConfig } from './types';
import { FileStorage, FileStorageConfig } from '../persistence/file-storage';

/**
 * Cache Node
 */
export class CacheNode {
  readonly id: string;
  private maxSize: number;
  private defaultTtl: number;
  private store: Map<string, CacheEntry>;

  constructor(id: string, config?: Partial<NodeConfig>) {
    this.id = id;
    this.maxSize = config?.maxSize ?? 1000;
    this.defaultTtl = config?.defaultTtl ?? 60000;
    this.store = new Map();
  }

  /**
   * Lấy giá trị từ cache
   * @param key - Key cần lấy
   * @returns Value hoặc null nếu không có hoặc đã hết hạn
   */
  get(key: string): Value | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Kiểm tra hết hạn
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Cập nhật access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();

    return entry.value;
  }

  /**
   * Lưu giá trị vào cache
   * @param key - Key
   * @param value - Giá trị
   * @param ttl - Time to live (ms), null = không hết hạn
   */
  set(key: string, value: Value, ttl?: number): void {
    const now = Date.now();

    const entry: CacheEntry = {
      key,
      value,
      createdAt: now,
      expiresAt: ttl !== undefined ? now + ttl : now + this.defaultTtl,
      accessCount: 0,
      lastAccessedAt: now,
    };

    this.store.set(key, entry);
  }

  /**
   * Xóa key khỏi cache
   * @param key - Key cần xóa
   * @returns true nếu xóa thành công
   */
  delete(key: string): boolean {
    return this.store.delete(key);
  }

  /**
   * Kiểm tra key có tồn tại không
   * @param key - Key cần kiểm tra
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Kiểm tra hết hạn
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Số lượng entries hiện tại
   */
  getSize(): number {
    return this.store.size;
  }

  /**
   * Số lượng entries tối đa
   */
  getMaxSize(): number {
    return this.maxSize;
  }

  /**
   * Xóa tất cả entries
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Lấy tất cả keys
   */
  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  /**
   * Lấy store (dùng cho persistence)
   */
  getStore(): Map<string, CacheEntry> {
    return this.store;
  }

  /**
   * Load entries từ Map
   */
  loadEntries(entries: Map<string, CacheEntry>): void {
    this.store = entries;
  }

  // ─── Persistence ────────────────────────────────────────────

  private storage: FileStorage | null = null;

  /**
   * Setup persistence cho node này
   * @param config - FileStorage config
   */
  enablePersistence(config: FileStorageConfig): void {
    this.storage = new FileStorage(this.id, config);
    this.storage.updateEntries(this.store);
  }

  /**
   * Load data từ file
   * @returns true nếu load thành công
   */
  loadFromDisk(): boolean {
    if (!this.storage) return false;

    const success = this.storage.load();
    if (success) {
      this.store = this.storage.getStore();
    }
    return success;
  }

  /**
   * Save data vào file
   * @returns true nếu save thành công
   */
  saveToDisk(): boolean {
    if (!this.storage) return false;

    this.storage.updateEntries(this.store);
    return this.storage.save();
  }

  /**
   * Bắt đầu auto save
   */
  startAutoSave(): void {
    this.storage?.startAutoSave();
  }

  /**
   * Dừng auto save
   */
  stopAutoSave(): void {
    this.storage?.stopAutoSave();
  }

  /**
   * Kiểm tra có bật persistence không
   */
  isPersistenceEnabled(): boolean {
    return this.storage !== null;
  }
}
