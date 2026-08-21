# Rules — Các quy tắc cần tuân thủ

> Các quy tắc BẮT BUỘC khi làm việc với project này. Vi phạm = code review fail.

---

## 1. Docs phải luôn mới nhất

### Quy tắc

```
Mỗi khi thay đổi code:
1. Kiểm tra docs có cần update không
2. Nếu CÓ → update docs TRƯỚC khi commit
3. Nếu KHÔNG → giải thích tại sao trong commit message
```

### Ví dụ

```
Thay đổi API từ getNode(key) sang findNode(key)
  → PHẢI update docs/architecture.md
  → PHẢI update docs/core/consistent-hashing.md
  → PHẢI update JSDoc trong code
```

### Kiểm tra

```bash
# Trước khi commit, kiểm tra docs có outdated không
git diff --name-only | grep -E "\.(ts|tsx)$"
# Nếu có file code thay đổi → kiểm tra docs
```

---

## 2. Tính nhất quán giữa docs và code

### Quy tắc

```
Nếu docs nói "class ConsistentHash có method getNode()"
→ Code PHẢI có method getNode() trong class ConsistentHash

Nếu docs nói "default TTL là 60s"
→ Code PHẢI có default TTL = 60000ms
```

### Khi phát hiện không nhất quán

```
1. GHI LẠI ngay trong CHANGELOG.md (mục "Known Issues")
2. Sửa code HOẶC sửa docs (tùy cái nào đúng)
3. Commit với message: "fix: resolve inconsistency between docs and code"
```

### Check procedure

```bash
# Khi review code, luôn hỏi:
# 1. Docs có nói đúng về code không?
# 2. Code có đúng như docs mô tả không?
# 3. Nếu khác nhau → SỬA NGAY
```

---

## 3. Commit message phải đúng format

### Quy tắc

```
Mọi commit PHẢI tuân theo agent/COMMIT_CONVENTION.md:

<type>(<scope>): <subject>

Types: feat, fix, docs, test, bench, refactor, style, chore
Scopes: core, server, strategy, vis, docs, agent
```

### Ví dụ đúng

```
✅ feat(core): add consistent hashing implementation
✅ fix(replication): handle leader election race condition
✅ docs(architecture): update component diagram
```

### Ví dụ sai

```
❌ "add feature"
❌ "fix bug"
❌ "update code"
❌ "WIP"
```

---

## 4. Test phải pass trước khi commit

### Quy tắc

```
Trước khi commit:
1. npm test → TẤT CẢ tests phải pass
2. npm run test:coverage → coverage >= 80%
3. npm run lint → không có lỗi TypeScript
```

### Nếu test fail

```
1. Sửa test HOẶC sửa code
2. KHÔNG BAO GIỜ commit khi test fail
3. Nếu cần bỏ qua test → giải thích lý do trong commit message
```

---

## 5. Code phải có comments khi cần

### Quy tắc

```
PHẢI comment khi:
- Algorithm phức tạp (consistent hashing, leader election)
- Trade-off decisions
- Edge cases
- "Tại sao" (WHY), không phải "cái gì" (WHAT)

KHÔNG comment khi:
- Code quá rõ ràng
- "set value" → comment "set value" = redundant
```

### Ví dụ

```typescript
// PHẢI comment
// Dùng binary search thay vì linear search
// vì hash ring có thể chứa hàng nghìn nodes
// O(log N) thay vì O(N)
private binarySearch(hash: number): number { ... }

// KHÔNG comment
// Set the value
this.cache.set(key, value);  // Redundant
```

---

## 6. Naming phải rõ ràng

### Quy tắc

```
- Tên biến phải rõ nghĩa
- Không dùng abbreviations trừ khi phổ biến (id, url, api)
- Không dùng single letters trừ khi là loop variable

✅ const maxRetryCount = 3;
✅ const heartbeatInterval = 5000;

❌ const mrc = 3;
❌ const hbi = 5000;
```

---

## 7. Không để code chết

### Quy tắc

```
- Không để commented-out code
- Không để unused imports
- Không để TODO comments mà không tạo issue
- Không để console.log trong production code
```

### Nếu cần giữ code cũ

```
1. Git đã lưu lịch sử → không cần giữ trong code
2. Nếu cần reference → ghi trong CHANGELOG.md
3. Nếu cần恢复 → dùng git checkout
```

---

## 8. Security rules

### Quy tắc

```
- Không hardcode secrets (API keys, passwords)
- Không commit .env files
- Validate tất cả input từ network
- Không tin tưởng data từ client
```

---

## 9. Performance rules

### Quy tắc

```
- Không optimize trước khi có benchmark proof
- Profile trước khi optimize
- Log performance metrics khi cần debug
- Không blocking event loop
```

---

## 10. Git rules

### Quy tắc

```
- Không commit trực tiếp lên main
- Luôn tạo feature branch
- Branch naming: feature/<name>, fix/<name>, docs/<name>
- Squash commits khi merge PR
```

---

## 11. Code Structure Rules

### Size Guidelines

```
Function:  ≤ 100 dòng (nếu làm đúng 1 việc)
Class:     ≤ 1000 dòng (nếu làm đúng 1 việc)
File:      ≤ 2000 dòng (nếu chứa 1 class chính)
```

### Single Responsibility

```
✅ Function: validateKey() — chỉ validate
✅ Function: hashKey() — chỉ hash
✅ Function: storeKey() — chỉ store

✗ Function: processKey() — validate + hash + store
→ PHẢI tách ra 3 functions riêng
```

### Khi cần tách file

```
Khi file > 2000 dòng:
  1. Tách theo responsibility
  2. Tách helper functions ra file riêng
  3. Giữ class chính trong file chính
```

---

## 12. Conflict Prevention Rules

### Rule 1: Mỗi task chỉ TẠO file mới

```
✅ Module 1: TẠO src/core/node.ts
✅ Module 2: TẠO src/strategies/lru.ts

✗ Module 1: TẠO src/core/node.ts
✗ Module 2: SỬA src/core/node.ts  ← KHÔNG ĐƯỢC
```

### Rule 2: Nếu cần sửa file → discuss trước

```
1. Ghi vào agent/PROGRESS.md (mục "Pending Changes")
2. Giải thích tại sao cần sửa
3. User approve → mới sửa
4. Commit: "refactor: update X based on Y"
```

### Rule 3: Injection thay vì Modification

```
Thay vì sửa CacheNode để thêm eviction:
  → CacheNode nhận EvictionStrategy qua constructor

→ Module 1 không cần sửa khi Module 2 thêm strategy mới
```

### Rule 4: Interface-based Design

```
Mọi module giao tiếp qua interfaces:
  - src/core/types.ts chứa tất cả interfaces
  - Module implement interface
  - Module sử dụng interface

→ Modules độc lập, không conflict
```

---

## Tóm tắt

| # | Quy tắc | Khi nào áp dụng |
|---|---|---|
| 1 | Docs phải mới nhất | Mỗi khi thay đổi code |
| 2 | Nhất quán docs-code | Mỗi khi review |
| 3 | Commit message đúng format | Mỗi khi commit |
| 4 | Test phải pass | Mỗi khi commit |
| 5 | Comments khi cần | Khi viết code phức tạp |
| 6 | Naming rõ ràng | Luôn |
| 7 | Không code chết | Luôn |
| 8 | Security | Luôn |
| 9 | Performance | Khi optimize |
| 10 | Git workflow | Luôn |
| 11 | Code Structure | Khi viết code |
| 12 | Conflict Prevention | Khi làm việc với modules |
