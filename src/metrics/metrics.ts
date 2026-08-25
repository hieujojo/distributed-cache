/**
 * Metrics - Thu thập metrics cho cache system
 *
 * Track:
 * - Hit/miss ratio
 * - Operations per second
 * - Latency (avg, P99)
 * - Memory usage
 */

/** Snapshot of metrics at a point in time */
export interface MetricsSnapshot {
  /** Timestamp */
  timestamp: number;
  /** Total operations */
  totalOps: number;
  /** Cache hits */
  hits: number;
  /** Cache misses */
  misses: number;
  /** Hit ratio (0-1) */
  hitRatio: number;
  /** Operations per second */
  opsPerSecond: number;
  /** Average latency (ms) */
  avgLatency: number;
  /** P99 latency (ms) */
  p99Latency: number;
  /** Memory usage (bytes) */
  memoryUsage: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
}

/**
 * Metrics - Cache observability
 */
export class Metrics {
  private hits: number;
  private misses: number;
  private totalLatency: number;
  private latencies: number[];
  private lastOpsCount: number;
  private lastOpsTime: number;
  private currentOpsPerSecond: number;

  constructor() {
    this.hits = 0;
    this.misses = 0;
    this.totalLatency = 0;
    this.latencies = [];
    this.lastOpsCount = 0;
    this.lastOpsTime = Date.now();
    this.currentOpsPerSecond = 0;
  }

  /**
   * Ghi nhận 1 cache hit
   * @param latency - Thời gian xử lý (ms)
   */
  recordHit(latency: number = 0): void {
    this.hits++;
    this.totalLatency += latency;
    this.latencies.push(latency);
    this.updateOpsPerSecond();
  }

  /**
   * Ghi nhận 1 cache miss
   * @param latency - Thời gian xử lý (ms)
   */
  recordMiss(latency: number = 0): void {
    this.misses++;
    this.totalLatency += latency;
    this.latencies.push(latency);
    this.updateOpsPerSecond();
  }

  /**
   * Cập nhật ops/sec
   */
  private updateOpsPerSecond(): void {
    const now = Date.now();
    const elapsed = now - this.lastOpsTime;

    if (elapsed >= 1000) {
      const totalOps = this.hits + this.misses;
      const opsInPeriod = totalOps - this.lastOpsCount;
      this.currentOpsPerSecond = (opsInPeriod / elapsed) * 1000;
      this.lastOpsCount = totalOps;
      this.lastOpsTime = now;
    }
  }

  /**
   * Lấy hit ratio
   */
  getHitRatio(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return this.hits / total;
  }

  /**
   * Lấy total operations
   */
  getTotalOps(): number {
    return this.hits + this.misses;
  }

  /**
   * Lấy ops per second
   */
  getOpsPerSecond(): number {
    return this.currentOpsPerSecond;
  }

  /**
   * Lấy average latency
   */
  getAvgLatency(): number {
    if (this.latencies.length === 0) return 0;
    return this.totalLatency / this.latencies.length;
  }

  /**
   * Lấy P99 latency
   */
  getP99Latency(): number {
    if (this.latencies.length === 0) return 0;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * 0.99) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Lấy memory usage
   */
  getMemoryUsage(): { rss: number; heapUsed: number; heapTotal: number } {
    const mem = process.memoryUsage();
    return {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    };
  }

  /**
   * Lấy snapshot hiện tại
   */
  getSnapshot(): MetricsSnapshot {
    return {
      timestamp: Date.now(),
      totalOps: this.getTotalOps(),
      hits: this.hits,
      misses: this.misses,
      hitRatio: this.getHitRatio(),
      opsPerSecond: this.getOpsPerSecond(),
      avgLatency: this.getAvgLatency(),
      p99Latency: this.getP99Latency(),
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.hits = 0;
    this.misses = 0;
    this.totalLatency = 0;
    this.latencies = [];
    this.lastOpsCount = 0;
    this.lastOpsTime = Date.now();
    this.currentOpsPerSecond = 0;
  }

  /**
   * Format snapshot thành string dễ đọc
   */
  formatSnapshot(snapshot?: MetricsSnapshot): string {
    const s = snapshot ?? this.getSnapshot();

    const formatBytes = (bytes: number): string => {
      if (bytes >= 1024 * 1024) {
        return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
      }
      return `${(bytes / 1024).toFixed(2)} KB`;
    };

    return [
      `📊 Cache Metrics`,
      `═══════════════════════════════════════`,
      `Total Ops:    ${s.totalOps}`,
      `Hits:         ${s.hits}`,
      `Misses:       ${s.misses}`,
      `Hit Ratio:    ${(s.hitRatio * 100).toFixed(1)}%`,
      `Ops/sec:      ${s.opsPerSecond.toFixed(0)}`,
      `Avg Latency:  ${s.avgLatency.toFixed(3)}ms`,
      `P99 Latency:  ${s.p99Latency.toFixed(3)}ms`,
      `Memory RSS:   ${formatBytes(s.memoryUsage.rss)}`,
      `Heap Used:    ${formatBytes(s.memoryUsage.heapUsed)}`,
      `Heap Total:   ${formatBytes(s.memoryUsage.heapTotal)}`,
    ].join('\n');
  }
}
