# Tasks 07: Benchmark

> Module 7: Performance testing + comparison

---

## Mục tiêu

Implement benchmark tools để đo performance.

---

## Dependencies

```
Không cần cài thêm
```

---

## Files sẽ tạo

### ⬜ src/benchmark/throughput.ts

```
Mục đích: Đo throughput (operations per second)

Sẽ tạo:
  - import { CacheNode, Value } from '../core/types'

  - Interface BenchmarkResult:
    - name: string
    - opsPerSecond: number
    - avgLatency: number
    - p99Latency: number
    - duration: number

  async function benchmarkThroughput(
    cache: CacheNode,
    operations: number,
    keySpace: number
  ): Promise<BenchmarkResult>:
    - Tạo mảng latencies
    - Bắt đầu timer
    - Với mỗi operation:
      - Random key trong keySpace
      - Random operation (SET hoặc GET)
      - Đo thời gian thực thi
      - Lưu latency
    - Kết thúc timer
    - Tính toán:
      - opsPerSecond = operations / duration
      - avgLatency = average(latencies)
      - p99Latency = percentile(latencies, 99)
    - Return BenchmarkResult

Tham chiếu:
  - CacheNode từ '../core/types'
  - Value từ '../core/types'

Sửa đổi: Không (file mới)
```

### ⬜ src/benchmark/data-movement.ts

```
Mục đích: Đo % keys bị di chuyển khi thêm node

Sẽ tạo:
  - import { ConsistentHash } from '../core/consistent-hashing'
  - import { CacheNode } from '../core/types'

  - Interface MovementResult:
    - keysBefore: number
    - keysAfter: number
    - keysMoved: number
    - percentageMoved: number

  function benchmarkDataMovement(
    ring: ConsistentHash,
    keys: string[],
    newNode: CacheNode
  ): MovementResult:
    - Lưu node cho mỗi key trước khi thêm node mới
      - keysBefore = Map<key, nodeId>
    - Thêm newNode vào ring
    - Lưu node cho mỗi key sau khi thêm
      - keysAfter = Map<key, nodeId>
    - Đếm keys bị di chuyển
      - keysMoved = count where keysBefore.get(key) !== keysAfter.get(key)
    - Tính percentage
      - percentageMoved = (keysMoved / keys.length) * 100
    - Return MovementResult

Tham chiếu:
  - ConsistentHash từ '../core/consistent-hashing'
  - CacheNode từ '../core/types'

Sửa đổi: Không (file mới)
```

### ⬜ src/benchmark/run.ts

```
Mục đích: Runner cho tất cả benchmarks

Sẽ tạo:
  - import { benchmarkThroughput } from './throughput'
  - import { benchmarkDataMovement } from './data-movement'
  - import { ConsistentHash } from '../core/consistent-hashing'
  - import { CacheNode } from '../core/types'

  async function runAllBenchmarks():
    - Console: "Starting benchmarks..."
    - Tạo ConsistentHash với 5 nodes
    - Chạy benchmarkThroughput:
      - 100,000 operations
      - 10,000 key space
    - Chạy benchmarkDataMovement:
      - 100,000 keys
      - Thêm 1 node mới
    - In kết quả ra console (table format)

  // Run nếu execute trực tiếp
  if (require.main === module) {
    runAllBenchmarks()
  }

Tham chiếu:
  - benchmarkThroughput từ './throughput'
  - benchmarkDataMovement từ './data-movement'
  - ConsistentHash từ '../core/consistent-hashing'
  - CacheNode từ '../core/types'

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

```
Benchmark thường không cần unit tests
Nhưng có thể test helper functions
```

---

## Changelog

```
2026-08-21: Tạo file tasks
```

---

## Commit message dự kiến

```
feat(bench): add throughput and data movement benchmarks

- Add src/benchmark/throughput.ts: ops/sec, latency measurement
- Add src/benchmark/data-movement.ts: keys moved comparison
- Add src/benchmark/run.ts: benchmark runner

Benchmarks measure:
  - Throughput: operations per second
  - Latency: avg and p99
  - Data movement: % keys moved when adding node
```
