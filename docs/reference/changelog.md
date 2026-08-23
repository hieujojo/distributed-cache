# Changelog — Bugs & Lessons Learned

> Ghi nhận các bugs đã gặp, nguyên nhân, và cách xử lý để tránh lặp lại.
> Format lấy cảm hứng từ Void Runner CHANGELOG.md.

---

## Format

```
### [Ngày] — Tên bug

**Mô tả:**
Mô tả ngắn gọn bug

**Nguyên nhân:**
Tại sao bug xảy ra

**Cách xử lý:**
Cách fix bug

**Lessons learned:**
Bài học rút ra để tránh lặp lại

**Severity:** Low | Medium | High | Critical
```

---

## Bugs đã ghi nhận

### [2026-08-22] — Jest config lỗi "Cannot use import statement"

**Mô tả:** `jest.config.ts` bị lỗi khi chạy test

**Nguyên nhân:** Jest chưa support native ESM config. File `.ts` bị parse as ESM → lỗi import syntax.

**Cách xử lý:**
```
1. Đổi jest.config.ts → jest.config.cjs
2. Dùng module.exports thay vì export default
```

**Lessons learned:** Jest dùng CommonJS → config phải là `.cjs` hoặc `.js`

**Severity:** Medium

---

### [2026-08-22] — murmurhash3 cần native build tools

**Mô tả:** `npm install murmurhash3` bị lỗi "node-gyp" trên Windows

**Nguyên nhân:** murmurhash3 cần Visual Studio C++ build tools để compile native addon. Windows thường không có sẵn.

**Cách xử lý:**
```
1. npm uninstall murmurhash3
2. npm install murmurhash (pure JS, không cần native build)
3. Cập nhật import trong code
```

**Lessons learned:** Ưu tiên pure JS packages trên Windows environment

**Severity:** High

---

### [2026-08-22] — Import lỗi "Cannot find module"

**Mô tả:** `import { types } from './types'` bị lỗi

**Nguyên nhân:** TypeScript with `moduleResolution: "node"` yêu cầu `.js` extension trong import, kể cả khi file là `.ts`

**Cách xử lý:**
```
// Trước
import { types } from './types';

// Sau
import { types } from './types.js';
```

**Lessons learned:** Luôn dùng `.js` extension trong imports khi dùng Jest + TypeScript

**Severity:** Medium

---

### [2026-08-22] — Module.exports lỗi với TypeScript

**Mô tả:** `export default` bị lỗi khi Jest import

**Nguyên nhân:** Jest dùng CommonJS, không support ES module exports

**Cách xử lý:**
```
// Trước
export default { testMatch: [...] };

// Sau
module.exports = { testMatch: [...] };
```

**Lessons learned:** Jest config và test files phải dùng CommonJS exports

**Severity:** Medium

---

### [2026-08-22] — LRU test logic sai

**Mô tả:** Test expect LRU xóa key "a" khi capacity = 2, nhưng thực tế xóa key "b"

**Nguyên nhân:** Test case sai logic — LRU xóa least recently used, không phải first inserted

**Cách xử lý:**
```
1. Sửa test case để match đúng LRU behavior
2. Hoặc sửa implementation (nếu logic sai)
```

**Lessons learned:** Kiểm tra test logic trước khi viết assertion

**Severity:** Low

---

### [2026-08-23] — tsconfig.json thiếu types field

**Mô tả:** IDE báo lỗi `Cannot find name 'Buffer'` trong protocol.ts

**Nguyên nhân:** `moduleResolution: "bundler"` không tự load `@types/node`. IDE không tìm được type definitions.

**Cách xử lý:**
```
thêm "types": ["node", "jest"] vào compilerOptions
```

**Lessons learned:** Khi dùng `moduleResolution: "bundler"`, cần explicit `types` field

**Severity:** Medium

---

### [2026-08-23] — tsconfig.json dùng baseUrl deprecated

**Mô tả:** Lỗi `Option 'baseUrl' has been removed (ts5102)`

**Nguyên nhân:** TypeScript 5.5+ đã remove `baseUrl` option. Dùng `paths` thay thế.

