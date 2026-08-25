/**
 * File Storage - Lưu/đọc cache data từ file
 *
 * Format: JSON file với metadata
 * - data: Map<string, CacheEntry>
 * - metadata: createdAt, nodeCount, etc.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CacheEntry } from '../core/types';

/** Metadata khi lưu file */
export interface StorageMetadata {
  /** Thời gian tạo file */
  createdAt: number;
  /** Số lượng entries */
  entryCount: number;
  /** Node ID */
  nodeId: string;
}

/** Data format khi lưu */
export interface StorageData {
  metadata: StorageMetadata;
  entries: CacheEntry[];
}

/** Config cho FileStorage */
export interface FileStorageConfig {
  /** Đường dẫn file lưu */
  filePath: string;
  /** Auto save interval (ms), 0 = không auto save */
  autoSaveInterval?: number;
}

/**
 * FileStorage - Lưu/đọc cache từ file
 */
export class FileStorage {
  private filePath: string;
  private autoSaveInterval: number;
  private saveTimer: ReturnType<typeof setInterval> | null;
  private entries: Map<string, CacheEntry>;
  private nodeId: string;

  constructor(nodeId: string, config: FileStorageConfig) {
    this.nodeId = nodeId;
    this.filePath = config.filePath;
    this.autoSaveInterval = config.autoSaveInterval ?? 0;
    this.saveTimer = null;
    this.entries = new Map();
  }

  /**
   * Load data từ file
   * @returns true nếu load thành công, false nếu file không tồn tại hoặc lỗi
   */
  load(): boolean {
    try {
      if (!fs.existsSync(this.filePath)) {
        return false;
      }

      const rawData = fs.readFileSync(this.filePath, 'utf-8');
      const data: StorageData = JSON.parse(rawData);

      // Validate metadata
      if (!data.metadata || !Array.isArray(data.entries)) {
        return false;
      }

      // Convert entries sang Map
      this.entries.clear();
      for (const entry of data.entries) {
        // Bỏ qua entries đã hết hạn
        if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
          continue;
        }
        this.entries.set(entry.key, entry);
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Save data vào file
   * @returns true nếu save thành công
   */
  save(): boolean {
    try {
      const data: StorageData = {
        metadata: {
          createdAt: Date.now(),
          entryCount: this.entries.size,
          nodeId: this.nodeId,
        },
        entries: Array.from(this.entries.values()),
      };

      // Tạo directory nếu chưa có
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Compact JSON — reduces memory spike + file size during save
      fs.writeFileSync(this.filePath, JSON.stringify(data), 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Bắt đầu auto save
   */
  startAutoSave(): void {
    if (this.autoSaveInterval <= 0) return;
    if (this.saveTimer) return;

    this.saveTimer = setInterval(() => {
      this.save();
    }, this.autoSaveInterval);
  }

  /**
   * Dừng auto save
   */
  stopAutoSave(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
  }

  /**
   * Cập nhật entries từ CacheNode
   * @param entries - Map của CacheEntry
   */
  updateEntries(entries: Map<string, CacheEntry>): void {
    this.entries = entries;
  }

  /**
   * Lấy store (dùng cho CacheNode load)
   */
  getStore(): Map<string, CacheEntry> {
    return this.entries;
  }

  /**
   * Lấy số lượng entries
   */
  getEntryCount(): number {
    return this.entries.size;
  }

  /**
   * Kiểm tra file có tồn tại không
   */
  fileExists(): boolean {
    return fs.existsSync(this.filePath);
  }

  /**
   * Xóa file
   */
  deleteFile(): void {
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath);
    }
  }
}
