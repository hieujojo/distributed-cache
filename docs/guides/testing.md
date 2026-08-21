# 🧪 TESTING — Hướng dẫn kiểm thử

> **Mục đích:** Hướng dẫn cách test toàn bộ hệ thống, từ unit test đến integration test.
> Format lấy cảm hứng từ Void Runner TESTING.md.

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

## 1. Unit Tests

### Chạy tất cả

```bash
npm test
```

### Chạy 1 module cụ thể

```bash
# Core
npx jest tests/core/consistent-hashing.test.ts
npx jest tests/core/node.test.ts

# Strategies
npx jest tests/strategies/lru.test.ts
npx jest tests/strategies/lfu.test.ts
npx jest tests/strategies/fifo.test.ts
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
✅ Test Suites: X passed, X total
✅ Tests:       Y passed, Y total
✅ Coverage:    ≥ 80%
```

---

## 2. Integration Tests (tương lai)

Khi Module 3 (Network Layer) hoàn thành:

```bash
# Test client-server communication
npx jest tests/integration/

# Test cluster failover
npx jest tests/integration/cluster.test.ts
```

---

## 3. Benchmark Tests (tương lai)

Khi Module 7 (Benchmark) hoàn thành:

```bash
# Chạy benchmark
npm run benchmark

# Kết quả ở: benchmarks/results/
```

---

## 4. Debug khi test fail

### Kiểm tra syntax errors

```bash
npx tsc --noEmit
# Nếu có lỗi TypeScript → fix trước khi chạy test
```

### Kiểm tra import errors

```bash
# Đảm bảo import đúng extension
import { something } from './file.js';  // ✅
import { something } from './file';     // ❌
```

### Kiểm tra mock

```bash
# Nếu test dùng mock → đảm bảo mock được clear giữa các tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## 5. Checklist khi commit

```
□ npm test → ALL PASS
□ npx tsc --noEmit → NO ERRORS
□ Coverage ≥ 80%
□ Không có console.log thừa
□ Không có unused imports
```

---

## 6. Ghi kết quả test

Khi chạy xong, ghi kết quả vào tasks/<module>.md:

```
### Test Results
- [x] consistent-hashing.test.ts — 13 tests passed
- [x] node.test.ts — 17 tests passed
- [x] lru.test.ts — 8 tests passed
- [x] lfu.test.ts — 8 tests passed
- [x] fifo.test.ts — 6 tests passed

**Total: 52 tests passed ✅**
```

---

*Cập nhật file này khi thêm test suites mới.*
