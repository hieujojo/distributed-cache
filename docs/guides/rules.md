# Rules — Các quy tắc cần tuân thủ

> Các quy tắc BẮT BUỘC khi làm việc với project này. Vi phạm = code review fail.
> Format rules: **Mỗi rule có nguyên nhân + ví dụ sai + cách tránh lặp lại**

---

## 1. Docs phải luôn mới nhất

### Quy tắc

```
Mỗi khi thay đổi code:
1. Kiểm tra docs có cần update không
2. Nếu CÓ → update docs TRƯỚC khi commit
3. Nếu KHÔNG → giải thích tại sao trong commit message
```

### Check procedure

```bash
git diff --name-only | grep -E "\\.(ts|tsx)$"
# Nếu có file code thay đổi → kiểm tra docs
```

---

## 2. Tính nhất quán giữa docs và code

### Quy tắc

```
Nếu docs nói "class ConsistentHash có method getNode()"
→ Code PHẢI có method getNode() trong class ConsistentHash
```

### Khi phát hiện không nhất quán

```
1. GHI LẠI ngay trong docs/reference/changelog.md
2. Sửa code HOẶC sửa docs (tùy cái nào đúng)
3. Commit: "fix: resolve inconsistency between docs and code"
```

---

## 3. Commit phải đúng format

### Quy tắc

```
Mọi commit PHẢI tuân theo agent/COMMIT_CONVENTION.md

Xem chi tiết tại: agent/COMMIT_CONVENTION.md
```

---

## 4. Test phải pass trước khi commit

### Quy tắc

```
Trước khi commit:
1. npm test → TẤT CẢ tests phải pass
2. npm run test:coverage → coverage >= 80%

Xem chi tiết tại: docs/guides/testing.md
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
```

### Ví dụ

```typescript
// PHẢI comment
// Dùng binary search thay vì linear search
// vì hash ring có thể chứa hàng nghìn nodes
private binarySearch(hash: number): number { ... }

// KHÔNG comment
// Set the value
this.cache.set(key, value);  // Redundant
```

---

## 6. Naming phải rõ ràng

### Quy tắc

```
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

---

## 8. Security rules

### Quy tắc

```
- Không hardcode secrets
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
- Không blocking event loop
```

---

## 10. Git rules

### Quy tắc (Solo project)

```
- Commit + push thẳng vào main
- Không cần feature branch hay PR
- Mỗi file 1 commit riêng
- KHÔNG chạy nhiều git commit song song (tránh index.lock)
```

> Chi tiết xem: agent/GIT_WORKFLOW.md

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

✗ Function: processKey() — validate + hash + store
→ PHẢI tách ra 3 functions riêng
```

---

## 12. Conflict Prevention Rules

### Rule 1: Mỗi task chỉ TẠO file mới

```
✅ Module 1: TẠO src/core/node.ts
✅ Module 2: TẠO src/strategies/lru.ts

✗ Module 2: SỬA src/core/node.ts ← KHÔNG ĐƯỢC
```

### Rule 2: Nếu cần sửa file → discuss trước

```
1. Ghi vào agent/PROGRESS.md (mục "Pending Changes")
2. Giải thích tại sao
3. User approve → mới sửa
```

### Rule 3: Injection thay vì Modification

```
CacheNode nhận EvictionStrategy qua constructor
→ Module 1 không cần sửa khi Module 2 thêm strategy mới
```

### Rule 4: Interface-based Design

```
Mọi module giao tiếp qua interfaces trong src/core/types.ts
```

---

## 🐛 Lessons Learned

### L1. Jest config phải dùng .cjs

```
📅 2026-08-22
🐛 jest.config.ts bị lỗi "Cannot use import statement"
✅ Đổi sang jest.config.cjs
📝 Jest dùng CommonJS → config phải là .cjs
```

### L2. Ưu tiên pure JS packages

```
📅 2026-08-22
🐛 murmurhash3 cần Visual Studio để build
✅ Dùng package 'murmurhash' (pure JS)
📝 Windows thường thiếu native build tools
```

### L3. Import KHÔNG dùng .js extension

```
📅 2026-08-22
✅ import { Value } from './types'
✅ import { CacheNode } from '../core/node'
❌ import { Value } from './types.js'
📝 Codebase dùng moduleResolution=node → không cần .js extension
```

