/**
 * Cache Node - Lưu trữ key-value pairs trong memory
 *
 * RAM-FOCUS:
 *   - Respect maxSize: uses eviction strategy to drop entries when full
 *   - Background TTL sweep: periodic cleanup of expired entries so they
 *     don't silently accumulate in RAM.
 */

import { CacheEntry, Value, NodeConfig, EvictionPolicy } from './types';
import { EvictionStrategy, createEvictionStrategy } from '../strategies/index';
import { FileStorage, FileStorageConfig } from '../persistence/file-storage';
import { totalmem } from 'os';

/** Default sweep interval — 30 s */
const DEFAULT_SWEEP_MS = 30_000;

/**
 * Cache Node — core in-memory key-value store with eviction + TTL sweep
 */
export class CacheNode {
  readonly id: string;
  private maxSize: number;
  private defaultTtl: number;
  private store: Map<string, CacheEntry>;
  private eviction: EvictionStrategy;
  private sweepTimer: ReturnType<typeof setInterval> | null;
  private onEvicted?: (key: string) => void;
  private autoFlushPercent: number;
  private autoFlushTimer: ReturnType<typeof setInterval> | null;
  private onAutoFlush?: (freed: number) => void;

  constructor(id: string, config?: Partial<NodeConfig>) {
    this.id = id;
    this.maxSize = config?.maxSize ?? 1000;
    this.defaultTtl = config?.defaultTtl ?? 60000;
    this.store = new Map();

    // --- Eviction strategy ---
    const policy: EvictionPolicy = config?.evictionPolicy ?? 'lru';
    this.eviction = createEvictionStrategy(policy);

    // --- TTL sweep ---
    const sweepMs = config?.sweepIntervalMs ?? DEFAULT_SWEEP_MS;
    this.sweepTimer = sweepMs > 0 ? this.startSweep(sweepMs) : null;

    // --- Eviction callback ---
    this.onEvicted = config?.onEvicted;

    // --- Auto-flush on memory pressure ---
    this.autoFlushPercent = config?.autoFlushPercent ?? 0;
    this.autoFlushTimer = null;
    if (this.autoFlushPercent > 0) {
      this.autoFlushTimer = this.startAutoFlush(10_000);
    }
  }

  // ─── Public API ────────────────────────────────────────────────

