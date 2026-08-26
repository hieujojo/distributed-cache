/**
 * Benchmark: Medusa InMemory Cache vs Distributed Cache
 *
 * So sánh performance:
 * - InMemoryCacheService (Medusa default): Map + TTL timeout
 * - DistributedCacheService: CacheNode + ConsistentHash + eviction
 *
 * Metrics: ops/sec, avg latency, memory usage
 */

import { CacheNode } from "../src/core/node"
import { ConsistentHash } from "../src/core/consistent-hashing"

// ─── Medusa InMemoryCacheService (simplified replica) ──────────────
class InMemoryCacheService {
  private readonly store = new Map<string, { data: unknown; expire: number }>()
  private readonly timoutRefs = new Map<string, NodeJS.Timeout>()
  private readonly TTL: number

  constructor(ttl: number = 30) {
    this.TTL = ttl
  }

  async get<T>(key: string): Promise<T | null> {
    const record = this.store.get(key)
    if (!record || record.expire < Date.now()) return null
    return record.data as T
  }

  async set(key: string, data: unknown, ttl: number = this.TTL): Promise<void> {
    if (ttl === 0) return
    const record = { data, expire: ttl * 1000 + Date.now() }
    const oldRef = this.timoutRefs.get(key)
    if (oldRef) clearTimeout(oldRef)
    const ref = setTimeout(() => this.store.delete(key), ttl * 1000)
    ref.unref()
    this.timoutRefs.set(key, ref)
    this.store.set(key, record)
  }

  async invalidate(key: string): Promise<void> {
    const ref = this.timoutRefs.get(key)
    if (ref) { clearTimeout(ref); this.timoutRefs.delete(key) }
    this.store.delete(key)
  }

  async clear(): Promise<void> {
    this.timoutRefs.forEach((ref) => clearTimeout(ref))
    this.timoutRefs.clear()
    this.store.clear()
  }

  getSize(): number { return this.store.size }
}

// ─── DistributedCacheService (from adapter) ────────────────────────
class DistributedCacheService {
  private readonly ring: ConsistentHash
  private readonly nodes: CacheNode[]
  private readonly TTL: number

  constructor(nodeCount = 3, maxSize = 10000, ttl = 30) {
    this.TTL = ttl
    this.nodes = []
    for (let i = 0; i < nodeCount; i++) {
      this.nodes.push(new CacheNode(`node-${i}`, {
        maxSize: Math.ceil(maxSize / nodeCount),
        defaultTtl: ttl * 1000,
        evictionPolicy: "lru",
        sweepIntervalMs: 0,
      }))
    }
    this.ring = new ConsistentHash({ virtualNodes: 150 })
    for (const node of this.nodes) {
      this.ring.addNode({ id: node.id, host: "localhost", port: 0 } as any)
    }
  }

  private getNodeForKey(key: string): CacheNode {
    const info = this.ring.getNode(key)
    return this.nodes.find((n) => n.id === info?.id) ?? this.nodes[0]
  }

  async get<T>(key: string): Promise<T | null> {
    return (this.getNodeForKey(key).get(key) as T) ?? null
  }

  async set(key: string, data: unknown, ttl: number = this.TTL): Promise<void> {
    this.getNodeForKey(key).set(key, data as any, ttl * 1000)
  }

  async invalidate(key: string): Promise<void> {
    this.getNodeForKey(key).delete(key)
  }

  async clear(): Promise<void> {
    for (const node of this.nodes) node.clear()
  }

  getStats() {
    return this.nodes.map((n) => ({ id: n.id, size: n.getSize() }))
  }
}

// ─── Benchmark helpers ─────────────────────────────────────────────
function generateProducts(count: number) {
  const products = []
  for (let i = 0; i < count; i++) {
    products.push({
      id: `prod_${i}`,
      name: `Product ${i}`,
      price: Math.floor(Math.random() * 1000000),
      category: `cat_${i % 10}`,
      inStock: Math.random() > 0.3,
    })
  }
  return products
}

function generateKeys(count: number, prefix: string) {
  return Array.from({ length: count }, (_, i) => `${prefix}:${i}`)
}

