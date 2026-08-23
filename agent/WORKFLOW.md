# WORKFLOW — Quy trình làm việc

> File này tổng hợp toàn bộ quy trình. Đọc file này trước khi bắt đầu.

---

## Khi bắt đầu làm việc

```
1. Đọc file này (WORKFLOW.md)
2. Đọc agent/HANDOVER.md → xem session trước làm gì
3. Đọc agent/PROGRESS.md → xem module nào cần làm tiếp
4. Đọc tasks/<module>.md → xem chi tiết cần làm gì
5. Đọc docs/guides/rules.md → nhớ quy tắc
```

---

## Quy trình code 1 module

```
BƯỚC 1: Chuẩn bị
  □ Đọc tasks/<module>.md
  □ Kiểm tra dependencies cần cài

BƯỚC 2: Setup (nếu cần)
  □ Cài dependencies: npm install <package>
  □ Tạo cấu trúc thư mục: mkdir -p src/<module>

BƯỚC 3: Code
  □ Tạo files theo thứ tự trong tasks file
  □ Mỗi file: viết code → viết test → chạy test
  □ Tuân theo rules trong docs/guides/rules.md
  □ SAU KHI XONG 1 FILE: tick ✅ trong tasks/<module>.md

BƯỚC 4: Test
  □ npm test — ALL PASS
  □ npm run test:coverage — ≥ 80%
  □ Xem docs/guides/testing.md khi cần debug

BƯỚC 5: Update docs
  □ Kiểm tra docs có cần update không
  □ Nếu có → update trước khi commit

BƯỚC 6: Commit & Push
  □ Mỗi file 1 commit riêng
  □ Tuân theo agent/COMMIT_CONVENTION.md
  □ Push: git push origin main

BƯỚC 7: Update progress
  □ Tick ✅ trong tasks/<module>.md
  □ Tick ✅ trong agent/PROGRESS.md
  □ Ghi changelog trong tasks/<module>.md

BƯỚC 8: Kết thúc session
  □ Ghi context vào agent/HANDOVER.md
```

---

## Quy trình khi cần sửa file đã tồn tại

```
1. Ghi vào agent/PROGRESS.md (mục "Pending Changes")
2. Giải thích: file nào, tại sao, sửa gì
3. Đợi user approve
4. Sửa và commit: "refactor(<scope>): update X"
```

---

## Quy trình khi gặp conflict

```
1. Ghi vào agent/PROGRESS.md (mục "Conflict Tracking")
2. Mô tả: file nào, vấn đề gì, ảnh hưởng thế nào
3. Discuss với user
4. Fix và commit: "fix(<scope>): resolve conflict"
```

---

## Quy trình khi gặp bug

```
1. Ghi vào docs/reference/changelog.md
2. Ghi: nguyên nhân + cách xử lý + lessons learned
3. Thêm rule vào docs/guides/rules.md nếu cần
```

---

## Thứ tự đọc khi bắt đầu ngày mới

```
1. agent/HANDOVER.md        ← Context từ session trước
2. agent/WORKFLOW.md        ← Quy trình
3. agent/PROGRESS.md        ← Progress hiện tại
4. tasks/<module>.md        ← Task tiếp theo
5. docs/guides/rules.md     ← Quy tắc
```

---

## Reference files

| File | Mục đích |
|---|---|
| agent/HANDOVER.md | Context handoff |
| agent/WORKFLOW.md | Quy trình tổng hợp |
| agent/PROGRESS.md | Track progress |
| agent/MODULES.md | Tổng quan modules |
| agent/COMMIT_CONVENTION.md | Quy tắc commit |
| agent/GIT_WORKFLOW.md | Git workflow |
| agent/CODE_STYLE.md | Code style |
| agent/PR_TEMPLATE.md | Template PR |
| tasks/*.md | Chi tiết modules |
| docs/guides/rules.md | Rules + lessons |
| docs/guides/testing.md | Testing guide |
| docs/guides/decisions.md | Design decisions |
| docs/guides/setup.md | Cài đặt |
| docs/reference/changelog.md | Bug tracking |
