# CHANGELOG — Nhật ký lỗi đã sửa (Lessons Learned)

> **Mục đích:** ghi lại mọi lỗi/warning đã gặp trong quá trình phát triển, cách fix và cách tránh lặp lại.
> Format lấy cảm hứng từ Void Runner CHANGELOG.md.
> Cập nhật mỗi lần fix lỗi, trước khi commit.

---

## 2026-08-22 — Jest config lỗi "Cannot use import statement"

> User: setup project, chạy `npm test` bị lỗi.

- **Triệu chứng:** `jest.config.ts` bị lỗi `Cannot use import statement` khi chạy test.
- **Root cause:** Jest chưa support native ESM config. File `.ts` bị parse as ESM → lỗi import syntax. Jest dùng CommonJS internally.
- **Fix:** Đổi `jest.config.ts` → `jest.config.cjs`. Dùng `module.exports` thay vì `export default`.
- **Bài học (C1.1):** Jest config PHẢI dùng `.cjs` hoặc `.js` (không phải `.ts`) vì Jest internally dùng CommonJS. Trước khi tạo config file, kiểm tra Jest docs xem format nào được hỗ trợ.

---

## 2026-08-22 — murmurhash3 cần native build tools

> User: `npm install murmurhash3` bị lỗi "node-gyp" trên Windows.

- **Triệu chứng:** `npm install murmurhash3` fail với lỗi `node-gyp` — yêu cầu Visual Studio C++ build tools.
- **Root cause:** murmurhash3 cần Visual Studio C++ build tools để compile native addon. Windows thường không có sẵn.
- **Fix:** `npm uninstall murmurhash3` → `npm install murmurhash` (pure JS, không cần native build). Cập nhật import trong code.
- **Bài học (C1.2):** Ưu tiên pure JS packages trên Windows environment. Trước khi install package, kiểm tra xem có native addon không (`node-gyp`, `.node` files). Nếu có → tìm alternative pure JS.

---

## 2026-08-22 — Import lỗi "Cannot find module"

> User: chạy test bị lỗi import.

- **Triệu chứng:** `import { types } from './types'` bị lỗi `Cannot find module`.
- **Root cause:** TypeScript with `moduleResolution: "node"` yêu cầu `.js` extension trong import, kể cả khi file là `.ts`. Tuy nhiên, sau đó đã đổi sang `moduleResolution: "bundler"` → bỏ `.js` extension.
- **Fix:** Ban đầu thêm `.js` extension. Sau đó đổi moduleResolution → bỏ `.js`.
- **Bài học (C1.3):** Import extension phụ thuộc vào `moduleResolution` trong tsconfig. Kiểm tra config trước khi quyết định dùng `.js` hay không.

---

## 2026-08-22 — module.exports lỗi với TypeScript

> User: Jest import bị lỗi.

- **Triệu chứng:** `export default` bị lỗi khi Jest import.
- **Root cause:** Jest dùng CommonJS, không support ES module exports.
- **Fix:** Dùng `module.exports` thay vì `export default` trong Jest config.
- **Bài học (C1.4):** Jest config và test files phải dùng CommonJS exports (`module.exports`), không dùng ES module (`export default`).

---

## 2026-08-22 — LRU test logic sai

> User: test expect LRU xóa key "a" nhưng thực tế xóa key "b".

- **Triệu chứng:** Test expect LRU xóa key "a" khi capacity = 2, nhưng thực tế xóa key "b".
- **Root cause:** Test case sai logic — LRU xóa least recently used (key "b"), không phải first inserted (key "a"). Test đã viết sai từ đầu.
- **Fix:** Sửa test case để match đúng LRU behavior.
- **Bài học (C2.1):** Kiểm tra test logic trước khi viết assertion. Đọc kỹ spec của algorithm trước khi test.

---

## 2026-08-23 — tsconfig.json thiếu types field

> User: IDE báo lỗi `Cannot find name 'Buffer'` trong protocol.ts.

