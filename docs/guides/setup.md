# Hướng dẫn Cài đặt

## Yêu cầu hệ thống

```
Node.js:  >= 20.0.0
npm:      >= 10.0.0
Git:      >= 2.0.0
OS:       macOS, Linux, Windows
```

## Cài đặt

### 1. Clone repository

```bash
git clone https://github.com/hieujojo/distributed-cache.git
cd distributed-cache
```

### 2. Install dependencies

```bash
npm install
```

### 3. Verify installation

```bash
npm test
```

Nếu tất cả tests pass → cài đặt thành công.

## Chạy tests

```bash
npm test                    # Chạy tất cả tests
npm run test:coverage       # Check coverage (>= 80%)
npm run test:watch          # Watch mode
```

> Chi tiết hơn xem docs/guides/testing.md

## Cấu trúc sau khi cài đặt

```
distributed-cache/
├── node_modules/          # Dependencies
├── src/                   # Source code
├── tests/                 # Tests
├── dist/                  # Build output
├── docs/                  # Documentation
└── agent/                 # Development workflow
```

## Troubleshooting

### Lỗi: "Cannot find module"

```bash
rm -rf node_modules
npm install
```

### Lỗi: "TypeScript compilation error"

```bash
npx tsc --noEmit
```

## Sử dụng như Library

```typescript
import { ConsistentHash } from 'distributed-cache';

const ring = new ConsistentHash();
ring.addNode({ id: 'node-1', host: 'localhost', port: 3001 });
ring.addNode({ id: 'node-2', host: 'localhost', port: 3002 });

const node = ring.getNode('user:123');
console.log(node);
```
