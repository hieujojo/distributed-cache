/**
 * Throughput Benchmark - Đo operations per second và latency
 *
 * Measures:
 *   - Operations per second (ops/sec)
 *   - Average latency
 *   - P99 latency (99th percentile)
 */

import { CacheNode } from '../core/node';

/** Kết quả benchmark */
export interface BenchmarkResult {
  /** Tên benchmark */
  name: string;
  /** Số operations per second */
  opsPerSecond: number;
  /** Latency trung bình (ms) */
  avgLatency: number;
  /** P99 latency (ms) */
  p99Latency: number;
  /** Thời gian chạy (ms) */
  duration: number;
  /** Tổng số operations */
  totalOperations: number;
}

/**
 * Tính percentile từ mảng latencies
 * @param latencies - Mảng latencies
 * @param percentile - Percentile cần tính (0-100)
 * @returns Giá trị percentile
 */
function percentile(latencies: number[], percentile: number): number {
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Benchmark throughput cho CacheNode
 * @param cache - CacheNode cần benchmark
 * @param operations - Số operations cần chạy
 * @param keySpace - Số lượng keys khác nhau
 * @returns BenchmarkResult
 */
export async function benchmarkThroughput(
  cache: CacheNode,
  operations: number,
  keySpace: number
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  const startTime = performance.now();

  for (let i = 0; i < operations; i++) {
    const key = `key-${Math.floor(Math.random() * keySpace)}`;
    const opStart = performance.now();

    // Random operation: 50% SET, 50% GET
    if (Math.random() < 0.5) {
      cache.set(key, `value-${i}`);
    } else {
      cache.get(key);
    }

    const opEnd = performance.now();
    latencies.push(opEnd - opStart);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p99Latency = percentile(latencies, 99);

  return {
    name: 'throughput',
    opsPerSecond: (operations / duration) * 1000,
    avgLatency,
    p99Latency,
    duration,
    totalOperations: operations,
  };
}

/**
 * Benchmark read-heavy workload (80% GET, 20% SET)
 * @param cache - CacheNode cần benchmark
 * @param operations - Số operations cần chạy
 * @param keySpace - Số lượng keys khác nhau
 * @returns BenchmarkResult
 */
export async function benchmarkReadHeavy(
  cache: CacheNode,
  operations: number,
  keySpace: number
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  const startTime = performance.now();

  for (let i = 0; i < operations; i++) {
    const key = `key-${Math.floor(Math.random() * keySpace)}`;
    const opStart = performance.now();

    // 80% GET, 20% SET
    if (Math.random() < 0.2) {
      cache.set(key, `value-${i}`);
    } else {
      cache.get(key);
    }

    const opEnd = performance.now();
    latencies.push(opEnd - opStart);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p99Latency = percentile(latencies, 99);

  return {
    name: 'read-heavy',
    opsPerSecond: (operations / duration) * 1000,
    avgLatency,
    p99Latency,
    duration,
    totalOperations: operations,
  };
}

/**
 * Benchmark write-heavy workload (80% SET, 20% GET)
 * @param cache - CacheNode cần benchmark
 * @param operations - Số operations cần chạy
 * @param keySpace - Số lượng keys khác nhau
 * @returns BenchmarkResult
 */
export async function benchmarkWriteHeavy(
  cache: CacheNode,
  operations: number,
  keySpace: number
): Promise<BenchmarkResult> {
  const latencies: number[] = [];
  const startTime = performance.now();

  for (let i = 0; i < operations; i++) {
    const key = `key-${Math.floor(Math.random() * keySpace)}`;
    const opStart = performance.now();

    // 80% SET, 20% GET
    if (Math.random() < 0.8) {
      cache.set(key, `value-${i}`);
    } else {
      cache.get(key);
    }

    const opEnd = performance.now();
    latencies.push(opEnd - opStart);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p99Latency = percentile(latencies, 99);

  return {
    name: 'write-heavy',
    opsPerSecond: (operations / duration) * 1000,
    avgLatency,
    p99Latency,
    duration,
    totalOperations: operations,
  };
}