- **Triệu chứng:** IDE (VS Code) hiện 6 lỗi `Cannot find name 'Buffer' (ts2591)` trong `src/server/protocol.ts`.
- **Root cause:** `moduleResolution: "bundler"` không tự load `@types/node`. IDE không tìm được type definitions cho Buffer. Tuy nhiên `tsc --noEmit` vẫn pass (compiler tự resolve).
- **Fix:** Thêm `"types": ["node", "jest"]` vào compilerOptions trong tsconfig.json.
- **Bài học (C3.1):** Khi dùng `moduleResolution: "bundler"`, cần explicit `types` field để IDE tìm được type definitions. Nếu IDE báo lỗi nhưng `tsc` pass → thường là thiếu `types` field.

---

## 2026-08-23 — tsconfig.json dùng baseUrl deprecated

> User: IDE báo lỗi `Option 'baseUrl' has been removed (ts5102)`.

- **Triệu chứng:** Lỗi `Option 'baseUrl' has been removed. Please remove it from your configuration. (ts5102)` trong tsconfig.json.
- **Root cause:** TypeScript 5.5+ đã remove `baseUrl` option. Dùng `paths` thay thế.
- **Fix:** Xóa `"baseUrl": "."` khỏi tsconfig.json.
- **Bài học (C3.2):** Kiểm tra TypeScript release notes khi upgrade. Deprecated options sẽ bị remove trong versions tiếp theo.

---

## 2026-08-23 — react nằm trong dependencies thay vì devDependencies

> User: kiểm tra package.json thấy react trong dependencies.

- **Triệu chứng:** `react` và `react-dom` nằm trong `dependencies` thay vì `devDependencies`.
- **Root cause:** Khi cài react, npm mặc định bỏ vào dependencies. React chỉ dùng cho visualization module (dev time), không phải runtime dependency.
- **Fix:** `npm install --save-dev react react-dom` → `npm uninstall react react-dom`.
- **Bài học (C4.1):** Packages chỉ dùng cho dev/test/build → đặt vào `devDependencies`. Kiểm tra sau khi cài package: `dependencies` vs `devDependencies` đã đúng chưa.

---

## 2026-08-23 — HANDOVER.md không nằm trong agent/

> User: thấy HANDOVER.md ở root folder.

- **Triệu chứng:** File `HANDOVER.md` nằm ở root thay vì trong `agent/`.
- **Root cause:** Khi tạo file, không để ý cấu trúc thư mục đã định nghĩa.
- **Fix:** `mv HANDOVER.md agent/HANDOVER.md`. Cập nhật references trong WORKFLOW.md và README.md.
- **Bài học (C4.2):** Kiểm tra cấu trúc thư mục đã định nghĩa TRƯỚC khi tạo file mới. Đọc `tasks/00-overview.md` hoặc `README.md` để biết file nào nằm ở đâu.

---

## 2026-08-23 — Chữ Trung Quốc trong source code và docs

> User: thấy nhiều chữ Trung Quốc xuất hiện trong code.

- **Triệu chứng:** Nhiều file có chữ Trung Quốc: 我们 (election.ts), 功 (replication.ts), 知道 (design-patterns.md), 扔 (design-system.md), 少 (tech-stack.md), 短暂 (cache-invalidation.md, edge-cases.md), 非/高频操作/继承 (decisions.md), 旧 (changelog.md), 牺牲 (knowledge-base.md).
- **Root cause:** Có thể copy từ tài liệu tiếng Trung hoặc AI generating mixed language.
- **Fix:** Dùng node script quét toàn bộ source (`node -e "..."` với regex `[\u4e00-\u9fff]`), thay thế từng file, verify không còn chữ Trung Quốc.
- **Bài học (C5.1):** Luôn kiểm tra language consistency trong source. Sau khi tạo file mới, chạy regex check cho mixed language. Labels, comments phải tiếng Việt hoặc tiếng Anh, KHÔNG được mixed.

