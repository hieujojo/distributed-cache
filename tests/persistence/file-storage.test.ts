/**
 * Unit tests cho FileStorage
 */

import * as fs from 'fs';
import * as path from 'path';
import { FileStorage } from '../../src/persistence/file-storage';
import { CacheEntry } from '../../src/core/types';

// Test file path
const TEST_DIR = path.join(__dirname, '../../test-data');
const TEST_FILE = path.join(TEST_DIR, 'test-cache.json');

// Cleanup sau mỗi test
afterEach(() => {
  if (fs.existsSync(TEST_FILE)) {
    fs.unlinkSync(TEST_FILE);
  }
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
});

describe('FileStorage', () => {
  describe('Constructor', () => {
    it('should create FileStorage with config', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      expect(storage).toBeDefined();
      expect(storage.getEntryCount()).toBe(0);
    });
  });

  describe('save()', () => {
    it('should save empty entries to file', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      const result = storage.save();

      expect(result).toBe(true);
      expect(fs.existsSync(TEST_FILE)).toBe(true);
    });

    it('should save entries to file', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      // Thêm entries
      const entries = new Map<string, CacheEntry>();
      entries.set('key-1', {
        key: 'key-1',
        value: 'value-1',
        createdAt: Date.now(),
        expiresAt: null,
        accessCount: 1,
        lastAccessedAt: Date.now(),
      });
      storage.updateEntries(entries);

      const result = storage.save();

      expect(result).toBe(true);

      // Verify file content
      const content = fs.readFileSync(TEST_FILE, 'utf-8');
      const data = JSON.parse(content);
      expect(data.metadata.nodeId).toBe('node-1');
      expect(data.entries).toHaveLength(1);
      expect(data.entries[0].key).toBe('key-1');
    });
  });

  describe('load()', () => {
    it('should return false if file not exists', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      const result = storage.load();

      expect(result).toBe(false);
    });

    it('should load data from file', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      // Save trước
      const entries = new Map<string, CacheEntry>();
      entries.set('key-1', {
        key: 'key-1',
        value: 'value-1',
        createdAt: Date.now(),
        expiresAt: null,
        accessCount: 1,
        lastAccessedAt: Date.now(),
      });
      storage.updateEntries(entries);
      storage.save();

      // Load lại
      const newStorage = new FileStorage('node-1', { filePath: TEST_FILE });
      const result = newStorage.load();

      expect(result).toBe(true);
      expect(newStorage.getEntryCount()).toBe(1);
    });

    it('should skip expired entries on load', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      // Save entry đã hết hạn
      const entries = new Map<string, CacheEntry>();
      entries.set('key-expired', {
        key: 'key-expired',
        value: 'value-expired',
        createdAt: Date.now() - 10000,
        expiresAt: Date.now() - 5000, // Đã hết hạn
        accessCount: 1,
        lastAccessedAt: Date.now() - 10000,
      });
      entries.set('key-valid', {
        key: 'key-valid',
        value: 'value-valid',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000, // Chưa hết hạn
        accessCount: 1,
        lastAccessedAt: Date.now(),
      });
      storage.updateEntries(entries);
      storage.save();

      // Load lại
      const newStorage = new FileStorage('node-1', { filePath: TEST_FILE });
      const result = newStorage.load();

      expect(result).toBe(true);
      expect(newStorage.getEntryCount()).toBe(1); // Chỉ 1 entry valid
    });
  });

  describe('Auto save', () => {
    it('should start and stop auto save', () => {
      const storage = new FileStorage('node-1', {
        filePath: TEST_FILE,
        autoSaveInterval: 100,
      });

      storage.startAutoSave();
      // Không có lỗi khi gọi第二次
      storage.startAutoSave();

      storage.stopAutoSave();
      // Không có lỗi khi gọi第二次
      storage.stopAutoSave();
    });
  });

  describe('fileExists()', () => {
    it('should return false if file not exists', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      expect(storage.fileExists()).toBe(false);
    });

    it('should return true after save', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      storage.save();

      expect(storage.fileExists()).toBe(true);
    });
  });

  describe('deleteFile()', () => {
    it('should delete file', () => {
      const storage = new FileStorage('node-1', { filePath: TEST_FILE });

      storage.save();
      expect(storage.fileExists()).toBe(true);

      storage.deleteFile();
      expect(storage.fileExists()).toBe(false);
    });
  });
});

describe('CacheNode Persistence', () => {
  const { CacheNode } = require('../../src/core/node');

  it('should enable persistence', () => {
    const node = new CacheNode('node-1');

    node.enablePersistence({ filePath: TEST_FILE });

    expect(node.isPersistenceEnabled()).toBe(true);
  });

  it('should save and load from disk', () => {
    const node = new CacheNode('node-1');

    node.enablePersistence({ filePath: TEST_FILE });

    // Set data
    node.set('key-1', 'value-1');
    node.set('key-2', 'value-2');

    // Save
    const saved = node.saveToDisk();
    expect(saved).toBe(true);

    // Tạo node mới và load
    const node2 = new CacheNode('node-1');
    node2.enablePersistence({ filePath: TEST_FILE });

    const loaded = node2.loadFromDisk();
    expect(loaded).toBe(true);
    expect(node2.get('key-1')).toBe('value-1');
    expect(node2.get('key-2')).toBe('value-2');
  });
});
