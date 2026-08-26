/**
 * Test cho DistributedCacheService adapter (Medusa ICacheService interface).
 *
 * Chạy trong distributed-cache project vì Medusa yarn workspace
 * không cho npm install trực tiếp.
 *
 * Sau khi verify, copy adapter vào Medusa monorepo.
 */

import { CacheNode } from "../src/core/node"
import { ConsistentHash } from "../src/core/consistent-hashing"

// ─── Adapter: DistributedCacheService ──────────────────────────────
// Tái tạo adapter logic ở đây để test standalone

class DistributedCacheService {
  private readonly TTL: number
  private readonly ring: ConsistentHash
  private readonly nodes: CacheNode[]
  private readonly replicaCount: number
  private readonly replication: boolean

  constructor(options: {
    nodeCount?: number
    maxSize?: number
    ttl?: number
    evictionPolicy?: "lru" | "lfu" | "fifo"
    virtualNodes?: number
    replication?: boolean
    replicaCount?: number
  } = {}) {
    this.TTL = options.ttl ?? 30
    this.replication = options.replication ?? false
    this.replicaCount = options.replicaCount ?? 1

    const nodeCount = options.nodeCount ?? 3
    const maxSize = options.maxSize ?? 10000
    const evictionPolicy = options.evictionPolicy ?? "lru"
    const virtualNodes = options.virtualNodes ?? 150

    this.nodes = []
    for (let i = 0; i < nodeCount; i++) {
      const node = new CacheNode(`cache-node-${i}`, {
        maxSize: Math.ceil(maxSize / nodeCount),
        defaultTtl: this.TTL * 1000,
        evictionPolicy,
        sweepIntervalMs: 0,
      })
      this.nodes.push(node)
    }

    this.ring = new ConsistentHash({ virtualNodes })
    for (const node of this.nodes) {
      this.ring.addNode({ id: node.id, host: "localhost", port: 0 } as any)
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const node = this.getNodeForKey(key)
    const value = node.get(key)
    return (value as T) ?? null
  }

  async set(key: string, data: unknown, ttl: number = this.TTL): Promise<void> {
    if (ttl === 0) return
    const ttlMs = ttl * 1000
    const node = this.getNodeForKey(key)
    node.set(key, data as any, ttlMs)

    if (this.replication && this.replicaCount > 1) {
      for (const replica of this.getReplicaNodes(key)) {
        replica.set(key, data as any, ttlMs)
      }
    }
  }

  async invalidate(key: string): Promise<void> {
    if (key.includes("*")) {
      const pattern = new RegExp("^" + key.replace(/\*/g, ".*") + "$")
      for (const node of this.nodes) {
        for (const k of node.getKeys()) {
          if (pattern.test(k)) node.delete(k)
        }
      }
    } else {
      const node = this.getNodeForKey(key)
      node.delete(key)
      if (this.replication) {
        for (const replica of this.getReplicaNodes(key)) {
          replica.delete(key)
        }
      }
    }
  }

  async clear(): Promise<void> {
    for (const node of this.nodes) {
      node.stopSweep()
      node.clear()
    }
  }

  getStats(): Array<{ id: string; size: number; maxSize: number }> {
    return this.nodes.map((node) => ({
      id: node.id,
      size: node.getSize(),
      maxSize: node.getMaxSize(),
    }))
  }

  private getNodeForKey(key: string): CacheNode {
    const nodeInfo = this.ring.getNode(key)
    const node = this.nodes.find((n) => n.id === nodeInfo?.id)
    return node ?? this.nodes[0]
  }

  private getReplicaNodes(key: string): CacheNode[] {
    const primary = this.getNodeForKey(key)
    return this.nodes
      .filter((n) => n.id !== primary.id)
      .slice(0, this.replicaCount - 1)
  }
}

// ─── Tests ─────────────────────────────────────────────────────────

describe("DistributedCacheService (Medusa adapter)", () => {
  let service: DistributedCacheService

  beforeEach(() => {
    service = new DistributedCacheService({
      nodeCount: 3,
      maxSize: 1000,
      ttl: 30,
      evictionPolicy: "lru",
    })
  })

  afterEach(async () => {
    await service.clear()
  })

  describe("get/set", () => {
    it("should store and retrieve a value", async () => {
      await service.set("user:1", { name: "Hieu" }, 60)
      const result = await service.get("user:1")
      expect(result).toEqual({ name: "Hieu" })
    })

    it("should return null for non-existing key", async () => {
      const result = await service.get("nonexistent")
      expect(result).toBeNull()
    })

    it("should overwrite existing key", async () => {
      await service.set("key", "value1", 60)
      await service.set("key", "value2", 60)
      const result = await service.get("key")
      expect(result).toBe("value2")
    })

    it("should store different data types", async () => {
      await service.set("string", "hello", 60)
      await service.set("number", 42, 60)
      await service.set("boolean", true, 60)
      await service.set("array", [1, 2, 3], 60)
      await service.set("object", { key: "value" }, 60)

      expect(await service.get("string")).toBe("hello")
      expect(await service.get("number")).toBe(42)
      expect(await service.get("boolean")).toBe(true)
      expect(await service.get("array")).toEqual([1, 2, 3])
      expect(await service.get("object")).toEqual({ key: "value" })
    })

    it("should handle Vietnamese strings with spaces", async () => {
      await service.set("user:viet", "Nguyễn Văn A", 60)
      const result = await service.get("user:viet")
      expect(result).toBe("Nguyễn Văn A")
    })
  })

  describe("TTL", () => {
    it("should expire keys after TTL", async () => {
      await service.set("expires", "soon", 1)
      const before = await service.get("expires")
      expect(before).toBe("soon")

      await new Promise((resolve) => setTimeout(resolve, 1100))

      const after = await service.get("expires")
      expect(after).toBeNull()
    })

    it("should not store if ttl is 0", async () => {
      await service.set("zero", "value", 0)
      const result = await service.get("zero")
      expect(result).toBeNull()
    })
  })

  describe("invalidate", () => {
    it("should delete a specific key", async () => {
      await service.set("delete-me", "value", 60)
      await service.invalidate("delete-me")
      const result = await service.get("delete-me")
      expect(result).toBeNull()
    })

    it("should support wildcard matching", async () => {
      await service.set("product:1", { id: 1 }, 60)
      await service.set("product:2", { id: 2 }, 60)
      await service.set("product:3", { id: 3 }, 60)
      await service.set("user:1", { id: 1 }, 60)

      await service.invalidate("product:*")

      expect(await service.get("product:1")).toBeNull()
      expect(await service.get("product:2")).toBeNull()
      expect(await service.get("product:3")).toBeNull()
      expect(await service.get("user:1")).toEqual({ id: 1 })
    })
  })

  describe("clear", () => {
    it("should clear all nodes", async () => {
      await service.set("a", 1, 60)
      await service.set("b", 2, 60)
      await service.set("c", 3, 60)

      await service.clear()

      expect(await service.get("a")).toBeNull()
      expect(await service.get("b")).toBeNull()
      expect(await service.get("c")).toBeNull()
    })
  })

  describe("distribution", () => {
    it("should distribute keys across nodes", async () => {
      for (let i = 0; i < 100; i++) {
        await service.set(`key:${i}`, `value:${i}`, 60)
      }

      const stats = service.getStats()
      expect(stats.length).toBe(3)

      const sizes = stats.map((s) => s.size)
      const totalKeys = sizes.reduce((a, b) => a + b, 0)
      expect(totalKeys).toBe(100)

      const nodesWithKeys = sizes.filter((s) => s > 0)
      expect(nodesWithKeys.length).toBeGreaterThanOrEqual(2)
    })

    it("should route same key to same node", async () => {
      await service.set("consistent", "value", 60)
      const stats1 = service.getStats()

      await service.set("consistent", "value2", 60)
      const stats2 = service.getStats()

      // Same node should hold the key both times
      expect(stats1).toEqual(stats2)
    })
  })

  describe("replication", () => {
    it("should replicate data when enabled", async () => {
      const replService = new DistributedCacheService({
        nodeCount: 3,
        maxSize: 1000,
        ttl: 30,
        replication: true,
        replicaCount: 2,
      })

      await replService.set("repl-key", "repl-value", 60)
      const result = await replService.get("repl-key")
      expect(result).toBe("repl-value")

      await replService.clear()
    })
  })

  describe("stats", () => {
    it("should return stats for all nodes", () => {
      const stats = service.getStats()
      expect(stats.length).toBe(3)
      stats.forEach((stat) => {
        expect(stat).toHaveProperty("id")
        expect(stat).toHaveProperty("size")
        expect(stat).toHaveProperty("maxSize")
        expect(stat.maxSize).toBeGreaterThan(0)
      })
    })
  })
})