---

## 2026-08-23 — rules.md ghi sai convention

> User: rules L3 ghi "phải dùng .js extension" nhưng code thật KHÔNG dùng.

- **Triệu chứng:** Rule L3 trong `docs/guides/rules.md` ghi "Import phải dùng .js extension" nhưng toàn bộ codebase KHÔNG dùng `.js` extension.
- **Root cause:** Rules được viết trước khi code, không match với implementation thật. Rules dựa trên5`moduleResolution: "node"` nhưng code đã đổi sang `moduleResolution: "bundler"`.
- **Fix:** Sửa rule L3: import KHÔNG dùng `.js` extension.
- **Bài học (C5.2):** Rules phải update khi code thay đổi. Không để rules "mơ hồ" — rules phải reflect code thật, không phải lý thuyết. Sau khi đổi config (moduleResolution, tsconfig), kiểm tra lại rules.

---

## 2026-08-23 — taskkill //F //IM bash.exe gây crash tool

> User: tool crash, hiện ký tự lạ khi chạy taskkill.

- **Triệu chứng:** `taskkill //F //IM bash.exe` kill tất cả bash processes → tool crash → hiện ký tự lạ trong terminal → user phải tắt terminal bật lại.
- **Root cause:** `taskkill //F //IM bash.exe` kill TẤT CẢ bash processes, kể cả bash đang chạy tool. Tool mất process parent → crash.
- **Fix:** ❌ `taskkill //F //IM bash.exe` → ✅ `taskkill //F //PID <specific-pid>`. Nếu bị kẹt → đóng terminal, mở lại.
- **Bài học (C6.1 — CRITICAL):** KHÔNG bao giờ kill processes bằng `-IM` (image name) vì sẽ kill nhầm processes liên quan. CHỈ dùng `-PID` (process ID cụ thể). Nếu bị kẹt → đóng terminal, mở lại, KHÔNG tự ý kill.

---

## 2026-08-23 — HANDOVER.md chưa xóa khỏi git tree

> User: vẫn thấy HANDOVER.md ở root trên GitHub.

- **Triệu chứng:** Sau khi `mv HANDOVER.md agent/HANDOVER.md`, git status hiện `deleted: HANDOVER.md` nhưng commit trước đó chỉ thêm `agent/HANDOVER.md` mà KHÔNG xóa root `HANDOVER.md`.
- **Root cause:** `git add agent/HANDOVER.md` chỉ staged file mới, không staged deletion của file cũ. Commit thiếu bước `git rm HANDOVER.md`.
- **Fix:** `git rm HANDOVER.md` → commit → push.
- **Bài học (C4.3):** Khi di chuyển file (`mv`), PHẢI chạy `git add -A` hoặc `git add <old> <new>` để staged CẢ deletion lẫn addition. Kiểm tra `git status` trước khi commit.

---

## 2026-08-23 — Tests fail sau khi thêm types field

> User: chạy test bị lỗi `Cannot find name 'describe'`.

- **Triệu chứng:** Sau khi thêm `"types": ["node"]` vào tsconfig, tests fail với lỗi `Cannot find name 'describe'` — Jest types không được load.
- **Root cause:** Khi dùng `types` field, TypeScript CHỈ load các types được listing. Thêm `"types": ["node"]` → chỉ load `@types/node`, bỏ qua `@types/jest`.
- **Fix:** Đổi `"types": ["node"]` → `"types": ["node", "jest"]`.
- **Bài học (C3.3):** Khi thêm `types` field vào tsconfig, PHẢI list ĐỦ tất cả types cần thiết. Nếu thiếu 1 type → IDE/compiler không tìm được. Kiểm tra: sau khi đổi `types`, chạy `tsc --noEmit` VÀ `npm test`.

---

## 2026-08-23 — src/index.ts thiếu nhưng package.json trỏ đến

> User: kiểm tra project thấy package.json trỏ `dist/index.js` nhưng không có `src/index.ts`.

