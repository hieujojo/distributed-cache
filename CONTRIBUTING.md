# Contributing

## Development Setup

```bash
git clone https://github.com/hieujojo/distributed-cache.git
cd distributed-cache
npm install
```

## Scripts

```bash
npm test                 # Run all tests
npm run test:coverage    # Run tests with coverage
npm run build            # Build package
npm run lint             # Typecheck
npm run benchmark        # Run performance benchmarks
```

## Project Rules

1. **Tests must pass** before every commit
2. **Coverage >= 80%** for new code
3. **Typecheck clean** (`npm run lint`)
4. Follow existing code style (no linter configured — match patterns in codebase)

## Commit Convention

```
<type>: <description>

Types: feat, fix, docs, test, refactor, ci, chore
```

Examples:
```
feat: add LFU eviction strategy
fix: handle empty cache in getNode()
docs: update README with benchmarks
test: add integration tests for TCP server
ci: upgrade GitHub Actions to v7
```

## Architecture

- `src/core/` — Core logic (ConsistentHash, CacheNode, Cluster)
- `src/strategies/` — Eviction strategies (LRU, LFU, FIFO)
- `src/server/` — TCP server, client, protocol
- `src/metrics/` — Memory monitoring
- `tests/` — Unit + integration tests

## Adding a New Eviction Strategy

1. Create `src/strategies/your-strategy.ts`
2. Implement `EvictionStrategy` interface from `src/core/types.ts`
3. Add to `src/strategies/index.ts` factory
4. Add tests in `tests/strategies/`
5. Update docs
