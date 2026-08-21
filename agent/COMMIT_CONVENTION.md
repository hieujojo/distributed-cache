# Commit Convention

## Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

## Examples

```
feat(core): add consistent hashing implementation

- Implement hash ring with virtual nodes
- Add O(log N) lookup using binary search
- Add unit tests for node addition/removal

Benchmark: 80% less data movement vs naive hashing

Closes #12
```

```
fix(replication): handle leader election race condition

- Add mutex lock during election
- Prevent split brain with quorum check
- Add test for concurrent election

Fixes #45
```

```
docs(architecture): add system design documentation

- Add component diagram
- Add data flow diagrams
- Add design decisions section
```

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

## Breaking Changes

```
feat(core): change cache API signature

BREAKING CHANGE: CacheNode.get() now returns Promise<Value | null>
instead of Value | null

Migration:
- Before: const value = node.get('key')
- After: const value = await node.get('key')
```

## Auto-formatting

```bash
# Format code trước khi commit
npm run format

# Lint code
npm run lint
```