### L4. Jest dùng CommonJS exports

```
📅 2026-08-22
🐛 export default bị lỗi khi Jest import
✅ module.exports = {...}
📝 Jest config và test files phải dùng CommonJS
```

### L5. Small commits per scope

```
📅 2026-08-22
🐛 1 commit = 7 files quá khó review
✅ Mỗi file 1 commit riêng
📝 Small commits: easier review, easier revert, better history
```### L6. Solo project: commit trực tiếp vào main

```
📅 2026-08-22
✅ Dự án solo → commit + push thẳng vào main
✅ Không cần feature branch hay PR
📝 Nếu có nhiều người phát triển → mới cần branch + PR
```

### L7. KHÔNG kill processes bằng taskkill

```
📅 2026-08-23
❌ taskkill //F //IM bash.exe  → kill nhầm session tool
❌ taskkill //F //IM node.exe  → kill nhầm IDE/server
✅ taskkill //F //PID 12345    → kill đúng process
📝 Nếu bị kẹt → đóng terminal, mở lại
```

### L8. TCP protocol value không chứa spaces

```
📅 2026-08-25
🐛 SET user:1001 "hello world" → parser lỗi "TTL must be a number"
✅ SET user:1001 hello-world  (thay space bằng dash)
📝 Protocol dùng space-separated format, value chỉ 1 word
📝 Muốn value có spaces → encode hoặc đổi delimiter
```

### L9. Server restart test phải dùng nodes mới

```
📅 2026-08-25
🐛 Test expect data mất sau restart nhưng vẫn còn
✅ Tạo CacheNode MỚI + CacheServer MỚI để test fresh state
📝 CacheNode objects persist trong memory dù server stop/start
📝 Muốn test "data mất" → phải tạo objects mới hoàn toàn
```

---

## Rules từ Changelog (C-rules)

> Derived từ bugs đã fix trong docs/reference/changelog.md

### C1. Setup & Config

```
C1.1: Jest config PHẢI dùng .cjs (không phải .ts)
C1.2: Ưu tiên pure JS packages trên Windows (tránh native addon)
C1.3: Import extension phụ thuộc moduleResolution trong tsconfig
```

### C2. TypeScript

```
C3.1: moduleResolution: "bundler" cần explicit types field
C3.2: Kiểm tra TypeScript release notes khi upgrade
C3.3: Khi thêm types field, PHẢI list ĐỦ tất cả types cần thiết
```

### C3. File & Structure

```
C4.1: Packages dev/test → devDependencies (không phải dependencies)
C4.2: Kiểm tra cấu trúc thư mục TRƯỚC khi tạo file mới
C4.3: Khi di chuyển file → git add -A (staged cả deletion)
C4.4: File mới PHẢI đặt vào đúng folder theo module
```

### C4. Language & Convention

```
C5.1: Không mixed language trong source (quét regex check)
C5.2: Rules phải reflect code thật, update khi code thay đổi
```

### C5. Safety

```
C6.1: KHÔNG kill processes bằng -IM, CHỈ dùng -PID
C8.1: Scripts có server PHẢI có process.exit(0)
C8.2: Dùng port unusual cho demo scripts (5555, 7777)
```

### C6. Build

```
C7.1: Kiểm tra consistency package.json vs source files
C7.2: Build tool PHẢI có config file
```

### C7. Code Quality

```
C9.1: Kiểm tra tên class/exact export TRƯỚC khi import
```

---

## Tóm tắt

| # | Quy tắc | Khi nào |
|---|---|---|
| 1 | Docs mới nhất | Mỗi khi code changed |
| 2 | Nhất quán docs-code | Khi review |
| 3 | Commit đúng format | Xem COMMIT_CONVENTION.md |
| 4 | Test phải pass | Xem testing.md |
| 5 | Comments khi cần | Code phức tạp |
| 6 | Naming rõ ràng | Luôn |
| 7 | Không code chết | Luôn |
| 8 | Security | Luôn |
| 9 | Performance | Khi optimize |
| 10 | Git workflow | Xem GIT_WORKFLOW.md |
| 11 | Code Structure | Khi viết code |
| 12 | Conflict Prevention | Khi làm modules |
| 13 | Không kill processes | Luôn |
| L1-L6 | Lessons Learned | Tham chiếu khi cần |
