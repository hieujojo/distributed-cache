/**
 * Đo RAM usage khi chạy cache system
 */

import { CacheNode } from '../core/node';
import { ConsistentHash } from '../core/consistent-hashing';

function formatMB(bytes: number): string {
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}

function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: mem.rss,           // Tổng RAM process đang dùng
    heapUsed: mem.heapUsed, // RAM cho objects (caches, Map...)
    heapTotal: mem.heapTotal,
    external: mem.external, // RAM cho Buffer, native objects
  };
}

console.log('📊 Memory Usage Test\n');

// 1. Baseline — chưa có data
const before = getMemoryUsage();
console.log('1️⃣  Baseline (chưa có data):');
console.log(`   RSS:      ${formatMB(before.rss)}`);
console.log(`   Heap:     ${formatMB(before.heapUsed)}`);

// 2. Tạo 100,000 keys
console.log('\n2️⃣  Tạo 100,000 keys...');
const node = new CacheNode('mem-test', { maxSize: 200000 });
for (let i = 0; i < 100000; i++) {
  node.set(`user:${i}`, {
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    active: i % 2 === 0,
  });
}

const after100k = getMemoryUsage();
console.log(`   RSS:      ${formatMB(after100k.rss)}`);
console.log(`   Heap:     ${formatMB(after100k.heapUsed)}`);
console.log(`   Tăng:     ${formatMB(after100k.heapUsed - before.heapUsed)}`);
console.log(`   Trung bình: ${(after100k.heapUsed - before.heapUsed) / 100000} bytes/key`);

// 3. Tạo 500,000 keys
console.log('\n3️⃣  Tạo thêm 400,000 keys (tổng 500,000)...');
for (let i = 100000; i < 500000; i++) {
  node.set(`user:${i}`, {
    name: `User ${i}`,
    email: `user${i}@example.com`,
    age: 20 + (i % 50),
    active: i % 2 === 0,
  });
}

const after500k = getMemoryUsage();
console.log(`   RSS:      ${formatMB(after500k.rss)}`);
console.log(`   Heap:     ${formatMB(after500k.heapUsed)}`);
console.log(`   Tăng:     ${formatMB(after500k.heapUsed - before.heapUsed)}`);
console.log(`   Trung bình: ${(after500k.heapUsed - before.heapUsed) / 500000} bytes/key`);

// 4. Thêm ConsistentHash ring
console.log('\n4️⃣  Thêm ConsistentHash ring (5 nodes, 150 virtual nodes)...');
const ring = new ConsistentHash({ virtualNodes: 150 });
for (let i = 0; i < 5; i++) {
  ring.addNode({ id: `node-${i}` });
}

const afterRing = getMemoryUsage();
console.log(`   RSS:      ${formatMB(afterRing.rss)}`);
console.log(`   Heap:     ${formatMB(afterRing.heapUsed)}`);
console.log(`   Ring tăng: ${formatMB(afterRing.heapUsed - after500k.heapUsed)}`);

// 5. Tổng kết
console.log('\n' + '='.repeat(50));
console.log('📊 TÓM TẮT:');
console.log('='.repeat(50));
console.log(`500,000 keys (objects):  ${formatMB(after500k.heapUsed - before.heapUsed)}`);
console.log(`ConsistentHash ring:    ${formatMB(afterRing.heapUsed - after500k.heapUsed)}`);
console.log(`TỔNG:                   ${formatMB(afterRing.heapUsed - before.heapUsed)}`);
console.log(`Trung bình/key:         ${((after500k.heapUsed - before.heapUsed) / 500000).toFixed(0)} bytes`);

// 6. Ước tính hệ thống lớn
console.log('\n' + '='.repeat(50));
console.log('🔮 ƯỚC TÍNCHO HỆ THỐNG LỚN:');
console.log('='.repeat(50));
const bytesPerKey = (after500k.heapUsed - before.heapUsed) / 500000;
const sizes = [1_000_000, 10_000_000, 100_000_000];
for (const size of sizes) {
  const mb = (bytesPerKey * size) / 1024 / 1024;
  const gb = mb / 1024;
  if (gb >= 1) {
    console.log(`${(size / 1_000_000).toFixed(0)}M keys:  ~${gb.toFixed(1)} GB`);
  } else {
    console.log(`${(size / 1_000_000).toFixed(0)}M keys:  ~${mb.toFixed(0)} MB`);
  }
}

process.exit(0);
