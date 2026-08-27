# Distributed Cache System

![Tests](https://github.com/hieujojo/distributed-cache/actions/workflows/test.yml/badge.svg)

> Lightweight distributed cache built from scratch in TypeScript — demonstrating consistent hashing, replication, and eviction strategies used in Redis, DynamoDB, and Cassandra.

## Documentation

📖 **[Docs (EN)](https://distributed-cache-docs.vercel.app/)** | **[Tài liệu (VI)](https://distributed-cache-docs.vercel.app/vi/)**

## Features

| Feature | Description |
|---|---|
| Consistent Hashing | Hash ring with virtual nodes for even data distribution |
| Eviction (LRU/LFU/FIFO) | Automatically remove old entries when cache is full |
| TTL (Time To Live) | Auto-expire entries after a set time |
| Replication | Copy data to backup nodes for fault tolerance |
| Cache Invalidation | Wildcard-based cleanup when source data changes |
| Cluster Management | Leader election + automatic failover |
| TCP Protocol | Low-latency network communication |
| Persistence | Optional file-based storage |

## Performance

```
Throughput:  120,000+ ops/sec (in-memory)
Latency:     <0.01ms avg, <0.03ms p99
Distribution: 36/35/29% across 3 nodes (even)
```

## Quick Start

```bash
npm install @hieujojo/distributed-cache
```

```typescript
import { CacheNode, ConsistentHash } from "@hieujojo/distributed-cache";

// Create nodes
const node1 = new CacheNode("node-1", { maxSize: 10000 });
const node2 = new CacheNode("node-2", { maxSize: 10000 });
const node3 = new CacheNode("node-3", { maxSize: 10000 });

// Setup consistent hashing
const hash = new ConsistentHash();
hash.addNode({ id: "node-1" });
hash.addNode({ id: "node-2" });
hash.addNode({ id: "node-3" });

// Store data
const key = "user:123";
const node = hash.getNode(key);
node?.set(key, { name: "John", email: "john@example.com" });

// Retrieve data
const value = node?.get(key);
console.log(value); // { name: "John", email: "john@example.com" }
```

## With TCP Server

```typescript
import { CacheServer, CacheClient, CacheNode } from "@hieujojo/distributed-cache";

// Start server
const server = new CacheServer({ host: "127.0.0.1", port: 3000 });
server.addNode(new CacheNode("node-1", { maxSize: 10000 }));
await server.start();

// Connect client
const client = new CacheClient({ host: "127.0.0.1", port: 3000 });
await client.connect();

// Use cache
await client.set("product:456", { name: "iPhone", price: 999 });
const product = await client.get("product:456");
console.log(product); // { name: "iPhone", price: 999 }

await client.disconnect();
await server.stop();
```

## Eviction Strategies

```typescript
const lru = new CacheNode("lru", { maxSize: 3, evictionPolicy: "lru" });  // default
const lfu = new CacheNode("lfu", { maxSize: 3, evictionPolicy: "lfu" });
const fifo = new CacheNode("fifo", { maxSize: 3, evictionPolicy: "fifo" });
```

## Benchmark

```
╔══════════════════════════════════════════════════════╗
║  Cache Operations (5000 ops, 1000 keys)            ║
╠══════════════════════════════════════════════════════╣
║  GET:   120,000+ ops/sec   avg: 0.008ms            ║
║  SET:   131,000+ ops/sec   avg: 0.008ms            ║
║  MIXED: 119,000+ ops/sec   (80% read, 20% write)   ║
╚══════════════════════════════════════════════════════╝
```

Real-world benchmark: [Medusa.js integration](https://distributed-cache-docs.vercel.app/guide/benchmark)

## Medusa Integration

```typescript
import { DistributedCacheService } from "@medusajs/cache-distributed"

const cache = new DistributedCacheService({}, {
  nodeCount: 3,
  maxSize: 10000,
  ttl: 30,
  evictionPolicy: "lru",
  replication: true,
})

await cache.set("product:123", productData, 60)
const data = await cache.get("product:123")
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript | Type safety, IDE support |
| Runtime | Node.js | Ecosystem, compatibility |
| Hash | murmurhash | Fast, good distribution |
| Network | TCP sockets | Low latency, Redis-compatible |
| Testing | Jest | Industry standard |
| CI/CD | GitHub Actions | Automated testing |
| Build | tsup | Fast bundler |

## Tests

```
✅ 317 tests — all pass
✅ Coverage: 91.8% statements, 81.8% branches
✅ CI/CD: GitHub Actions (auto test on push/PR)
```

## Project Structure

```
distributed-cache/
├── src/
│   ├── core/          # Consistent hashing, CacheNode, Cluster
│   ├── strategies/    # LRU, LFU, FIFO
│   ├── server/        # TCP server, client, protocol
│   ├── metrics/       # Memory monitoring, auto-flush
│   └── demo/          # Demo scripts
├── tests/
│   ├── core/          # Core tests
│   ├── strategies/    # Strategy tests
│   ├── server/        # Server tests
│   └── integration/   # Integration tests
├── docs/              # Internal documentation
└── .github/workflows/ # CI/CD
```

## Security

See [SECURITY.md](SECURITY.md) for security considerations.

## License

MIT
