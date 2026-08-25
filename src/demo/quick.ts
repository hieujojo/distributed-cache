/**
 * Quick Demo — Chạy thử without TCP server
 */

import { CacheNode } from '../core/node';
import { ConsistentHash } from '../core/consistent-hashing';

console.log('🚀 Distributed Cache Demo\n');

// 1. Consistent Hashing
console.log('1️⃣  Consistent Hashing:');
const ring = new ConsistentHash({ virtualNodes: 150 });
ring.addNode({ id: 'node-1' });
ring.addNode({ id: 'node-2' });
ring.addNode({ id: 'node-3' });

const keys = ['user:1001', 'user:1002', 'order:5001', 'product:301', 'session:abc'];
for (const key of keys) {
  const node = ring.getNode(key);
  console.log(`   ${key} → ${node?.id}`);
}

// 2. Data Movement
console.log('\n2️⃣  Data Movement khi thêm node:');
const allKeys = Array.from({ length: 10000 }, (_, i) => `key-${i}`);
const before = new Map<string, string>();
for (const key of allKeys) {
  const node = ring.getNode(key);
  if (node) before.set(key, node.id);
}

ring.addNode({ id: 'node-4' });

let moved = 0;
for (const key of allKeys) {
  const node = ring.getNode(key);
  if (node && before.get(key) !== node.id) moved++;
}
console.log(`   10,000 keys → thêm node-4 → ${moved} di chuyển (${((moved / allKeys.length) * 100).toFixed(2)}%)`);

// 3. Cache Node
console.log('\n3️⃣  Cache Node:');
const node = new CacheNode('test', { maxSize: 100, defaultTtl: 5000 });
node.set('name', 'Hiếu');
node.set('age', 25);
node.set('active', true);
console.log(`   SET name=Hiếu → GET: ${node.get('name')}`);
console.log(`   SET age=25 → GET: ${node.get('age')}`);
console.log(`   SET active=true → GET: ${node.get('active')}`);
console.log(`   Keys: ${node.getKeys().join(', ')}`);
console.log(`   Size: ${node.getSize()}/${node.getMaxSize()}`);

// 4. Eviction
console.log('\n4️⃣  Eviction (LRU):');
const { LRUStrategy } = await import('../strategies/lru');
const lru = new LRUStrategy();
lru.onInsert('key-a');
lru.onInsert('key-b');
lru.onInsert('key-c');
lru.onAccess('key-a');  // key-a vừa dùng → ưu tiên giữ
console.log(`   Inserted: A, B, C → Access A → Evict: ${lru.onEvict()}`);

console.log('\n✅ Demo hoàn thành!');
