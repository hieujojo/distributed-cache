# TASKS — Chi tiết Tasks & Changes

> File này ghi lại MỌI THỨ đã làm: thêm gì, xóa gì, cài gì, đề xuất gì, chưa làm gì.

---

## Tổng quan

```
Trạng thái: Documentation phase
Bắt đầu: 2026-08-21
Cập nhật: 2026-08-21
Files đã tạo: 16 docs, 4 agent, 2 config
Dependencies đã cài: 7 (devDependencies)
Dependencies cần cài: 4
Code đã viết: 0 dòng
```

---

## Đã làm

### Files đã tạo

```
docs/core/knowledge-base.md       ← Kiến thức cốt lõi (8 phần)
docs/core/consistent-hashing.md   ← Deep dive consistent hashing
docs/core/replication.md          ← Deep dive replication
docs/core/cache-invalidation.md   ← Deep dive cache invalidation
docs/architecture/architecture.md ← Kiến trúc tổng quan
docs/architecture/tech-stack.md   ← Technology choices
docs/architecture/design-system.md ← Design system
docs/architecture/design-patterns.md ← 7 design patterns
docs/guides/setup.md              ← Hướng dẫn cài đặt
docs/guides/contributing.md       ← Quy trình contribution
docs/guides/rules.md              ← 12 quy tắc
docs/reference/diagrams.md        ← Sơ đồ (6 loại)
docs/reference/edge-cases.md      ← Edge cases (20+)
docs/reference/changelog.md       ← Bugs tracking
agent/COMMIT_CONVENTION.md        ← Quy tắc commit
agent/GIT_WORKFLOW.md             ← Git workflow
agent/CODE_STYLE.md               ← Code style
agent/PR_TEMPLATE.md              ← Template PR
agent/MODULES.md                  ← Chi tiết modules
agent/PROGRESS.md                 ← Track progress
AGENTS.md                         ← Hướng dẫn AI
README.md                         ← Tổng quan
CONTRIBUTING.md                   ← Contribution guide
CODE_OF_CONDUCT.md                ← Code of conduct
LICENSE                           ← MIT License
package.json                      ← Dependencies
tsconfig.json                     ← TypeScript config
```

### Dependencies đã cài

```
✅ typescript      ^5.4.0    (devDependency)
✅ tsup            ^8.0.0    (devDependency)
✅ jest            ^29.7.0   (devDependency)
✅ @types/jest     ^29.5.0   (devDependency)
✅ ts-jest         ^29.1.0   (devDependency)
✅ tsx             ^4.0.0    (devDependency)
✅ @types/node     ^20.0.0   (devDependency)
```

### Git commits đã làm

```
1. docs: add initial project documentation and structure
2. docs(tech-stack): remove company name reference
3. docs: add complete documentation and project infrastructure
4. docs: reorganize documentation and add design guides
5. docs: rewrite design system and design patterns with explanations
6. docs: add rules, troubleshooting, knowledge base, and diagrams
7. docs: reorganize folder structure and streamline README
8. docs: add LICENSE and CODE_OF_CONDUCT
9. docs: add CONTRIBUTING.md at root level
10. docs: consolidate and fix documentation issues
11. docs: add progress tracking and module details
12. docs: reorganize progress tracking and module docs
13. refactor: reorganize rules and progress tracking
```

---

## Chưa làm

### Dependencies cần cài

```
⬜ murmurhash3     (Module 1: Consistent Hashing)
⬜ react           (Module 8: Visualization)
⬜ react-dom       (Module 8: Visualization)
⬜ @types/react    (Module 8: Visualization)
```

### Code chưa viết

```
⬜ src/core/types.ts
⬜ src/core/hash-helpers.ts
⬜ src/core/consistent-hashing.ts
⬜ src/core/node.ts
⬜ src/strategies/index.ts
⬜ src/strategies/lru.ts
⬜ src/strategies/lfu.ts
⬜ src/strategies/fifo.ts
⬜ src/server/protocol.ts
⬜ src/server/cache-server.ts
⬜ src/server/client.ts
⬜ src/core/cluster.ts
⬜ src/core/election.ts
⬜ src/core/failover.ts
⬜ src/core/replication.ts
⬜ src/core/invalidation.ts
⬜ src/benchmark/throughput.ts
⬜ src/benchmark/data-movement.ts
⬜ src/benchmark/run.ts
⬜ src/visualization/hash-ring.tsx
⬜ src/visualization/dashboard.tsx
⬜ src/visualization/server.ts
```

