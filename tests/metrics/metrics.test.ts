/**
 * Unit tests cho Metrics
 */

import { Metrics } from '../../src/metrics/metrics';

describe('Metrics', () => {
  let metrics: Metrics;

  beforeEach(() => {
    metrics = new Metrics();
  });

  describe('Constructor', () => {
    it('should create Metrics instance', () => {
      expect(metrics).toBeDefined();
      expect(metrics.getTotalOps()).toBe(0);
      expect(metrics.getHitRatio()).toBe(0);
    });
  });

  describe('recordHit()', () => {
    it('should record cache hit', () => {
      metrics.recordHit(1);

      expect(metrics.getTotalOps()).toBe(1);
      expect(metrics.getHitRatio()).toBe(1);
    });

    it('should record multiple hits', () => {
      metrics.recordHit(1);
      metrics.recordHit(2);
      metrics.recordHit(3);

      expect(metrics.getTotalOps()).toBe(3);
      expect(metrics.getHitRatio()).toBe(1);
    });

    it('should track latency', () => {
      metrics.recordHit(1);
      metrics.recordHit(3);

      expect(metrics.getAvgLatency()).toBe(2);
    });
  });

  describe('recordMiss()', () => {
    it('should record cache miss', () => {
      metrics.recordMiss(1);

      expect(metrics.getTotalOps()).toBe(1);
      expect(metrics.getHitRatio()).toBe(0);
    });

    it('should calculate hit ratio correctly', () => {
      metrics.recordHit(1);
      metrics.recordHit(1);
      metrics.recordMiss(1);

      expect(metrics.getTotalOps()).toBe(3);
      expect(metrics.getHitRatio()).toBeCloseTo(0.667, 2);
    });
  });

  describe('getOpsPerSecond()', () => {
    it('should start at 0', () => {
      expect(metrics.getOpsPerSecond()).toBe(0);
    });
  });

  describe('getAvgLatency()', () => {
    it('should return 0 when no data', () => {
      expect(metrics.getAvgLatency()).toBe(0);
    });

    it('should calculate average latency', () => {
      metrics.recordHit(1);
      metrics.recordHit(2);
      metrics.recordHit(3);

      expect(metrics.getAvgLatency()).toBe(2);
    });
  });

  describe('getP99Latency()', () => {
    it('should return 0 when no data', () => {
      expect(metrics.getP99Latency()).toBe(0);
    });

    it('should calculate P99 latency', () => {
      // Thêm 100 latencies: 1, 2, 3, ..., 100
      for (let i = 1; i <= 100; i++) {
        metrics.recordHit(i);
      }

      // P99 = 99th percentile = 99
      expect(metrics.getP99Latency()).toBe(99);
    });
  });

  describe('getSnapshot()', () => {
    it('should return snapshot with all fields', () => {
      metrics.recordHit(1);
      metrics.recordMiss(2);

      const snapshot = metrics.getSnapshot();

      expect(snapshot).toHaveProperty('timestamp');
      expect(snapshot).toHaveProperty('totalOps', 2);
      expect(snapshot).toHaveProperty('hits', 1);
      expect(snapshot).toHaveProperty('misses', 1);
      expect(snapshot).toHaveProperty('hitRatio');
      expect(snapshot).toHaveProperty('opsPerSecond');
      expect(snapshot).toHaveProperty('avgLatency');
      expect(snapshot).toHaveProperty('p99Latency');
      expect(snapshot).toHaveProperty('memoryUsage');
      expect(snapshot.memoryUsage).toHaveProperty('rss');
      expect(snapshot.memoryUsage).toHaveProperty('heapUsed');
      expect(snapshot.memoryUsage).toHaveProperty('heapTotal');
    });
  });

  describe('reset()', () => {
    it('should reset all metrics', () => {
      metrics.recordHit(1);
      metrics.recordMiss(2);
      metrics.recordHit(3);

      metrics.reset();

      expect(metrics.getTotalOps()).toBe(0);
      expect(metrics.getHitRatio()).toBe(0);
      expect(metrics.getAvgLatency()).toBe(0);
    });
  });

  describe('formatSnapshot()', () => {
    it('should format snapshot as string', () => {
      metrics.recordHit(1);
      metrics.recordMiss(2);

      const formatted = metrics.formatSnapshot();

      expect(formatted).toContain('📊 Cache Metrics');
      expect(formatted).toContain('Total Ops:');
      expect(formatted).toContain('Hits:');
      expect(formatted).toContain('Misses:');
      expect(formatted).toContain('Hit Ratio:');
    });
  });

  describe('getMemoryUsage()', () => {
    it('should return memory usage', () => {
      const memory = metrics.getMemoryUsage();

      expect(memory.rss).toBeGreaterThan(0);
      expect(memory.heapUsed).toBeGreaterThan(0);
      expect(memory.heapTotal).toBeGreaterThan(0);
    });
  });

  describe('Memory threshold', () => {
    it('should check memory and return false when below threshold', () => {
      const m = new Metrics({ memoryThresholdPercent: 0.95 });
      const exceeded = m.checkMemory();
      expect(exceeded).toBe(false);
      m.dispose();
    });

    it('should check memory and return true when above threshold', () => {
      // Set threshold very low so it always exceeds
      const m = new Metrics({ memoryThresholdPercent: 0.001 });
      const exceeded = m.checkMemory();
      expect(exceeded).toBe(true);
      m.dispose();
    });

    it('should trigger warning callback when exceeded', () => {
      const warnings: any[] = [];
      const m = new Metrics({
        memoryThresholdPercent: 0.001,
        onMemoryWarning: (report) => warnings.push(report),
        memoryCheckIntervalMs: 50,
      });

      // Trigger check manually
      m.checkMemory();
      expect(warnings.length).toBe(1);
      expect(warnings[0].exceeded).toBe(true);
      expect(warnings[0].totalSystemRAM).toBeGreaterThan(0);
      expect(warnings[0].freeSystemRAM).toBeGreaterThan(0);
      m.dispose();
    });

    it('should return detailed memory usage report', () => {
      const m = new Metrics();
      const report = m.getMemoryUsageReport();

      expect(report.heapUsed).toBeGreaterThan(0);
      expect(report.rss).toBeGreaterThan(0);
      expect(report.totalSystemRAM).toBeGreaterThan(0);
      expect(report.freeSystemRAM).toBeGreaterThan(0);
      expect(report.usagePercent).toBeGreaterThan(0);
      expect(report.usagePercent).toBeLessThanOrEqual(1);
      expect(report.thresholdPercent).toBe(0.8);
      expect(typeof report.exceeded).toBe('boolean');
      m.dispose();
    });

    it('should stop memory check on dispose', () => {
      let callCount = 0;
      const m = new Metrics({
        memoryThresholdPercent: 0.001,
        onMemoryWarning: () => { callCount++; },
        memoryCheckIntervalMs: 50,
      });

      m.dispose();
      const countAfterDispose = callCount;

      // Wait and verify no more calls
      return new Promise((resolve) => setTimeout(() => {
        expect(callCount).toBe(countAfterDispose);
        resolve(undefined);
      }, 150));
    });
  });
});
