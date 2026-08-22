/**
 * Tests cho CacheClient
 */

import { CacheServer } from '../../src/server/cache-server';
import { CacheClient } from '../../src/server/client';
import { CacheNode } from '../../src/core/node';

function getPort(): number {
  return 10000 + Math.floor(Math.random() * 50000);
}

describe('CacheClient', () => {
  let server: CacheServer;
  let client: CacheClient;
  let port: number;

  beforeEach(async () => {
    port = getPort();
    server = new CacheServer({ host: '127.0.0.1', port });

    const node = new CacheNode('node-1', { maxSize: 100, defaultTtl: 60000 });
    server.addNode(node);

    await server.start();
  });

  afterEach(async () => {
    if (client) {
      await client.disconnect();
    }
    await server.stop();
  });

  // ─── Connect/Disconnect ────────────────────────────────────

  describe('connect/disconnect', () => {
    it('should connect to server', async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      await client.connect();

      expect(client.isClientConnected()).toBe(true);
    });

    it('should disconnect from server', async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      await client.connect();
      await client.disconnect();

      expect(client.isClientConnected()).toBe(false);
    });

    it('should resolve immediately if already connected', async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      await client.connect();
      // Connect lần nữa
      await client.connect();

      expect(client.isClientConnected()).toBe(true);
    });

    it('should resolve immediately if not connected on disconnect', async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      // Chưa connect mà disconnect
      await client.disconnect();

      expect(client.isClientConnected()).toBe(false);
    });

    it('should reject on connection timeout', async () => {
      // Kết nối tới port không tồn tại
      const badClient = new CacheClient({
        host: '127.0.0.1',
        port: getPort(),
        timeout: 500,
      });

      await expect(badClient.connect()).rejects.toThrow();
    });
  });

  // ─── Operations ──────────────────────────────────────────────

  describe('operations', () => {
    beforeEach(async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      await client.connect();
    });

    it('should set and get value', async () => {
      await client.set('user:123', 'John');
      const value = await client.get('user:123');

      expect(value).toBe('John');
    });

    it('should get null for non-existing key', async () => {
      const value = await client.get('nonexistent');

      expect(value).toBeNull();
    });

    it('should delete key', async () => {
      await client.set('key', 'value');
      const deleted = await client.del('key');

      expect(deleted).toBe(true);

      const value = await client.get('key');
      expect(value).toBeNull();
    });

    it('should return false when deleting non-existing key', async () => {
      const deleted = await client.del('nonexistent');

      expect(deleted).toBe(false);
    });

    it('should ping server', async () => {
      const pong = await client.ping();

      expect(pong).toBe(true);
    });
  });

  // ─── Error handling ─────────────────────────────────────────

  describe('error handling', () => {
    it('should throw if not connected', async () => {
      client = new CacheClient({ host: '127.0.0.1', port });

      await expect(client.get('key')).rejects.toThrow('Not connected');
    });

    it('should throw on GET error from server', async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      await client.connect();

      // Server không có nodes → sẽ trả lỗi
      const emptyServer = new CacheServer({ host: '127.0.0.1', port: getPort() });
      await emptyServer.start();

      const emptyClient = new CacheClient({ host: '127.0.0.1', port: emptyServer['config'].port });
      await emptyClient.connect();

      await expect(emptyClient.get('key')).rejects.toThrow();

      await emptyClient.disconnect();
      await emptyServer.stop();
    });
  });

  // ─── Multiple operations ───────────────────────────────────

  describe('multiple operations', () => {
    beforeEach(async () => {
      client = new CacheClient({ host: '127.0.0.1', port });
      await client.connect();
    });

    it('should handle many SET/GET operations', async () => {
      const count = 50;

      for (let i = 0; i < count; i++) {
        await client.set(`key:${i}`, `value:${i}`);
      }

      for (let i = 0; i < count; i++) {
        const value = await client.get(`key:${i}`);
        expect(value).toBe(`value:${i}`);
      }
    });

    it('should handle SET overwrite and GET', async () => {
      await client.set('key', 'first');
      await client.set('key', 'second');
      const value = await client.get('key');

      expect(value).toBe('second');
    });

    it('should handle SET, DEL, GET sequence', async () => {
      await client.set('key', 'value');
      await client.del('key');
      const value = await client.get('key');

      expect(value).toBeNull();
    });
  });
});
