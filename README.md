# `@hieujojo/distributed-cache`

> Lightweight distributed cache built from scratch in TypeScript — demonstrating consistent hashing, replication, and eviction strategies used in **Redis**, **DynamoDB**, and **Cassandra**.

[![npm version](https://img.shields.io/npm/v/@hieujojo/distributed-cache.svg)](https://www.npmjs.com/package/@hieujojo/distributed-cache)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests](https://github.com/hieujojo/distributed-cache/actions/workflows/test.yml/badge.svg)](https://github.com/hieujojo/distributed-cache/actions)
[![Node.js](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

---

📖 **[Documentation (EN)](https://distributed-cache-docs.vercel.app/)** | **[Tài liệu (VI)](https://distributed-cache-docs.vercel.app/vi/)**

---

## Features

| Feature | Description |
|---|---|
| **Consistent Hashing** | Hash ring with virtual nodes for even data distribution |
| **Eviction Strategies** | LRU, LFU, FIFO — auto-remove old entries when cache is full |
| **TTL** | Auto-expire entries after a set time |
| **Replication** | Copy data to backup nodes for fault tolerance |
| **Cache Invalidation** | Wildcard-based cleanup when source data changes |
| **Cluster Management** | Leader election + automatic failover |
| **TCP Protocol** | Low-latency wire protocol (Redis-inspired) |
| **Persistence** | Optional file-based storage |
| **Medusa.js Integration** | Ready-to-use adapter for e-commerce platforms |

## Performance

```
╔══════════════════════════════════════════════════════╗
║  Cache Operations (5000 ops, 1000 keys, 3 nodes)   ║
╠══════════════════════════════════════════════════════╣
║  GET:   120,000+ ops/sec   avg: 0.008ms            ║
║  SET:   131,000+ ops/sec   avg: 0.008ms            ║
║  MIXED: 119,000+ ops/sec   (80% read, 20% write)   ║
╠══════════════════════════════════════════════════════╣
║  Data Distribution: 36% / 35% / 29% (even)         ║
║  Eviction:          LRU (default), LFU, FIFO        ║
╚══════════════════════════════════════════════════════╝
```

## Install

```bash
npm install @hieujojo/distributed-cache
```

## Quick Start

```typescript
import { CacheNode, ConsistentHash } from "@hieujojo/distributed-cache";

// Create cache nodes
const node1 = new CacheNode("node-1", { maxSize: 10000 });
const node2 = new CacheNode("node-2", { maxSize: 10000 });
const node3 = new CacheNode("node-3", { maxSize: 10000 });

// Setup consistent hashing (hash ring)
const hash = new ConsistentHash();
hash.addNode(node1);
hash.addNode(node2);
hash.addNode(node3);

// Store data — automatically routes to correct node
const key = "user:123";
const node = hash.getNode(key);
node?.set(key, { name: "John", email: "john@example.com" });

// Retrieve data
const value = node?.get(key);
console.log(value); // { name: "John", email: "john@example.com" }
```

## TCP Server

```typescript
import { CacheServer, CacheClient, CacheNode } from "@hieujojo/distributed-cache";

// Start server
const server = new CacheServer({ host: "127.0.0.1", port: 3000 });
server.addNode(new CacheNode("node-1", { maxSize: 10000 }));
await server.start();

// Connect client
const client = new CacheClient({ host: "127.0.0.1", port: 3000 });
await client.connect();

// Use cache via TCP
await client.set("product:456", { name: "iPhone", price: 999 });
const product = await client.get("product:456");
console.log(product); // { name: "iPhone", price: 999 }

await client.disconnect();
await server.stop();
```

## Eviction Strategies

```typescript
// LRU (default) — evicts least recently used
const lru = new CacheNode("lru", { maxSize: 1000, evictionPolicy: "lru" });

// LFU — evicts least frequently used
const lfu = new CacheNode("lfu", { maxSize: 1000, evictionPolicy: "lfu" });

// FIFO — evicts oldest entries
const fifo = new CacheNode("fifo", { maxSize: 1000, evictionPolicy: "fifo" });
```

## Medusa.js Integration

```typescript
import { DistributedCacheService } from "@medusajs/cache-distributed";

const cache = new DistributedCacheService({}, {
  nodeCount: 3,
  maxSize: 10000,
  ttl: 30,
  evictionPolicy: "lru",
  replication: true,
});

await cache.set("product:123", productData, 60);
const data = await cache.get("product:123");
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Client Layer                        │
│  CacheClient  │  Visualization  │  Benchmark    │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│              Network Layer                       │
│  TCP Server ── Protocol Parser ── Serializer    │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│              Core Layer                          │
│  ClusterManager │ ConsistentHash │ Replication  │
│  CacheNode      │ EvictionPolicy │ TTL Sweep    │
└──────────────────┬──────────────────────────────┘
                   ▼
┌─────────────────────────────────────────────────┐
│              Storage Layer                       │
│  In-Memory HashMap (key → value + metadata)     │
└─────────────────────────────────────────────────┘
```

## Tests

```
✅ 317 tests — all pass
✅ Coverage: 91.8% statements, 81.8% branches
✅ CI/CD: GitHub Actions (auto test on push/PR)
✅ Integration: TCP server/client real network tests
```

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Language | TypeScript 5.x | Type safety, IDE support |
| Runtime | Node.js >=22 | Non-blocking I/O, event-driven |
| Hash | murmurhash | Fast, good distribution |
| Network | TCP sockets | Low latency, persistent connections |
| Testing | Jest | Industry standard, built-in mocking |
| CI/CD | GitHub Actions | Automated test + npm publish |
| Build | tsup | Fast bundler, ESM + CJS |

## Project Structure

```
distributed-cache/
├── src/
│   ├── core/              # ConsistentHash, CacheNode, Cluster
│   ├── strategies/        # LRU, LFU, FIFO
│   ├── server/            # TCP server, client, protocol
│   ├── metrics/           # Memory monitoring, auto-flush
│   └── demo/              # Example scripts
├── tests/
│   ├── core/              # Unit tests
│   ├── strategies/        # Strategy tests
│   ├── server/            # Server tests
│   ├── integration/       # TCP integration tests
│   └── benchmark/         # Performance tests
├── docs/                  # Internal documentation
└── .github/workflows/     # CI/CD pipelines
```

## Security

See [SECURITY.md](SECURITY.md) for security considerations and known limitations.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## License

[MIT](LICENSE) &copy; Truong Cong Hieu