- **Triệu chứng:** `package.json` có `"main": "dist/index.js"` nhưng `src/index.ts` không tồn tại → `npm run build` sẽ fail.
- **Root cause:** Khi tạo project, định nghĩa entry point trong package.json nhưng quên tạo file source.
- **Fix:** Tạo `src/index.ts` export tất cả modules.
- **Bài học (C7.1):** Kiểm tra consistency giữa `package.json` (`main`, `types`) và source files. Nếu `main` trỏ đến `dist/X.js` thì PHẢI có `src/X.ts`.

---

## 2026-08-23 — tsup.config.ts thiếu nhưng build dùng

> User: `npm run build` dùng tsup nhưng không có config.

- **Triệu chứng:** `npm run build` chạy `tsup` nhưng không có `tsup.config.ts` → tsup dùng defaults, không biết entry point nào.
- **Root cause:** Quên tạo config file khi setup build tool.
- **Fix:** Tạo `tsup.config.ts` với entry point, format (CJS + ESM + DTS).
- **Bài học (C7.2):** Khi thêm build tool, PHẢI tạo config file. Kiểm tra: `npm run build` chạy thành công + output có đủ files.

---

## 2026-08-23 — demo.ts timeout vì TCP server giữ process

> User: chạy demo bị timeout.

- **Triệu chứng:** `npx tsx src/demo.ts` timeout sau 30s.
- **Root cause:** TCP server giữ Node.js event loop alive. `server.stop()` có thể bị block nếu connection chưa đóng hết. `process.exit(0)` cần thiết để force exit.
- **Fix:** Thêm `process.exit(0)` sau cleanup. Thêm `Promise.race` với timeout 3s cho cleanup.
- **Bài học (C8.1):** Scripts có TCP server/HTTP server PHẢI có `process.exit(0)` ở cuối. Nếu không → process treo. Cleanup cần timeout để tránh block.

---

## 2026-08-23 — Port conflict khi chạy demo

> User: chạy demo bị lỗi `EADDRINUSE`.

- **Triệu chứng:** `Error: listen EADDRINUSE: address already in use 127.0.0.1:3000`
- **Root cause:** Port 3000 (và 4000) đang bị dùng bởi processes khác.
- **Fix:** Đổi sang port 5555 (unusual port, ít conflict).
- **Bài học (C8.2):** Khi tạo demo script, dùng port unusual (5555, 7777, 9999) thay vì port mặc định (3000, 4000, 8080) để tránh conflict.

---

## 2026-08-23 — demo-quick.ts import sai tên class

> User: chạy demo bị lỗi `LruStrategy is not a constructor`.

- **Triệu chứng:** `TypeError: LruStrategy is not a constructor` khi chạy demo.
- **Root cause:** Class trong `src/strategies/lru.ts` tên là `LRUStrategy` (viết hoa), không phải `LruStrategy`.
- **Fix:** Đổi import `LruStrategy` → `LRUStrategy`.
- **Bài học (C9.1):** Kiểm tra tên class/exact export TRƯỚC khi import. Dùng IDE auto-import hoặc `grep export class` để tìm tên đúng.

---

## 2026-08-23 — Demo không sắp xếp file vào đúng folder

> User: các file demo, benchmark để ở root src/.

- **Triệu chứng:** `src/check-memory.ts`, `src/demo.ts`, `src/demo-quick.ts` nằm ở root `src/` thay vì trong folder riêng.
- **Root cause:** Khi tạo file, không để ý cấu trúc thư mục.
- **Fix:** Di chuyển: `demo.ts → src/demo/index.ts`, `demo-quick.ts → src/demo/quick.ts`, `check-memory.ts → src/benchmark/memory.ts`. Cập nhật scripts trong package.json.
- **Bài học (C4.4):** Khi tạo file mới, PHẢI đặt vào đúng folder theo module. Kiểm tra `tasks/00-overview.md` hoặc `README.md` để biết cấu trúc thư mục.

