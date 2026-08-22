/**
 * Tests cho CacheServer - TCP server
 */

import { CacheServer } from '../../src/server/cache-server';
import { CacheClient } from '../../src/server/client';
import { CacheNode } from '../../src/core/node';

// Port ngẫu nhiên để tránh conflict
function getPort(): number {
  return 10000 + Math.floor(Math.random() * 50000);
}

describe('CacheServer', () => {
  let server: CacheServer;
  let client: CacheClient;
  let port: number;

  beforeEach(async () => {
    port = getPort();
    server = new CacheServer({ host: '127.0.0.1', port });
    client = new CacheClient({ host: '127.0.0.1', port });

    // Thêm node cache
    const node = new CacheNode('node-1', { maxSize: 100, defaultTtl: 60000 });
    server.addNode(node);

    await server.start();
    await client.connect();
  });

  afterEach(async () => {
    await client.disconnect();
    await server.stop();
  });

  // ─── Start/Stop ──────────────────────────────────────────────

  describe('start/stop', () => {
    it('should start server', () => {
      expect(server.isRunning()).toBe(true);
    });

    it('should stop server', async () => {
      await server.stop();
      expect(server.isRunning()).toBe(false);
    });

    it('should report isRunning correctly', async () => {
      const s = new CacheServer({ host: '127.0.0.1', port: getPort() });
      expect(s.isRunning()).toBe(false);

      await s.start();
      expect(s.isRunning()).toBe(true);

      await s.stop();
      expect(s.isRunning()).toBe(false);
    });
  });

  // ─── Operations ──────────────────────────────────────────────

  describe('operations', () => {
    it('should SET and GET value', async () => {
      await client.set('user:123', 'John');
      const value = await client.get('user:123');

      expect(value).toBe('John');
    });

    it('should GET null for non-existing key', async () => {
      const value = await client.get('nonexistent');

      expect(value).toBeNull();
    });

    it('should DEL existing key', async () => {
      await client.set('user:123', 'John');
      const deleted = await client.del('user:123');

      expect(deleted).toBe(true);

      const value = await client.get('user:123');
      expect(value).toBeNull();
    });

    it('should DEL non-existing key', async () => {
      const deleted = await client.del('nonexistent');

      expect(deleted).toBe(false);
    });

    it('should PING server', async () => {
      const pong = await client.ping();

      expect(pong).toBe(true);
    });

    it('should SET with TTL', async () => {
      await client.set('temp', 'data', 60000);
      const value = await client.get('temp');

      expect(value).toBe('data');
    });

    it('should handle number values', async () => {
      await client.set('counter', 42);
      const value = await client.get('counter');

      expect(value).toBe(42);
    });

    it('should handle boolean values', async () => {
      await client.set('active', true);
      const value = await client.get('active');

      expect(value).toBe(true);
    });

    it('should handle object values', async () => {
      const obj = { name: 'John', age: 30 };
      await client.set('user:123', obj);
      const value = await client.get('user:123');

      expect(value).toEqual(obj);
    });

    it('should overwrite existing key', async () => {
      await client.set('key', 'value1');
      await client.set('key', 'value2');
      const value = await client.get('key');

      expect(value).toBe('value2');
    });
  });

  // ─── Multiple nodes ─────────────────────────────────────────

  describe('multiple nodes', () => {
    it('should route to correct node via consistent hashing', async () => {
      const s = new CacheServer({ host: '127.0.0.1', port: getPort() });
      const node1 = new CacheNode('node-a', { maxSize: 100 });
      const node2 = new CacheNode('node-b', { maxSize: 100 });

      s.addNode(node1);
      s.addNode(node2);
      await s.start();

      const c = new CacheClient({ host: '127.0.0.1', port: s['config'].port });
      await c.connect();

      // Set nhiều keys
      await c.set('key1', 'val1');
      await c.set('key2', 'val2');
      await c.set('key3', 'val3');

      // Kiểm tra keys được distribute
      const node1Keys = node1.getKeys();
      const node2Keys = node2.getKeys();
      const totalKeys = node1Keys.length + node2Keys.length;

      expect(totalKeys).toBe(3);

      await c.disconnect();
      await s.stop();
    });
  });

  // ─── Error handling ─────────────────────────────────────────

  describe('error handling', () => {
    it('should handle invalid command', async () => {
      // Gửi raw invalid data
      const response = await sendRaw(client, 'INVALID_CMD\r\n');

      expect(response).toContain('ERROR');
    });
  });
});

// ─── Helper ────────────────────────────────────────────────────

/**
 * Gửi raw data và nhận response thô
 */
async function sendRaw(c: CacheClient, data: string): Promise<string> {
  // Truy cập socket private để gửi raw
  const socket = (c as unknown as { socket: import('net').Socket }).socket;
  return new Promise((resolve) => {
    socket!.write(data);
    socket!.once('data', (buf: Buffer) => {
      resolve(buf.toString());
    });
  });
}
