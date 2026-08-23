import { CacheNode } from '../../src/core/node';
import { ConsistentHash } from '../../src/core/consistent-hashing';
import { HashNode } from '../../src/core/consistent-hashing';
import {
  benchmarkThroughput,
  benchmarkReadHeavy,
  benchmarkWriteHeavy,
} from '../../src/benchmark/throughput';
import {
  benchmarkDataMovement,
  benchmarkDataMovementOnRemove,
} from '../../src/benchmark/data-movement';

describe('Throughput Benchmark', () => {
  it('should return valid BenchmarkResult for throughput', async () => {
    const cache = new CacheNode('bench-1');
    const result = await benchmarkThroughput(cache, 1000, 100);

    expect(result.name).toBe('throughput');
    expect(result.opsPerSecond).toBeGreaterThan(0);
    expect(result.avgLatency).toBeGreaterThanOrEqual(0);
    expect(result.p99Latency).toBeGreaterThanOrEqual(0);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.totalOperations).toBe(1000);
  });

  it('should return valid BenchmarkResult for read-heavy', async () => {
    const cache = new CacheNode('bench-2');
    const result = await benchmarkReadHeavy(cache, 1000, 100);

    expect(result.name).toBe('read-heavy');
    expect(result.opsPerSecond).toBeGreaterThan(0);
    expect(result.totalOperations).toBe(1000);
  });

  it('should return valid BenchmarkResult for write-heavy', async () => {
    const cache = new CacheNode('bench-3');
    const result = await benchmarkWriteHeavy(cache, 1000, 100);

    expect(result.name).toBe('write-heavy');
    expect(result.opsPerSecond).toBeGreaterThan(0);
    expect(result.totalOperations).toBe(1000);
  });

  it('should handle small operations count', async () => {
    const cache = new CacheNode('bench-4');
    const result = await benchmarkThroughput(cache, 10, 5);

    expect(result.totalOperations).toBe(10);
    expect(result.opsPerSecond).toBeGreaterThan(0);
  });
});

describe('Data Movement Benchmark', () => {
  it('should measure keys moved when adding node', () => {
    const ring = new ConsistentHash({ virtualNodes: 50 });

    const nodeA: HashNode = { id: 'node-a' };
    const nodeB: HashNode = { id: 'node-b' };
    ring.addNode(nodeA);
    ring.addNode(nodeB);

    // Tạo 100 keys
    const keys = Array.from({ length: 100 }, (_, i) => `key-${i}`);

    const newNode: HashNode = { id: 'node-c' };
    const result = benchmarkDataMovement(ring, keys, newNode);

    expect(result.keysBefore).toBe(100);
    expect(result.keysAfter).toBe(100);
    expect(result.keysMoved).toBeGreaterThanOrEqual(0);
    expect(result.percentageMoved).toBeGreaterThanOrEqual(0);
    expect(result.percentageMoved).toBeLessThanOrEqual(100);
    expect(result.nodeIdsBefore).toContain('node-a');
    expect(result.nodeIdsAfter).toContain('node-c');
  });

  it('should measure keys moved when removing node', () => {
    const ring = new ConsistentHash({ virtualNodes: 50 });

    const nodeA: HashNode = { id: 'node-a' };
    const nodeB: HashNode = { id: 'node-b' };
    const nodeC: HashNode = { id: 'node-c' };
    ring.addNode(nodeA);
    ring.addNode(nodeB);
    ring.addNode(nodeC);

    const keys = Array.from({ length: 100 }, (_, i) => `key-${i}`);

    const result = benchmarkDataMovementOnRemove(ring, keys, 'node-b');

    expect(result.keysBefore).toBe(100);
    expect(result.keysAfter).toBe(100);
    expect(result.keysMoved).toBeGreaterThanOrEqual(0);
    expect(result.nodeIdsBefore).toContain('node-b');
    expect(result.nodeIdsAfter).not.toContain('node-b');
  });

  it('should show ~1/N keys moved with consistent hashing', () => {
    const ring = new ConsistentHash({ virtualNodes: 150 });

    const nodeA: HashNode = { id: 'node-a' };
    ring.addNode(nodeA);

    // Tạo nhiều keys để có ý nghĩa thống kê
    const keys = Array.from({ length: 1000 }, (_, i) => `key-${i}`);

    const newNode: HashNode = { id: 'node-b' };
    const result = benchmarkDataMovement(ring, keys, newNode);

    // Consistent hashing: ~1/N keys moved (1/2 = 50% theoretical max)
    // Nhưng thực tế thường thấp hơn nhiều vì virtual nodes
    expect(result.percentageMoved).toBeLessThan(60);
    expect(result.percentageMoved).toBeGreaterThan(0);
  });

  it('should handle empty keys array', () => {
    const ring = new ConsistentHash({ virtualNodes: 50 });
    ring.addNode({ id: 'node-a' });

    const result = benchmarkDataMovement(ring, [], { id: 'node-b' });

    expect(result.keysBefore).toBe(0);
    expect(result.keysAfter).toBe(0);
    expect(result.keysMoved).toBe(0);
    expect(result.percentageMoved).toBe(0);
  });
});
