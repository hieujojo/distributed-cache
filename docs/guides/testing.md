# 🧪 TESTING — Hướng dẫn kiểm thử

> **Mục đích:** Hướng dẫn cách test toàn bộ hệ thống, từ unit test đến integration test.

---

## 0. Chuẩn bị mỗi lần test

```bash
# 1. Cài dependencies (nếu chưa có)
npm install

# 2. Chạy tests
npm test

# 3. Nếu fail → đọc log, fix, chạy lại
```

---

## 1. Testing Tool

### Jest — Công cụ duy nhất cần dùng

```
Jest = Unit test + Integration test + TCP test
→ Đủ cho toàn bộ project này
```

| Loại test       | Jest làm gì                        |
|-----------------|-----------------------------------|
| Unit Test       | Test function, class riêng lẻ     |
| Integration     | Test N files kết nối TCP thật     |
| TCP/Socket Test | Test server + client qua network  |

### Tại sao chỉ cần Jest?

- **Phổ biến nhất** — mọi company ở VN đều dùng
- **Đơn giản** — chỉ 1 công cụ, không cần học thêm
- **Đủ mạnh** — unit + integration + TCP test đều được
- **CV value** — biết Jest = biết testing cơ bản

---

## 2. Unit Tests

### Chạy tất cả

```bash
npm test
```

### Chạy 1 module cụ thể

```bash
# Core (Module 1)
npx jest tests/core/consistent-hashing.test.ts
npx jest tests/core/node.test.ts

# Strategies (Module 2)
npx jest tests/strategies/lru.test.ts
npx jest tests/strategies/lfu.test.ts
npx jest tests/strategies/fifo.test.ts

# Server (Module 3)
npx jest tests/server/protocol.test.ts
npx jest tests/server/cache-server.test.ts
npx jest tests/server/client.test.ts

# Cluster (Module 4)
npx jest tests/core/cluster.test.ts
npx jest tests/core/election.test.ts
npx jest tests/core/failover.test.ts

# Replication (Module 5)
npx jest tests/core/replication.test.ts

# Cache Invalidation (Module 6)
npx jest tests/core/invalidation.test.ts
```

### Chạy với coverage

```bash
npm run test:coverage
# Coverage report ở: coverage/lcov-report/index.html
```

### Chạy watch mode (khi development)

```bash
npx jest --watch
```

### Kết quả mong đợi

```
✅ Test Suites: 15 passed, 15 total
✅ Tests:       232 passed, 232 total
✅ Coverage:    ≥ 80%
```

---

## 3. Integration Tests (TCP Server/Client)

### Mục đích

Test N files kết nối với nhau qua TCP thật, không mock.

### Chạy

```bash
npx jest tests/integration/ --forceExit
```

### Test cases

| Test case          | Flow test                                     |
|--------------------|-----------------------------------------------|
| SET + GET          | Client → TCP → Server → CacheNode → GET       |
| GET missing        | Client → GET key không tồn tại → NULL         |
| DEL                | Client → SET → DEL → GET → NULL               |
| PING/PONG          | Client → PING → Server trả PONG               |
| TTL expiration     | SET (ttl=100ms) → chờ 200ms → GET → NULL     |
| Multiple clients   | 2 clients cùng SET/GET → không conflict       |
| Invalid command    | Gửi invalid command → nhận ERROR              |
| Server restart     | Server tắt → bật lại → data mất (in-memory) |
| Large payload      | SET value lớn → GET → đúng                    |
| Concurrent ops     | Nhiều SET/GET cùng lúc → data đúng            |

### Ví dụ code

```typescript
// tests/integration/client-server.test.ts
import { CacheServer } from '../../src/server/cache-server';
import { CacheClient } from '../../src/server/client';

describe('TCP Integration', () => {
  let server: CacheServer;
  let client: CacheClient;

  beforeAll(async () => {
    server = new CacheServer({ port: 0 }); // random port
    await server.start();
    client = new CacheClient({ port: server.getPort() });
    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    await server.stop();
  });

  it('SET then GET returns correct value', async () => {
    await client.set('user:1001', 'Hiếu');
    const result = await client.get('user:1001');
    expect(result).toBe('Hiếu');  // TCP thật!
  });
});
```

---

## 4. Build Test

```bash
# Kiểm tra TypeScript compile
npx tsc --noEmit

# Build package
npm run build
# Output: dist/index.js, dist/index.cjs, dist/index.d.ts
```

---

## 4. Benchmark

```bash
npm run benchmark
```

Kết quả:
- Balanced: ~1.4M ops/sec
- Read-heavy: ~847K ops/sec
- Write-heavy: ~1.38M ops/sec

---

## 5. Debug khi test fail

### Kiểm tra syntax errors

```bash
npx tsc --noEmit
# Nếu có lỗi TypeScript → fix trước khi chạy test
```

### Kiểm tra import errors

```bash
# Import không cần .js extension trong codebase này
import { something } from './file';  // ✅
import { something } from './file.js';  // ❌
```

### Kiểm tra mock

```bash
# Nếu test dùng mock → đảm bảo mock được clear giữa các tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Timer leak warning

```bash
# Nếu Jest báo timer leak → dùng --forceExit
npx jest --forceExit
```

---

## 6. Checklist khi commit

```
□ npm test → ALL PASS
□ npx tsc --noEmit → NO ERRORS
□ Coverage ≥ 80%
□ Không có console.log thừa
□ Không có unused imports
```

---

## 7. Test Structure

```
tests/
├── core/
│   ├── consistent-hashing.test.ts  (13 tests)
│   ├── node.test.ts                (17 tests)
│   ├── cluster.test.ts             (17 tests)
│   ├── election.test.ts            (13 tests)
│   ├── failover.test.ts            (16 tests)
│   ├── replication.test.ts         (18 tests)
│   └── invalidation.test.ts        (20 tests)
├── strategies/
│   ├── lru.test.ts                 (8 tests)
│   ├── lfu.test.ts                 (5 tests)
│   └── fifo.test.ts                (6 tests)
├── server/
│   ├── protocol.test.ts            (47 tests)
│   ├── cache-server.test.ts        (13 tests)
│   └── client.test.ts              (17 tests)
├── benchmark/
│   └── benchmark.test.ts           (8 tests)
└── integration/                    ← MỚI
    └── client-server.test.ts       (~10 tests)
```

**Total: 232 tests, 15 test suites**

---

## 8. CI/CD Pipeline (GitHub Actions)

### Files

- `.github/workflows/test.yml` — Auto test on push/PR to main
- `.github/workflows/publish.yml` — Auto publish to npm on tag push

### test.yml

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit        # Typecheck
      - run: npm test                 # Unit + Integration tests
      - run: npm run test:coverage    # Coverage
      - run: npm run build            # Build
      - uses: actions/upload-artifact@v7
        if: always()
        with:
          name: test-report
          path: test-report/
          retention-days: 7
```

### publish.yml

```yaml
name: Publish to npm

on:
  push:
    tags:
      - "v*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Publish workflow

```bash
# Bump version + create tag → tự publish
npm version patch    # 0.1.x → 0.1.x+1
npm version minor    # 0.x.x → 0.x+1.0
npm version major    # x.x.x → x+1.0.0
git push --tags      # GitHub Actions tự publish
```

### Prerequisites

- npm account: https://www.npmjs.com
- npm token: Classic Token → Automation (bypass 2FA)
- GitHub Secret: `NPM_TOKEN`

### Badge trên README

```markdown
![Tests](https://github.com/hieujojo/distributed-cache/actions/workflows/test.yml/badge.svg)
```

---

*Cập nhật file này khi thêm test suites mới.*
