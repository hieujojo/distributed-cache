# Contributing

Thanks for your interest in contributing to `@hieujojo/distributed-cache`!

## Development Setup

```bash
git clone https://github.com/hieujojo/distributed-cache.git
cd distributed-cache
npm install
```

## Available Scripts

| Command | Description |
|---|---|
| `npm test` | Run all tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run build` | Build the package |
| `npm run lint` | Typecheck with TypeScript |
| `npm run benchmark` | Run performance benchmarks |
| `npm run demo` | Run quick demo |
| `npm run demo:full` | Run full demo with TCP server |

## Guidelines

1. **Tests must pass** before every commit (`npm test`)
2. **Coverage >= 80%** for new code
3. **Typecheck clean** (`npm run lint`)
4. Follow existing code style

## Commit Convention

```
<type>: <description>
```

| Type | Description |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `test` | Adding tests |
| `refactor` | Code refactoring |
| `ci` | CI/CD changes |
| `chore` | Maintenance tasks |

**Examples:**
```
feat: add LFU eviction strategy
fix: handle empty cache in getNode()
docs: update README with benchmarks
test: add integration tests for TCP server
```

## Project Structure

```
src/
├── core/           # ConsistentHash, CacheNode, Cluster
├── strategies/     # LRU, LFU, FIFO
├── server/         # TCP server, client, protocol
├── metrics/        # Memory monitoring
└── demo/           # Example scripts
tests/
├── core/           # Unit tests
├── strategies/     # Strategy tests
├── server/         # Server tests
├── integration/    # TCP integration tests
└── benchmark/      # Performance tests
```

## Adding a New Eviction Strategy

1. Create `src/strategies/your-strategy.ts`
2. Implement `EvictionStrategy` interface from `src/core/types.ts`
3. Add to `src/strategies/index.ts` factory
4. Add tests in `tests/strategies/`
5. Update documentation

## Questions?

Open a [GitHub Discussion](https://github.com/hieujojo/distributed-cache/discussions) or check the [Documentation](https://distributed-cache-docs.vercel.app/).