### Tests chưa viết

```
⬜ tests/core/consistent-hashing.test.ts
⬜ tests/core/node.test.ts
⬜ tests/strategies/lru.test.ts
⬜ tests/strategies/lfu.test.ts
⬜ tests/strategies/fifo.test.ts
⬜ tests/server/protocol.test.ts
⬜ tests/server/cache-server.test.ts
⬜ tests/server/client.test.ts
⬜ tests/core/cluster.test.ts
⬜ tests/core/election.test.ts
⬜ tests/core/failover.test.ts
⬜ tests/core/replication.test.ts
⬜ tests/core/invalidation.test.ts
```

---

## Đề xuất

### Đề xuất 1: Thêm jest.config.ts

```
Lý do: Jest cần config để work với TypeScript
Cần: Tạo jest.config.ts với ts-jest
Ưu tiên: Cao (cần cho Module 1)
Trạng thái: Chưa làm
```

### Đề xuất 2: Thêm .gitignore

```
Lý do: Loại file không cần commit (node_modules, dist, coverage)
Cần: Tạo .gitignore
Ưu tiên: Cao (cần cho Module 1)
Trạng thái: Chưa làm
```

### Đề xuất 3: Thêm .env.example

```
Lý do: Document environment variables
Cần: Tạo .env.example với default values
Ưu tiên: Thấp (chưa cần cho Module 1)
Trạng thái: Chưa làm
```

### Đề xuất 4: Thêm CI/CD pipeline

```
Lý do: Auto test khi commit
Cần: Tạo .github/workflows/ci.yml
Ưu tiên: Thấp (sau khi có code)
Trạng thái: Chưa làm
```

---

## Files đã sửa

```
docs/tech-stack.md         — Xóa tên company (Gear Games)
docs/core/knowledge-base.md — Sửa "150 virtual nodes" thành conceptual
docs/guides/setup.md       — Xóa Circuit Breaker reference
README.md                  — Cập nhật reading order, cấu trúc
docs/guides/rules.md       — Thêm rules 11, 12
```

---

## Files đã xóa

```
docs/core/concepts.md      — Trùng lặp với knowledge-base.md
docs/modules.md            — Di chuyển sang agent/MODULES.md
PROGRESS.md                — Di chuyển sang agent/PROGRESS.md
```

---

## Conflict History

```
> Chưa có conflict nào
```

---

## Notes

### Tại sao xóa concepts.md?

```
knowledge-base.md và concepts.md có 80% nội dung trùng nhau:
  - Cả 2 giải thích: cache, distributed cache, consistent hashing,
    replication, cache invalidation, eviction policies, CAP theorem

Giải pháp: Giữ knowledge-base.md (tóm tắt), xóa concepts.md
```

### Tại sao xóa Circuit Breaker trong setup.md?

```
setup.md có đoạn:
  import { CircuitBreaker } from 'distributed-cache';

Circuit Breaker KHÔNG phải scope project này
→ Có vẻ copy từ project khác
→ Đã xóa
```

### Tại sao sửa "150 virtual nodes"?

```
knowledge-base.md viết:
  "Default: 150 virtual nodes per physical node"

Đây là implementation detail, không phải kiến thức cơ bản
knowledge-base nên ở mức conceptual
→ Đã sửa thành "Số lượng virtual nodes tùy chỉnh được"
```

---

## Update Policy

```
1. Khi tạo file mới → ghi vào "Đã làm"
2. Khi xóa file → ghi vào "Files đã xóa"
3. Khi cài dependency → ghi vào "Dependencies đã cài"
4. Khi cần dependency mới → ghi vào "Dependencies cần cài"
5. Khi có đề xuất → ghi vào "Đề xuất"
6. Khi fix conflict → ghi vào "Conflict History"
```
