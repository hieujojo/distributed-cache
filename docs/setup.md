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

## Sử dụng

### Chạy tests

```bash
# Chạy tất cả tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Chạy tests watch mode
npm run test:watch
```

### Chạy benchmark

```bash
# Chạy benchmark default
npm run benchmark

# Chạy benchmark với cấu hình tùy chỉnh
npm run benchmark -- --nodes 10 --keys 50000
```

### Chạy visualization

```bash
# Dev mode
npm run dev

# Truy cập browser
# http://localhost:3000
```

### Build

```bash
# Build library
npm run build

# Build visualization
npm run build:vis
```

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

### Lỗi: "Port already in use"

```bash
# Tìm process đang dùng port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Lỗi: "Cannot find module"

```bash
# Xóa node_modules và install lại
rm -rf node_modules
npm install
```

### Lỗi: "TypeScript compilation error"

```bash
# Kiểm tra TypeScript version
npx tsc --version

# Build lại
npm run build
```

## Sử dụng như Library

```typescript
// Import vào project của bạn
import { ConsistentHash } from 'distributed-cache';

// Tạo hash ring
const ring = new ConsistentHash();

// Thêm nodes
ring.addNode({ id: 'node-1', host: 'localhost', port: 3001 });
ring.addNode({ id: 'node-2', host: 'localhost', port: 3002 });

// Tìm node cho key
const node = ring.getNode('user:123');
console.log(node); // { id: 'node-1', host: 'localhost', port: 3001 }
```

```typescript
// Circuit Breaker
import { CircuitBreaker } from 'distributed-cache';

const breaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
});

const data = await breaker.execute(() => fetchFromAPI());
```
