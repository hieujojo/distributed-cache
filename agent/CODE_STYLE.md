# Code Style Guide

## TypeScript

### General Rules

```typescript
// ✓ Viết TypeScript, không phải JavaScript
// ✓ Dùng explicit types cho function parameters và return types
// ✓ Dùng interfaces thay vì type cho objects
// ✓ Dùng readonly cho immutable data
```

### Naming Conventions

```typescript
// Variables & Functions: camelCase
const cacheNode = new CacheNode();
function getKey(key: string): Value | null {}

// Classes: PascalCase
class CacheNode {}
class ConsistentHash {}

// Interfaces: PascalCase, không prefix 'I'
interface CacheNodeConfig {}
interface HashRingOptions {}

// Constants: UPPER_SNAKE_CASE
const MAX_CACHE_SIZE = 1024;
const DEFAULT_TTL = 3600;

// Files: kebab-case
// consistent-hashing.ts
// cache-node.ts
// replication-manager.ts
```

### Types

```typescript
// ✓ Dùng interface thay vì type cho objects
interface User {
  id: string;
  name: string;
  email: string;
}

// ✓ Dùng type cho unions và primitives
type CacheValue = string | number | object;
type NodeStatus = 'active' | 'inactive' | 'failed';

// ✓ Dùng readonly cho immutable data
interface ReadonlyCache {
  readonly size: number;
  readonly maxSize: number;
}

// ✓ Dùng optional properties đúng cách
interface Options {
  ttl?: number;          // Optional
  maxRetries?: number;   // Optional có default value
}
```

### Functions

```typescript
// ✓ Explicit return types
function getKey(key: string): Value | null {
  return this.storage.get(key) ?? null;
}

// ✓ Dùng arrow functions cho callbacks
const nodes = ring.getNodes().map(node => node.id);

// ✓ Dùng early return thay vì nested if
function processKey(key: string): void {
  if (!key) return;
  if (key.length > 256) return;
  
  // Process...
}

// ✓ Dùng optional chaining và nullish coalescing
const value = cache.get(key)?.data ?? defaultValue;
```

### Classes

```typescript
// ✓ Dùng access modifiers
class CacheNode {
  private storage: Map<string, Value>;
  private maxSize: number;
  
  constructor(config: CacheNodeConfig) {
    this.storage = new Map();
    this.maxSize = config.maxSize;
  }
  
  // ✓ Public methods first
  get(key: string): Value | null {
    return this.storage.get(key) ?? null;
  }
  
  // ✓ Private methods last
  private evict(): void {
    // ...
  }
}

// ✓ Dùng readonly cho immutable properties
class CacheNode {
  readonly id: string;
  
  constructor(id: string) {
    this.id = id;
  }
}
```

### Error Handling

```typescript
// ✓ Dùng custom errors
class CacheError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'CacheError';
  }
}

class NodeNotFoundError extends CacheError {
  constructor(nodeId: string) {
    super(`Node ${nodeId} not found`, 'NODE_NOT_FOUND');
  }
}

// ✓ Dùng try-catch đúng cách
async function getNode(key: string): Promise<CacheNode> {
  try {
    const nodeId = this.hashRing.getNode(key);
    return this.nodes.get(nodeId)!;
  } catch (error) {
    throw new NodeNotFoundError(key);
  }
}

// ✓ Không swallow errors
try {
  await processKey(key);
} catch (error) {
  console.error('Failed to process key:', error);
  throw error;  // Re-throw nếu cần
}
```

## File Structure

```typescript
// ✓ Imports ở đầu file
import { CacheNode } from './cache-node';
import { ConsistentHash } from './consistent-hashing';

// ✓ Types/Interfaces sau imports
interface HashRingOptions {
  virtualNodes: number;
}

// ✓ Constants sau types
const DEFAULT_VIRTUAL_NODES = 100;

// ✓ Classes/Functions
export class ConsistentHash {
  // ...
}

// ✓ Export ở cuối file (không export inline)
```

## Comments

```typescript
// ✓ Dùng JSDoc cho public APIs
/**
 * Tìm node chịu trách nhiệm cho key
 * @param key - Key cần tìm node
 * @returns Node chịu trách nhiệm
 */
getNode(key: string): CacheNode {
  // ...
}

// ✓ Dùng comments giải thích WHY, không chỉ WHAT
// Sử dụng binary search thay vì linear search
// để giảm O(N) xuống O(log N)
const node = this.binarySearch(ringPosition);

// ✗ Không comment code thừa
// const x = 1;  // Không cần comment dòng này
```

## Testing

```typescript
// ✓ Mô tả behavior, không chỉ implementation
describe('ConsistentHash', () => {
  describe('getNode', () => {
    it('should return correct node for key', () => {
      // Arrange
      const ring = new ConsistentHash();
      ring.addNode({ id: 'node-1', host: 'localhost', port: 3001 });
      
      // Act
      const node = ring.getNode('user:123');
      
      // Assert
      expect(node.id).toBe('node-1');
    });
    
    it('should redistribute only ~20% keys when adding node', () => {
      // Arrange
      const ring = new ConsistentHash();
      // ...
      
      // Act
      ring.addNode({ id: 'node-2', host: 'localhost', port: 3002 });
      
      // Assert
      expect(movedKeysPercentage).toBeLessThan(0.3);
    });
  });
});
```

## Formatting

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80
}
```

```bash
# Format code
npm run format

# Check formatting
npm run format:check
```

## Linting

```json
// .eslintrc.json
{
  "extends": [
    "typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": "warn"
  }
}
```

```bash
# Lint code
npm run lint

# Fix lint errors
npm run lint:fix
```