---

## Rules rút ra từ Changelog

### Nhóm C1: Setup & Config

| Rule | Mô tả |
|------|-------|
| **C1.1** | Jest config PHẢI dùng `.cjs` hoặc `.js` (không phải `.ts`) |
| **C1.2** | Ưu tiên pure JS packages trên Windows (tránh native addon) |
| **C1.3** | Import extension phụ thuộc `moduleResolution` trong tsconfig |

### Nhóm C2: Testing

| Rule | Mô tả |
|------|-------|
| **C2.1** | Kiểm tra test logic trước khi viết assertion |

### Nhóm C3: TypeScript

| Rule | Mô tả |
|------|-------|
| **C3.1** | `moduleResolution: "bundler"` cần explicit `types` field |
| **C3.2** | Kiểm tra TypeScript release notes khi upgrade |
| **C3.3** | Khi thêm `types` field, PHẢI list ĐỦ tất cả types cần thiết |

### Nhóm C4: File & Structure

| Rule | Mô tả |
|------|-------|
| **C4.1** | Packages dev/test → `devDependencies` |
| **C4.2** | Kiểm tra cấu trúc thư mục TRƯỚC khi tạo file mới |
| **C4.3** | Khi di chuyển file, `git add -A` để staged cả deletion |
| **C4.4** | File mới PHẢI đặt vào đúng folder theo module |

### Nhóm C5: Language & Convention

| Rule | Mô tả |
|------|-------|
| **C5.1** | Kiểm tra language consistency, KHÔNG mixed language |
| **C5.2** | Rules phải reflect code thật, update khi code thay đổi |

### Nhóm C6: Safety

| Rule | Mô tả |
|------|-------|
| **C6.1** | KHÔNG kill processes bằng `-IM`, CHỈ dùng `-PID` |

### Nhóm C7: Build & Package

| Rule | Mô tả |
|------|-------|
| **C7.1** | Kiểm tra consistency `package.json` vs source files |
| **C7.2** | Build tool PHẢI có config file |

### Nhóm C8: Scripts & Runtime

| Rule | Mô tả |
|------|-------|
| **C8.1** | Scripts có server PHẢI có `process.exit(0)` |
| **C8.2** | Dùng port unusual cho demo scripts |

### Nhóm C9: Code Quality

| Rule | Mô tả |
|------|-------|
| **C9.1** | Kiểm tra tên class/exact export TRƯỚC khi import |

---

## Prevention Checklist

### TypeScript + Jest

```
□ Jest config dùng .cjs (không phải .ts)
□ module.exports thay vì export default
□ Đã chạy npx tsc --noEmit trước khi test
□ types field list đủ node + jest
□ Import name đúng exact export
```

### File & Structure

```
□ File mới đặt đúng folder theo module
□ package.json main/types trỏ đúng source files
□ tsup/webpack config có entry point đúng
□ Sau khi di chuyển file: git add -A (không thiếu deletion)
```

### Language

```
□ Không mixed language trong source (quét regex)
□ Rules reflect code thật (không lý thuyết suông)
□ Comments tiếng Việt hoặc tiếng Anh
```

### Safety

```
❌ KHÔNG: taskkill //F //IM bash.exe
❌ KHÔNG: taskkill //F //IM node.exe
✅ CHỈ: taskkill //F //PID <specific-pid>
□ Scripts có server → có process.exit(0)
□ Port unusual cho demo (5555, 7777)
```

### Build

```
□ npm run build chạy thành công
□ Output có đủ files (CJS + ESM + DTS)
□ npm test vẫn pass sau khi đổi tsconfig
```

---

## Update Policy

```
1. Khi gặp bug → ghi vào đây NGAY (format Void Runner)
2. Root cause PHẢI chính xác (không guess)
3. Rules phải cụ thể, có thể action được
4. Sau khi fix → chạy test → verify → commit
```
