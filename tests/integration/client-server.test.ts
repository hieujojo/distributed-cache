/**
 * Integration Test — TCP Server + Client
 *
 * Test flow thật qua TCP network, không mock.
 * Chạy: npx jest tests/integration/ --forceExit
 */

import { CacheServer } from '../../src/server/cache-server';
import { CacheClient } from '../../src/server/client';
import { CacheNode } from '../../src/core/node';

describe('TCP Integration — Client + Server', () => {
  let server: CacheServer;
  let client: CacheClient;

  beforeAll(async () => {
    // Tạo server với random port (port 0 = OS tự chọn)
    server = new CacheServer({ host: '127.0.0.1', port: 0 });

    // Thêm 3 cache nodes
    server.addNode(new CacheNode('node-1', { maxSize: 1000 }));
    server.addNode(new CacheNode('node-2', { maxSize: 1000 }));
    server.addNode(new CacheNode('node-3', { maxSize: 1000 }));

    await server.start();

    // Kết nối client
    const port = (server as any).server?.address()?.port;
    client = new CacheClient({ host: '127.0.0.1', port });
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    await server.stop();
  });

  // ─── Basic Operations ─────────────────────────────────────

  it('PING → PONG', async () => {
    const result = await client.ping();
    expect(result).toBe(true);
  });

  it('SET + GET returns correct value', async () => {
    await client.set('user:1001', 'HelloWorld');
    const result = await client.get('user:1001');
    expect(result).toBe('HelloWorld');
  });

  it('GET missing key → null', async () => {
    const result = await client.get('non-existing-key');
    expect(result).toBeNull();
  });

  it('DEL existing key → true', async () => {
    await client.set('temp-key', 'temp-value');
    const deleted = await client.del('temp-key');
    expect(deleted).toBe(true);

    const result = await client.get('temp-key');
    expect(result).toBeNull();
  });

  it('DEL non-existing key → false', async () => {
    const deleted = await client.del('never-existed');
    expect(deleted).toBe(false);
  });

  // ─── Data Types ───────────────────────────────────────────

  it('SET + GET string value', async () => {
    await client.set('string-key', 'hello-world');
    const result = await client.get('string-key');
    expect(result).toBe('hello-world');
  });

  it('SET + GET number value', async () => {
    await client.set('number-key', 42);
    const result = await client.get('number-key');
    expect(result).toBe(42);
  });

  it('SET + GET boolean value', async () => {
    await client.set('bool-key', true);
    const result = await client.get('bool-key');
    expect(result).toBe(true);
  });

  it('SET + GET object value', async () => {
    const obj = { name: 'Hiếu', age: 25, active: true };
    await client.set('object-key', obj);
    const result = await client.get('object-key');
    expect(result).toEqual(obj);
  });

  // ─── TTL ──────────────────────────────────────────────────

  it('SET with TTL → expires after TTL', async () => {
    await client.set('ttl-key', 'expires-soon', 200); // 200ms TTL

    // Ngay lập tức → có value
    const immediate = await client.get('ttl-key');
    expect(immediate).toBe('expires-soon');

    // Chờ hết TTL
    await new Promise((r) => setTimeout(r, 300));

    const expired = await client.get('ttl-key');
    expect(expired).toBeNull();
  });

  // ─── Multiple Clients ─────────────────────────────────────

  it('Multiple clients — cùng SET/GET không conflict', async () => {
    // Tạo client thứ 2
    const port = (server as any).server?.address()?.port;
    const client2 = new CacheClient({ host: '127.0.0.1', port });
    await client2.connect();

    // Client 1 SET
    await client.set('multi-client', 'client1-value');

    // Client 2 GET
    const result = await client2.get('multi-client');
    expect(result).toBe('client1-value');

    // Client 2 SET
    await client2.set('multi-client-2', 'client2-value');

    // Client 1 GET
    const result2 = await client.get('multi-client-2');
    expect(result2).toBe('client2-value');

    await client2.disconnect();
  });

  // ─── Large Payload ────────────────────────────────────────

  it('SET + GET large value (1KB string)', async () => {
    const largeValue = 'x'.repeat(1024); // 1KB
    await client.set('large-key', largeValue);
    const result = await client.get('large-key');
    expect(result).toBe(largeValue);
  });

  // ─── Stress Test ──────────────────────────────────────────

  it('50 operations sequential — data integrity', async () => {
    const prefix = `stress-${Date.now()}`;

    // SET 50 keys
    for (let i = 0; i < 50; i++) {
      await client.set(`${prefix}:${i}`, `value-${i}`);
    }

    // GET 50 keys — verify all correct
    for (let i = 0; i < 50; i++) {
      const result = await client.get(`${prefix}:${i}`);
      expect(result).toBe(`value-${i}`);
    }

    // DEL all
    for (let i = 0; i < 50; i++) {
      const deleted = await client.del(`${prefix}:${i}`);
      expect(deleted).toBe(true);
    }

    // Verify all deleted
    for (let i = 0; i < 50; i++) {
      const result = await client.get(`${prefix}:${i}`);
      expect(result).toBeNull();
    }
  });

  // ─── Server Restart ───────────────────────────────────────

  it('Server restart → data mất (in-memory)', async () => {
    // Tạo server mới hoàn toàn
    const freshServer = new CacheServer({ host: '127.0.0.1', port: 0 });
    freshServer.addNode(new CacheNode('fresh-node-1', { maxSize: 1000 }));
    await freshServer.start();

    const freshPort = (freshServer as any).server?.address()?.port;
    const freshClient = new CacheClient({ host: '127.0.0.1', port: freshPort });
    await freshClient.connect();

    // SET data
    await freshClient.set('before-restart', 'will-be-lost');
    const before = await freshClient.get('before-restart');
    expect(before).toBe('will-be-lost');

    // Disconnect
    await freshClient.disconnect();

    // Stop + restart server (new server = new nodes = no data)
    await freshServer.stop();

    const freshServer2 = new CacheServer({ host: '127.0.0.1', port: 0 });
    freshServer2.addNode(new CacheNode('fresh-node-2', { maxSize: 1000 }));
    await freshServer2.start();

    const freshPort2 = (freshServer2 as any).server?.address()?.port;
    const freshClient2 = new CacheClient({ host: '127.0.0.1', port: freshPort2 });
    await freshClient2.connect();

    // Data should be gone (new node, no data)
    const after = await freshClient2.get('before-restart');
    expect(after).toBeNull();

    await freshClient2.disconnect();
    await freshServer2.stop();
  });
});