**Cách xử lý:**
```
Xóa "baseUrl": "." khỏi tsconfig.json
```

**Lessons learned:** Kiểm tra TypeScript release notes khi upgrade

**Severity:** Low

---

### [2026-08-23] — react nằm trong dependencies thay vì devDependencies

**Mô tả:** `npm install` sẽ cài react cho tất cả users, dù chỉ dùng cho visualization

**Nguyên nhân:** Khi cài react, npm mặc định bỏ vào dependencies

**Cách xử lý:**
```
npm install --save-dev react react-dom
npm uninstall react react-dom
```

**Lessons learned:** Packages chỉ dùng cho dev/test → đặt vào devDependencies

**Severity:** Low

---

### [2026-08-23] — HANDOVER.md không nằm trong agent/

**Mô tả:** File HANDOVER.md để ở root, lộn xộn

**Nguyên nhân:** Khi tạo file, không để ý cấu trúc thư mục

**Cách xử lý:**
```
mv HANDOVER.md agent/HANDOVER.md
Cập nhật references trong WORKFLOW.md, README.md
```

**Lessons learned:** Kiểm tra cấu trúc thư mục trước khi tạo file mới

**Severity:** Low

---

### [2026-08-23] — Chữ Trung Quốc trong source code và docs

**Mô tả:** Nhiều file có chữ Trung Quốc (我们, 功, 知道, 扔, 少, 短暂, 非, 高频操作, 继承, 旧)

**Nguyên nhân:** Có thể copy từ tài liệu tiếng Trung hoặc AI generating mixed language

**Cách xử lý:**
```
1. Dùng node script quét toàn bộ source
2. Thay thế từng file
3. Verify không còn chữ Trung Quốc
```

**Lessons learned:** Luôn kiểm tra language consistency trong source, dùng linter cho i18n

**Severity:** Medium

---

### [2026-08-23] — Import rules.md ghi sai convention

**Mô tả:** Rule L3 ghi "phải dùng .js extension" nhưng code thật KHÔNG dùng

**Nguyên nhân:** Rules được viết trước khi code, không match với implementation thật

**Cách xử lý:**
```
Sửa rule L3: import KHÔNG dùng .js extension
```

**Lessons learned:** Rules phải update khi code thay đổi, không để rules "mơ hồ"

**Severity:** Low

---

### [2026-08-23] — taskkill //F //IM bash.exe gây crash tool

**Mô tả:** Kill tất cả bash processes khiến tool crash, hiện ký tự lạ

**Nguyên nhân:** `taskkill //F //IM bash.exe` kill cả bash đang chạy tool

**Cách xử lý:**
```
❌ taskkill //F //IM bash.exe
✅ taskkill //F //PID 12345

Nếu bị kẹt → đóng terminal, mở lại
```

**Lessons learned:** KHÔNG bao giờ kill processes bằng IM (image name), chỉ dùng PID

**Severity:** Critical

---

## Template khi gặp bug

```markdown
### [YYYY-MM-DD] — [Tên bug]

**Mô tả:**
[Mô tả ngắn gọn bug là gì]

**Nguyên nhân:**
[Giải thích tại sao bug xảy ra]

**Cách xử lý:**
[Các bước đã làm để fix]

**Lessons learned:**
[Bài học rút ra]

**Severity:** [Low/Medium/High/Critical]
```

---

## Prevention Checklist

> Checklist để tránh bug thường gặp

### TypeScript + Jest

```
□ Jest config dùng .cjs (không phải .ts)
□ Imports dùng .js extension
□ module.exports thay vì export default
□ Đã chạy npx tsc --noEmit trước khi test
```

### Consistent Hashing

```
□ Test case: Thêm node → kiểm tra data redistribution
□ Test case: Xóa node → kiểm tra data không mất
□ Test case: Hash collision → xử lý đúng
□ Edge case: Chỉ có 1 node
□ Edge case: Tất cả nodes đều down
```

### Replication

```
□ Test case: Primary dies → leader election hoạt động
□ Test case: Network partition → split brain prevention
□ Test case: Replica sync sau khi recover
□ Edge case: Tất cả replicas die cùng lúc
□ Edge case: Primary recover sau khi elected mới
```

