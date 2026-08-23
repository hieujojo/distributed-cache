/**
 * Demo — Chạy thử distributed cache system
 *
 * Cách chạy: npx tsx src/demo/index.ts
 */

import { CacheNode } from './core/node';
import { ConsistentHash } from './core/consistent-hashing';
import { CacheServer } from './server/cache-server';
import { CacheClient } from './server/client';

async function main() {
  console.log('🚀 Distributed Cache Demo\n');

  // ─── 1. Tạo nodes ──────────────────────────────────────────
  console.log('1️⃣  Tạo 3 cache nodes...');
  const node1 = new CacheNode('node-1', { maxSize: 1000 });
  const node2 = new CacheNode('node-2', { maxSize: 1000 });
  const node3 = new CacheNode('node-3', { maxSize: 1000 });

  // ─── 2. Demo consistent hashing ────────────────────────────
  console.log('\n2️⃣  Consistent Hashing Demo:');
  const ring = new ConsistentHash({ virtualNodes: 150 });
  ring.addNode({ id: 'node-1' });
  ring.addNode({ id: 'node-2' });
  ring.addNode({ id: 'node-3' });

  const testKeys = ['user:1001', 'user:1002', 'order:5001', 'product:301', 'session:abc'];
  for (const key of testKeys) {
    const node = ring.getNode(key);
    console.log(`   ${key} → ${node?.id}`);
  }

  // ─── 3. Demo data movement khi scaling ─────────────────────
  console.log('\n3️⃣  Data Movement khi thêm node:');
  const keys = Array.from({ length: 10000 }, (_, i) => `key-${i}`);
  const before = new Map<string, string>();
  for (const key of keys) {
    const node = ring.getNode(key);
    if (node) before.set(key, node.id);
  }

  ring.addNode({ id: 'node-4' });

  let moved = 0;
  for (const key of keys) {
    const node = ring.getNode(key);
    if (node && before.get(key) !== node.id) moved++;
  }
  console.log(`   Keys trước: ${keys.length}, Di chuyển: ${moved} (${((moved / keys.length) * 100).toFixed(2)}%)`);

  // ─── 4. Chạy TCP server ───────────────────────────────────
  console.log('\n4️⃣  Khởi chạy TCP server trên port 3000...');
  const server = new CacheServer({ host: '127.0.0.1', port: 5555 });
  server.addNode(node1);
  server.addNode(node2);
  server.addNode(node3);
  await server.start();
  console.log('   ✅ Server đang chạy');

  // ─── 5. Kết nối client ─────────────────────────────────────
  console.log('\n5️⃣  Kết nối client...');
  const client = new CacheClient({ host: '127.0.0.1', port: 5555 });
  await client.connect();
  console.log('   ✅ Client đã kết nối');

  // ─── 6. SET/GET operations ─────────────────────────────────
  console.log('\n6️⃣  SET/GET Demo:');

  console.log('   SET user:1001 = "Nguyễn Văn A"');
  await client.set('user:1001', 'Nguyễn Văn A');

  console.log('   SET user:1002 = "Trần Thị B"');
  await client.set('user:1002', 'Trần Thị B');

  console.log('   SET order:5001 = { product: "iPhone", total: 29999000 }');
  await client.set('order:5001', { product: 'iPhone', total: 29999000 });

  const val1 = await client.get('user:1001');
  console.log(`   GET user:1001 → ${val1}`);

  const val2 = await client.get('user:1002');
  console.log(`   GET user:1002 → ${val2}`);

  const val3 = await client.get('order:5001');
  console.log(`   GET order:5001 → ${JSON.stringify(val3)}`);

  const val4 = await client.get('user:9999');
  console.log(`   GET user:9999 → ${val4} (không tồn tại)`);

  // ─── 7. Benchmark nhanh ────────────────────────────────────
  console.log('\n7️⃣  Quick Benchmark (10,000 ops):');
  const start = performance.now();
  for (let i = 0; i < 10000; i++) {
    const key = `bench-${i % 1000}`;
    if (i % 2 === 0) {
      await client.set(key, `value-${i}`);
    } else {
      await client.get(key);
    }
  }
  const elapsed = performance.now() - start;
  const opsPerSec = (10000 / elapsed) * 1000;
  console.log(`   ${opsPerSec.toFixed(0)} ops/sec, P99: ~${(elapsed / 10000 * 1000).toFixed(1)}μs`);

  // ─── 8. Cluster stats ──────────────────────────────────────
  console.log('\n8️⃣  Node Stats:');
  console.log(`   Node-1: ${node1.getSize()} keys`);
  console.log(`   Node-2: ${node2.getSize()} keys`);
  console.log(`   Node-3: ${node3.getSize()} keys`);

  // ─── Cleanup ───────────────────────────────────────────────
  console.log('\n8️⃣  Đang dừng server...');
  try {
    await Promise.race([
      client.disconnect().then(() => server.stop()),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
  } catch {
    // Force exit if cleanup hangs
  }
  console.log('\n✅ Demo hoàn thành!');
  process.exit(0);
}

main().catch(console.error);
