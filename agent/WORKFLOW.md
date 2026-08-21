# WORKFLOW — Quy trình làm việc

> File này tổng hợp toàn bộ quy trình. Đọc file này trước khi bắt đầu.

---

## Khi bắt đầu làm việc

```
1. Đọc file này (WORKFLOW.md)
2. Đọc HANDOVER.md → xem session trước làm gì
3. Đọc agent/PROGRESS.md → xem module nào cần làm tiếp
4. Đọc tasks/<module>.md → xem chi tiết cần làm gì
5. Đọc docs/guides/rules.md → nhớ quy tắc
6. Đọc docs/guides/decisions.md → hiểu tại sao chọn tech X
```

---

## Quy trình code 1 module

```
BƯỚC 1: Chuẩn bị
  □ Đọc tasks/<module>.md
  □ Kiểm tra dependencies cần cài
  □ Tạo feature branch: git checkout -b feature/<module-name>

BƯỚC 2: Setup (nếu cần)
  □ Cài dependencies: npm install <package>
  □ Tạo cấu trúc thư mục: mkdir -p src/<module>

BƯỚC 3: Code
  □ Tạo files theo thứ tự trong tasks file
  □ Mỗi file: viết code → viết test → chạy test
  □ Đảm bảo: function ≤ 100 dòng, class ≤ 1000 dòng
  □ SAU KHI XONG 1 FILE: tick ✅ trong tasks/<module>.md

BƯỚC 4: Test
  □ Chạy tests: npm test
  □ Chạy coverage: npm run test:coverage
  □ Đảm bảo coverage ≥ 80%
  □ Tham khảo docs/guides/testing.md khi cần debug

BƯỚC 5: Update docs
  □ Kiểm tra docs có cần update không
  □ Nếu có → update trước khi commit

BƯỚC 6: Commit
  □ Git add các files (mỗi file 1 commit riêng)
  □ Git commit với convention: feat(<scope>): <description>
  □ Push: git push origin feature/<module-name>

BƯỚC 7: Merge
  □ Tạo Pull Request trên GitHub
  □ Sau khi approve → merge vào main
  □ Xóa feature branch

BƯỚC 8: Update progress
  □ Tick ✅ trong tasks/<module>.md (mỗi file đã xong)
  □ Tick ✅ trong agent/PROGRESS.md (module đã hoàn thành)
  □ Ghi changelog trong tasks/<module>.md

BƯỚC 9: Kết thúc session
  □ Ghi context vào HANDOVER.md
  □ Ghi những gì đã làm, đang làm dở, cần làm tiếp
```

---

## Quy trình khi cần sửa file đã tồn tại

```
1. Ghi vào agent/PROGRESS.md (mục "Pending Changes")
2. Giải thích:
   - File nào cần sửa
   - Tại sao cần sửa
   - Sửa gì
3. Đợi user approve
4. Sửa và commit: refactor(<scope>): update X
```

---

## Quy trình khi gặp conflict

```
1. Ghi vào agent/PROGRESS.md (mục "Conflict Tracking")
2. Mô tả:
   - File nào conflict
   - Vấn đề gì
   - Ảnh hưởng thế nào
3. Discuss với user để giải quyết
4. Fix và commit: fix(<scope>): resolve conflict
```

---

## Quy trình khi gặp bug

```
1. Ghi vào docs/reference/changelog.md (theo format có sẵn)
2. Ghi nguyên nhân + cách xử lý + lessons learned
3. Thêm vào Prevention Checklist nếu là bug thường gặp
4. Update docs/guides/rules.md nếu cần thêm rule
```

---

## Thứ tự đọc khi bắt đầu ngày mới

```
1. HANDOVER.md              ← Context từ session trước
2. agent/WORKFLOW.md        ← Quy trình (bạn đang đọc)
3. agent/PROGRESS.md        ← Xem progress hiện tại
4. tasks/<module>.md        ← Xem task tiếp theo
5. docs/guides/rules.md     ← Nhớ quy tắc
6. docs/guides/decisions.md ← Hiểu design decisions
```

---

## Reference files

| File | Mục đích | Khi nào đọc |
|---|---|---|
| HANDOVER.md | Context handoff | Lúc đầu |
| agent/WORKFLOW.md | Quy trình tổng hợp | Lúc đầu |
| agent/PROGRESS.md | Track progress | Mỗi lần bắt đầu |
| agent/MODULES.md | Tổng quan modules | Khi cần hiểu module |
| agent/COMMIT_CONVENTION.md | Quy tắc commit | Khi commit |
| agent/GIT_WORKFLOW.md | Git workflow | Khi dùng git |
| agent/CODE_STYLE.md | Code style | Khi viết code |
| agent/PR_TEMPLATE.md | Template PR | Khi tạo PR |
| tasks/00-overview.md | Dependencies chung | Khi cần xem dependencies |
| tasks/<module>.md | Chi tiết module | Khi làm module đó |
| docs/guides/rules.md | Rules + lessons learned | Luôn |
| docs/guides/decisions.md | Design decisions | Khi cần hiểu lý do |
| docs/guides/testing.md | Testing guide | Khi cần debug |
| docs/guides/setup.md | Hướng dẫn cài đặt | Lần đầu |
| docs/core/knowledge-base.md | Kiến thức cốt lõi | Khi cần hiểu concepts |
| docs/architecture/architecture.md | Kiến trúc | Khi cần hiểu architecture |
| docs/reference/changelog.md | Bug tracking | Khi gặp bug |

---

## Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, test, bench, refactor, style, chore, opt
Scopes: core, server, strategy, vis, docs, agent

Ví dụ:
feat(core): thêm consistent hashing implementation
fix(replication): xử lý leader election race condition
docs(architecture): cập nhật component diagram
```

> Chi tiết xem: agent/COMMIT_CONVENTION.md

---

## Branch Naming

```
feature/<name>     → Feature mới
fix/<name>         → Fix bug
docs/<name>        → Documentation
refactor/<name>    → Refactor code
```

> Chi tiết xem: agent/GIT_WORKFLOW.md