### Cache Invalidation

```
□ Test case: TTL expired → key bị xóa
□ Test case: Cache full → eviction hoạt động
□ Test case: Concurrent writes → race condition
□ Edge case: TTL = 0
□ Edge case: Cache size = 0
```

### Network

```
□ Test case: Connection timeout → retry logic
□ Test case: Connection refused → graceful degradation
□ Test case: Partial data received → buffer handling
□ Edge case: Network partition
□ Edge case: All connections drop simultaneously
```

### Language & Encoding

```
□ Kiểm tra chữ Trung Quốc trong source (node script quét)
□ Labels, comments phải tiếng Việt hoặc tiếng Anh
□ Không mixed language trong1 file
```

### Safety Rules

```
❌ KHÔNG: taskkill //F //IM bash.exe
❌ KHÔNG: taskkill //F //IM node.exe
✅ CHỈ: taskkill //F //PID <specific-pid>
□ Nếu bị kẹt → đóng terminal, mở lại
```

---

## Common Pitfalls

> Các lỗi thường gặp khi phát triển distributed systems

### 1. Race Conditions

```
Vấn đề: 2 processes cùng sửa 1 data cùng lúc

Ví dụ:
  Process A: reads count = 5
  Process B: reads count = 5
  Process A: writes count = 6
  Process B: writes count = 6  → Sai! Phải là 7

Giải pháp:
  - Dùng locks (mutex, semaphore)
  - Dùng atomic operations
  - Dùng optimistic locking (version numbers)
```

### 2. Split Brain

```
Vấn đề: Network partition → 2 nodes đều nghĩ mình là leader

Ví dụ:
  Node A: "Mất connection với B, tôi là leader"
  Node B: "Mất connection với A, tôi là leader"
  → Cả 2 ghi data → DATA INCONSISTENCY

Giải pháp:
  - Majority quorum (cần N/2 + 1 nodes đồng ý)
  - Fencing tokens
  - Lease-based leadership
```

### 3. Thundering Herd

```
Vấn đề: Khi cache expires, tất cả requests cùng query database

Ví dụ:
  Cache key "user:123" expires
  100 requests cùng đến cùng lúc
  → Tất cả query database → database overload

Giải pháp:
  - Lock khi cache miss, chỉ 1 request query DB
  - Stale-while-revalidate
  - Request coalescing
```

### 4. Cache Stampede

```
Vấn đề: Khi 1 hot key expire, tất cả requests fail

Ví dụ:
  Hot key "product:featured" expire
  1000 requests cùng lúc → cache miss → DB query
  → DB overload → timeout → cascade failure

Giải pháp:
  - Background refresh trước khi expire
  - Probabilistic early expiration
  - Circuit breaker
```

### 5. Memory Leak

```
Vấn đề: Memory không được release, gradually tăng

Ví dụ:
  - Timer không được clear
  - Event listeners không unsubscribed
  - Cache không evict data cũ

Giải pháp:
  - Monitor memory usage
  - Set memory limits
  - Regular cleanup intervals
```

---

## Debugging Tips

### Khi debug distributed systems

```
1. Log EVERYTHING (trong development)
   → Thêm logs ở mọi step
   → Sau khi fix, xóa logs thừa

2. Reproduce trong controlled environment
   → Đừng debug production trực tiếp
   → Tạo test case reproduce bug

3. Think about timing
   → Distributed bugs thường liên quan timing
   → Thử với delays, retries, concurrent operations

4. Check edge cases
   → 0 nodes, 1 node, N nodes
   → All down, partial down
   → Network partition, slow network
```

### Tools để debug

```
- Node.js debugger: node --inspect-brk
- Chrome DevTools: connect to Node.js process
- Logging: structured logging với timestamps
- Metrics: throughput, latency, error rates
- Network: Wireshark, tcpdump
```

---

## Update Policy

```
1. Khi gặp bug → ghi vào đây NGAY
2. Khi fix bug → cập nhật "Cách xử lý" và "Lessons learned"
3. Khi review code → check "Prevention Checklist"
4. Hàng tháng → review bugs, update "Common Pitfalls"
```
