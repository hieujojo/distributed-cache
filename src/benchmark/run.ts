/**
 * Benchmark Runner - Chạy tất cả benchmarks và in kết quả
 *
 * Usage:
 *   npx tsx src/benchmark/run.ts
 */

import { CacheNode } from '../core/node';
import { ConsistentHash } from '../core/consistent-hashing';
import { HashNode } from '../core/consistent-hashing';
import { benchmarkThroughput, benchmarkReadHeavy, benchmarkWriteHeavy } from './throughput';
import { benchmarkDataMovement, benchmarkDataMovementOnRemove } from './data-movement';

/**
 * Format số với commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Format milliseconds
 */
function formatMs(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  return `${ms.toFixed(2)}ms`;
}

/**
 * In benchmark result
 */
function printResult(result: { name: string; opsPerSecond: number; avgLatency: number; p99Latency: number; duration: number; totalOperations: number }): void {
  console.log(`\n📊 ${result.name.toUpperCase()}`);
  console.log(`   Operations:    ${formatNumber(result.totalOperations)}`);
  console.log(`   Duration:      ${formatMs(result.duration)}`);
  console.log(`   Throughput:    ${formatNumber(result.opsPerSecond)} ops/sec`);
  console.log(`   Avg Latency:   ${formatMs(result.avgLatency)}`);
  console.log(`   P99 Latency:   ${formatMs(result.p99Latency)}`);
}

/**
 * Chạy tất cả benchmarks
 */
async function runAllBenchmarks(): Promise<void> {
  console.log('🚀 Starting benchmarks...\n');
  console.log('='.repeat(50));

  // === THROUGHPUT BENCHMARKS ===
  console.log('\n⚡ THROUGHPUT BENCHMARKS');
  console.log('-'.repeat(50));

  const cache = new CacheNode('benchmark-cache', { maxSize: 100000 });

  // Warmup
  console.log('Warming up...');
  for (let i = 0; i < 1000; i++) {
    cache.set(`warmup-${i}`, `value-${i}`);
  }

  // Benchmark 1: Balanced (50% read, 50% write)
  const balanced = await benchmarkThroughput(cache, 100000, 10000);
  printResult(balanced);

  // Benchmark 2: Read-heavy (80% read, 20% write)
  const readHeavy = await benchmarkReadHeavy(cache, 100000, 10000);
  printResult(readHeavy);

  // Benchmark 3: Write-heavy (80% write, 20% read)
  const writeHeavy = await benchmarkWriteHeavy(cache, 100000, 10000);
  printResult(writeHeavy);

  // === DATA MOVEMENT BENCHMARKS ===
  console.log('\n\n📦 DATA MOVEMENT BENCHMARKS');
  console.log('-'.repeat(50));

  // Tạo ring với 5 nodes
  const ring = new ConsistentHash({ virtualNodes: 150 });
  const nodeIds = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'];

  for (const id of nodeIds) {
    ring.addNode({ id } as HashNode);
  }

  // Tạo 100,000 keys
  const keys: string[] = [];
  for (let i = 0; i < 100000; i++) {
    keys.push(`key-${i}`);
  }

  // Benchmark: Thêm node mới
  console.log(`\nAdding 1 new node to ${nodeIds.length}-node ring...`);
  const addResult = benchmarkDataMovement(ring, keys, { id: 'node-6' } as HashNode);

  console.log(`   Keys before:   ${formatNumber(addResult.keysBefore)}`);
  console.log(`   Keys after:    ${formatNumber(addResult.keysAfter)}`);
  console.log(`   Keys moved:    ${formatNumber(addResult.keysMoved)}`);
  console.log(`   Moved:         ${addResult.percentageMoved.toFixed(2)}%`);
  console.log(`   Expected:      ~${(100 / (nodeIds.length + 1)).toFixed(2)}% (ideal: 1/N)`);

  // Benchmark: Xóa node
  console.log(`\nRemoving 1 node from ring...`);
  const removeResult = benchmarkDataMovementOnRemove(ring, keys, 'node-6');

  console.log(`   Keys before:   ${formatNumber(removeResult.keysBefore)}`);
  console.log(`   Keys after:    ${formatNumber(removeResult.keysAfter)}`);
  console.log(`   Keys moved:    ${formatNumber(removeResult.keysMoved)}`);
  console.log(`   Moved:         ${removeResult.percentageMoved.toFixed(2)}%`);

  // Summary
  console.log('\n\n' + '='.repeat(50));
  console.log('✅ All benchmarks completed!');
  console.log('='.repeat(50));
}

// Run benchmark
runAllBenchmarks().catch(console.error);
