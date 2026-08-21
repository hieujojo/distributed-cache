# Commit Convention

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

---

## Quy tắc quan trọng: Small Commits per Scope

```
Mỗi module chia thành nhiều commits nhỏ:

✅ ĐÚNG: 4 commits cho Module 1
  feat(core): add types and interfaces
  feat(core): add hash helpers
  feat(core): add consistent hashing implementation
  feat(core): add cache node implementation

❌ SAI: 1 commit cho cả module
  feat(core): add everything for module 1
```

### Tại sao small commits?

```
1. Dễ review: Mỗi commit chỉ 1-3 files
2. Dễ revert: Nếu bug, revert 1 commit nhỏ
3. Dễ hiểu: Git history rõ ràng
4. Dễ debug: Biết chính xác commit nào gây bug
```

### Rule

```
1 commit = 1 file hoặc 1 nhóm files liên quan trực tiếp
Tối đa: 3 files trong 1 commit
```

---

## Examples

### ✅ Small commits pattern

```
feat(strategy): add eviction strategy interface

- Add EvictionStrategy interface in src/strategies/index.ts
- Define onAccess, onInsert, onEvict, onRemove methods

---

feat(strategy): add LRU eviction strategy

- Add LRUStrategy class in src/strategies/lru.ts
- Track access order with array
- Evict least recently used key

---

feat(strategy): add LRU tests

- Add tests/strategies/lru.test.ts
- Test eviction order, access tracking, edge cases

---

test(strategy): add LFU and FIFO tests

- Add tests/strategies/lfu.test.ts
- Add tests/strategies/fifo.test.ts
```

---

## Types

| Type | Mô tả | Khi nào dùng |
|---|---|---|
| `feat` | Feature mới | Thêm functionality mới |
| `fix` | Fix bug | Sửa bug |
| `docs` | Documentation | Thêm/sửa docs |
| `style` | Code style | Formatting, semicolons (không ảnh hưởng logic) |
| `refactor` | Refactor | Cải thiện code structure |
| `test` | Tests | Thêm/sửa tests |
| `bench` | Benchmark | Thêm/sửa benchmark |
| `chore` | Maintenance | Dependencies, CI, config |
| `perf` | Performance | Cải thiện performance |

## Scopes

| Scope | Mô tả |
|---|---|
| `core` | Core logic (consistent hashing, replication) |
| `server` | Network layer (TCP server, protocol) |
| `strategy` | Cache strategies (LRU, LFU, TTL) |
| `vis` | Visualization (React components) |
| `docs` | Documentation |
| `agent` | Development workflow |
| `ci` | CI/CD pipeline |
| `deps` | Dependencies |

## Rules

### Subject

```
- Viết lowercase
- Không viết hoa chữ cái đầu
- Không kết thúc bằng dấu chấm
- Tối đa 50 ký tự
- Dùng imperative mood: "add" không phải "added"
```

### Body

```
- Viết chi tiết hơn về changes
- Mô tả WHY, không chỉ WHAT
- Tối đa 72 ký tự mỗi dòng
- Sử dụng bullet points
```

### Footer

```
- Reference issues: Closes #12, Fixes #45
- Breaking changes: BREAKING CHANGE: mô tả
```