async function measureOps(
  _name: string,
  fn: () => Promise<void>,
  ops: number
): Promise<{ opsPerSec: number; avgLatencyMs: number; p99Ms: number }> {
  const latencies: number[] = []

  const start = performance.now()
  for (let i = 0; i < ops; i++) {
    const opStart = performance.now()
    await fn()
    latencies.push(performance.now() - opStart)
  }
  const elapsed = performance.now() - start

  latencies.sort((a, b) => a - b)
  const p99 = latencies[Math.floor(ops * 0.99)]

  return {
    opsPerSec: Math.round((ops / elapsed) * 1000),
    avgLatencyMs: +(elapsed / ops).toFixed(3),
    p99Ms: +p99.toFixed(3),
  }
}

// ─── Benchmark ─────────────────────────────────────────────────────
describe("Benchmark: InMemory vs Distributed Cache", () => {
  const OPS = 5000
  const DATA_SIZE = 1000

  it("GET performance comparison", async () => {
    const products = generateProducts(DATA_SIZE)
    const keys = generateKeys(DATA_SIZE, "product")

    // Setup InMemory
    const inMemory = new InMemoryCacheService(60)
    for (let i = 0; i < DATA_SIZE; i++) {
      await inMemory.set(keys[i], products[i], 60)
    }

    // Setup Distributed
    const distributed = new DistributedCacheService(3, 10000, 60)
    for (let i = 0; i < DATA_SIZE; i++) {
      await distributed.set(keys[i], products[i], 60)
    }

    // Benchmark GET - InMemory
    let idx = 0
    const inMemResult = await measureOps(
      "InMemory GET",
      async () => {
        await inMemory.get(keys[idx % DATA_SIZE])
        idx++
      },
      OPS
    )

    // Benchmark GET - Distributed
    idx = 0
    const distResult = await measureOps(
      "Distributed GET",
      async () => {
        await distributed.get(keys[idx % DATA_SIZE])
        idx++
      },
      OPS
    )

    console.log("\n╔══════════════════════════════════════════════════════════════╗")
    console.log("║            GET Performance (5000 ops, 1000 keys)           ║")
    console.log("╠══════════════════════════════════════════════════════════════╣")
    console.log(`║  InMemory:      ${inMemResult.opsPerSec.toString().padStart(8)} ops/sec  avg: ${inMemResult.avgLatencyMs.toFixed(3)}ms  p99: ${inMemResult.p99Ms.toFixed(3)}ms  ║`)
    console.log(`║  Distributed:   ${distResult.opsPerSec.toString().padStart(8)} ops/sec  avg: ${distResult.avgLatencyMs.toFixed(3)}ms  p99: ${distResult.p99Ms.toFixed(3)}ms  ║`)
    console.log("╚══════════════════════════════════════════════════════════════╝")

    await inMemory.clear()
    await distributed.clear()

    expect(inMemResult.opsPerSec).toBeGreaterThan(0)
    expect(distResult.opsPerSec).toBeGreaterThan(0)
  })

  it("SET performance comparison", async () => {
    const products = generateProducts(DATA_SIZE)
    const keys = generateKeys(DATA_SIZE, "product")

    const inMemory = new InMemoryCacheService(60)
    const distributed = new DistributedCacheService(3, 10000, 60)

    // Benchmark SET - InMemory
    let idx = 0
    const inMemResult = await measureOps(
      "InMemory SET",
      async () => {
        await inMemory.set(keys[idx % DATA_SIZE], products[idx % DATA_SIZE], 60)
        idx++
      },
      OPS
    )

    // Benchmark SET - Distributed
    idx = 0
    const distResult = await measureOps(
      "Distributed SET",
      async () => {
        await distributed.set(keys[idx % DATA_SIZE], products[idx % DATA_SIZE], 60)
        idx++
      },
      OPS
    )

    console.log("\n╔══════════════════════════════════════════════════════════════╗")
    console.log("║            SET Performance (5000 ops, 1000 keys)           ║")
    console.log("╠══════════════════════════════════════════════════════════════╣")
    console.log(`║  InMemory:      ${inMemResult.opsPerSec.toString().padStart(8)} ops/sec  avg: ${inMemResult.avgLatencyMs.toFixed(3)}ms  p99: ${inMemResult.p99Ms.toFixed(3)}ms  ║`)
    console.log(`║  Distributed:   ${distResult.opsPerSec.toString().padStart(8)} ops/sec  avg: ${distResult.avgLatencyMs.toFixed(3)}ms  p99: ${distResult.p99Ms.toFixed(3)}ms  ║`)
    console.log("╚══════════════════════════════════════════════════════════════╝")

    await inMemory.clear()
    await distributed.clear()

    expect(inMemResult.opsPerSec).toBeGreaterThan(0)
    expect(distResult.opsPerSec).toBeGreaterThan(0)
  })

  it("MIXED workload (80% read, 20% write)", async () => {
    const products = generateProducts(DATA_SIZE)
    const keys = generateKeys(DATA_SIZE, "product")

    // Pre-populate
    const inMemory = new InMemoryCacheService(60)
    const distributed = new DistributedCacheService(3, 10000, 60)
    for (let i = 0; i < DATA_SIZE; i++) {
      await inMemory.set(keys[i], products[i], 60)
      await distributed.set(keys[i], products[i], 60)
    }

    // Benchmark mixed
    let idx = 0
    const inMemResult = await measureOps(
      "InMemory MIXED",
      async () => {
        const isRead = Math.random() < 0.8
        if (isRead) {
          await inMemory.get(keys[idx % DATA_SIZE])
        } else {
          await inMemory.set(keys[idx % DATA_SIZE], products[idx % DATA_SIZE], 60)
        }
        idx++
      },
      OPS
    )

    idx = 0
    const distResult = await measureOps(
      "Distributed MIXED",
      async () => {
        const isRead = Math.random() < 0.8
        if (isRead) {
          await distributed.get(keys[idx % DATA_SIZE])
        } else {
          await distributed.set(keys[idx % DATA_SIZE], products[idx % DATA_SIZE], 60)
        }
        idx++
      },
      OPS
    )

    console.log("\n╔══════════════════════════════════════════════════════════════╗")
    console.log("║        MIXED Performance (80% read, 20% write, 5K ops)     ║")
    console.log("╠══════════════════════════════════════════════════════════════╣")
    console.log(`║  InMemory:      ${inMemResult.opsPerSec.toString().padStart(8)} ops/sec  avg: ${inMemResult.avgLatencyMs.toFixed(3)}ms  p99: ${inMemResult.p99Ms.toFixed(3)}ms  ║`)
    console.log(`║  Distributed:   ${distResult.opsPerSec.toString().padStart(8)} ops/sec  avg: ${distResult.avgLatencyMs.toFixed(3)}ms  p99: ${distResult.p99Ms.toFixed(3)}ms  ║`)
    console.log("╚══════════════════════════════════════════════════════════════╝")

    await inMemory.clear()
    await distributed.clear()

    expect(inMemResult.opsPerSec).toBeGreaterThan(0)
    expect(distResult.opsPerSec).toBeGreaterThan(0)
  })

  it("data distribution across nodes", async () => {
    const distributed = new DistributedCacheService(3, 10000, 60)
    const products = generateProducts(1000)
    const keys = generateKeys(1000, "product")

    for (let i = 0; i < 1000; i++) {
      await distributed.set(keys[i], products[i], 60)
    }

    const stats = distributed.getStats()
    const total = stats.reduce((sum, s) => sum + s.size, 0)

    console.log("\n╔══════════════════════════════════════════════════════════════╗")
    console.log("║            Data Distribution (1000 keys, 3 nodes)          ║")
    console.log("╠══════════════════════════════════════════════════════════════╣")
    for (const stat of stats) {
      const pct = ((stat.size / total) * 100).toFixed(1)
      const bar = "█".repeat(Math.round(stat.size / 10))
      console.log(`║  ${stat.id.padEnd(15)} ${stat.size.toString().padStart(4)} keys (${pct.padStart(5)}%) ${bar.padEnd(20)}  ║`)
    }
    console.log("╠══════════════════════════════════════════════════════════════╣")
    console.log(`║  Total: ${total} keys distributed evenly via consistent hashing  ║`)
    console.log("╚══════════════════════════════════════════════════════════════╝")

    await distributed.clear()

    expect(total).toBe(1000)
    // Each node should have at least 10% of keys (good distribution)
    for (const stat of stats) {
      expect(stat.size).toBeGreaterThan(100)
    }
  })
})