  /**
   * Lấy giá trị từ cache
   */
  get(key: string): Value | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    // Kiểm tra hết hạn
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.eviction.onRemove(key);
      return null;
    }

    // Cập nhật access stats
    entry.accessCount++;
    entry.lastAccessedAt = Date.now();

    // Thông báo cho eviction strategy
    this.eviction.onAccess(key);

    return entry.value;
  }

  /**
   * Lưu giá trị vào cache.
   * Khi store > maxSize → gọi eviction strategy để loại bỏ nạn nhân.
   */
  set(key: string, value: Value, ttl?: number): void {
    const now = Date.now();

    // Nếu key đã tồn tại → gỡ khỏi strategy trước khi insert lại
    if (this.store.has(key)) {
      this.eviction.onRemove(key);
    }

    const entry: CacheEntry = {
      key,
      value,
      createdAt: now,
      expiresAt: ttl !== undefined ? now + ttl : now + this.defaultTtl,
      accessCount: 0,
      lastAccessedAt: now,
    };

    this.store.set(key, entry);
    this.eviction.onInsert(key);

    // ═══ RAM-FOCUS: enforce maxSize ═══
    this.enforceMaxSize();
  }

  /**
   * Xóa key khỏi cache
   */
  delete(key: string): boolean {
    const existed = this.store.delete(key);
    if (existed) {
      this.eviction.onRemove(key);
      this.onEvicted?.(key);
    }
    return existed;
  }

  /**
   * Kiểm tra key có tồn tại không
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Kiểm tra hết hạn
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.eviction.onRemove(key);
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
   * Xoa tat ca entries + reset strategy + GC hint.
   * @returns So bytes RAM duoc giai phong (truoc/sau)
   */
  clear(): number {
    const before = process.memoryUsage().heapUsed;
    this.store.clear();
    this.eviction = createEvictionStrategy('lru');
    // GC hint: yeu cau Node.js thu hoi memory ngay lap tuc
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }
    const after = process.memoryUsage().heapUsed;
    return Math.max(0, before - after);
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
   * Load entries từ Map — rebuild strategy index
   */
  loadEntries(entries: Map<string, CacheEntry>): void {
    this.store = entries;
    // Rebuild eviction index
    this.eviction = createEvictionStrategy('lru');
    for (const key of this.store.keys()) {
      this.eviction.onInsert(key);
    }
    this.enforceMaxSize();
  }

  /**
   * Dung sweep timer — goi khi tat node / chay test
   */
  stopSweep(): void {
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
      this.sweepTimer = null;
    }
  }

  /**
   * Dung auto-flush timer
   */
  stopAutoFlush(): void {
    if (this.autoFlushTimer) {
      clearInterval(this.autoFlushTimer);
      this.autoFlushTimer = null;
    }
  }

  /**
   * Set callback khi auto-flu duoc trigger
   */
  setOnAutoFlush(callback: (freed: number) => void): void {
    this.onAutoFlush = callback;
  }

  /**
   * Kiem tra RAM he thong — neu vuot nguong thi tu dong flush 50% entries
   */
  checkMemoryAndFlush(): number {
    if (this.autoFlushPercent <= 0) return 0;

    const totalRAM = totalmem();
    const rss = process.memoryUsage().rss;
    const usagePercent = rss / totalRAM;

    if (usagePercent <= this.autoFlushPercent) return 0;

    // Flush 50% entries (khong flush het de tranh mat het cache)
    const targetSize = Math.floor(this.store.size * 0.5);
    const evicted = this.store.size - targetSize;

    for (let i = 0; i < evicted; i++) {
      const victim = this.eviction.onEvict();
      if (victim === null) break;
      if (this.store.has(victim)) {
        this.store.delete(victim);
        this.onEvicted?.(victim);
      }
    }

    // GC hint
    if (typeof globalThis.gc === 'function') {
      globalThis.gc();
    }

    const freed = Math.max(0, rss - process.memoryUsage().rss);
    this.onAutoFlush?.(freed);
    return freed;
  }

  // ─── Persistence ────────────────────────────────────────────────

  private storage: FileStorage | null = null;

  /** Setup persistence cho node này */
  enablePersistence(config: FileStorageConfig): void {
    this.storage = new FileStorage(this.id, config);
    this.storage.updateEntries(this.store);
  }

  /** Load data từ file */
  loadFromDisk(): boolean {
    if (!this.storage) return false;

    const success = this.storage.load();
    if (success) {
      this.store = this.storage.getStore();
      // Rebuild eviction index after loading from disk
      this.eviction = createEvictionStrategy('lru');
      for (const key of this.store.keys()) {
        this.eviction.onInsert(key);
      }
      this.enforceMaxSize();
    }
    return success;
  }

  /** Save data vào file */
  saveToDisk(): boolean {
    if (!this.storage) return false;
    this.storage.updateEntries(this.store);
    return this.storage.save();
  }

  /** Bắt đầu auto save */
  startAutoSave(): void {
    this.storage?.startAutoSave();
  }

  /** Dừng auto save */
  stopAutoSave(): void {
    this.storage?.stopAutoSave();
  }

  /** Kiểm tra có bật persistence không */
  isPersistenceEnabled(): boolean {
    return this.storage !== null;
  }

  // ─── RAM-FOCUS: internals ───────────────────────────────────────

  /**
   * Đuổi bớt entries cho đến khi store.size <= maxSize.
   * O(n) where n = evicted count, nhưng chỉ chạy khi vừa vượt maxSize.
   */
  private enforceMaxSize(): void {
    while (this.store.size > this.maxSize) {
      const victim = this.eviction.onEvict();
      if (victim === null) {
        // Không có gì để evict — tránh vòng lặp vô hạn
        break;
      }
      // Victim có thể đã bị xóa trước đó (expired → lazy delete),
      // kiểm tra trước khi delete khỏi store
      if (this.store.has(victim)) {
        this.store.delete(victim);
        this.onEvicted?.(victim);
      }
    }
  }

  /**
   * Bắt đầu TTL sweep — quét định kỳ xoá expired entries
   * Timer được .unref() để không giữ process Node.js sống.
   */
  private startSweep(intervalMs: number): ReturnType<typeof setInterval> {
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (entry.expiresAt !== null && now > entry.expiresAt) {
          this.store.delete(key);
          this.eviction.onRemove(key);
          this.onEvicted?.(key);
        }
      }
    }, intervalMs);
    // Không giữ process Node.js sống chỉ vì sweep timer
    if (typeof timer === 'object' && 'unref' in timer) {
      timer.unref();
    }
    return timer;
  }

  /**
   * Bat dau auto-flush timer — kiem tra RAM dinh ky
   */
  private startAutoFlush(intervalMs: number): ReturnType<typeof setInterval> {
    const timer = setInterval(() => {
      this.checkMemoryAndFlush();
    }, intervalMs);
    if (typeof timer === 'object' && 'unref' in timer) {
      timer.unref();
    }
    return timer;
  }
}
