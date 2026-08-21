# Commit Convention

## Format

```
<type>(<scope>): <subject>

<body>
```

**KHÔNG có footer** — không thêm 🤖 hay Co-Authored-By.

---

## Quy tắc quan trọng

### 1. Tiếng Việt có dấu

```
✅ feat(strategy): thêm LRU eviction strategy
✅ fix(core): sửa lỗi binary search wrap-around
✅ test(node): thêm test case cho TTL expiration

❌ feat(strategy): add LRU eviction strategy
❌ feat(strategy): add LRU eviction strategy
```

### 2. Không AI footer

```
✅ feat(strategy): thêm LRU eviction strategy

- Implement access order tracking
- Evict least recently used key

❌ feat(strategy): add LRU eviction strategy

- Implement access order tracking

🤖 Generated with Codebuff
Co-Authored-By: Codebuff <noreply@codebuff.com>
```

### 3. Small commits per scope

```
1 commit = 1-3 files liên quan trực tiếp
Tối đa 3 files trong 1 commit
```

### 4. Validation trước khi commit

```
□ npm test — pass
□ git diff —check — không có trailing whitespace
□ Code compile không lỗi
```

---

## Types

| Type | Khi nào dùng |
|---|---|
| `feat` | Thêm tính năng mới |
| `fix` | Sửa bug |
| `refactor` | Refactor code, không thay đổi logic |
| `chore` | Cập nhật package, cấu hình, build settings |
| `opt` | Tối ưu hiệu năng |
| `test` | Thêm/sửa test |
| `docs` | README, tài liệu |

## Scopes

| Scope | Mô tả |
|---|---|
| `core` | Core logic (consistent hashing, node, cluster) |
| `strategy` | Cache strategies (LRU, LFU, FIFO) |
| `server` | Network layer (TCP server, protocol) |
| `replication` | Data replication |
| `invalidation` | Cache invalidation |
| `bench` | Benchmark |
| `vis` | Visualization |
| `docs` | Documentation |
| `agent` | Development workflow |

---

## Rules

### Subject

```
- Tiếng Việt có dấu
- Không viết hoa chữ đầu
- Không kết thúc bằng dấu chấm
- Tối đa 50 ký tự
- Dùng imperative mood: "thêm" không phải "đã thêm"
```

### Body

```
- Viết chi tiết hơn về changes
- Mô tả WHY, không chỉ WHAT
- Tối đa 72 ký tự mỗi dòng
- Sử dụng bullet points
```

---

## Ví dụ

```
feat(strategy): thêm LRU eviction strategy

- Implement access order tracking với array
- onAccess: move to front (most recent)
- onEvict: remove from back (least recent)
- Add unit tests cho eviction order

---

feat(strategy): thêm LFU eviction strategy

- Track frequency với Map
- onAccess: increment frequency counter
- onEvict: remove key có frequency thấp nhất

---

test(strategy): thêm tests cho LRU, LFU, FIFO

- 19 tests cho 3 eviction strategies
- Test edge cases: empty, single key, multiple accesses
```

---

## Validation checklist

```
□ npm test — pass
□ git diff --check — không có lỗi
□ Code compile không lỗi
□ Không có console.log trong production code
□ JSDoc cho mọi public API
```
