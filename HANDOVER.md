# 🔄 HANDOVER — Context cho AI Session Mới

> **Mục đích:** Khi session kết thúc, ghi lại context vào đây. Khi session mới bắt đầu, đọc file này TRƯỚC TIÊN.
> Nguồn cảm hứng: `D:\Unity Project\Void Runner\agent\HANDOVER.md`

---

## 📋 Format khi kết thúc session

```
### Session YYYY-MM-DD — [Mô tả ngắn]
**Trạng thái:** [Đang làm dở / Hoàn thành / Blocked]
**Module hiện tại:** [Module X — Task Y]
**Đã làm:**
- [ ] Task 1
- [ ] Task 2

**Đang làm dở:**
- [ ] Task 3 (đã viết 50%, còn phần test)

**Cần làm tiếp:**
- Task 4
- Task 5

**Vấn đề gặp phải:**
- [Mô tả vấn đề + cách đã thử]

**Files đã thay đổi:**
- src/core/xxx.ts (đã edit)
- tests/core/xxx.test.ts (đã tạo mới)

**Dependencies đã cài:**
- package-name (đã npm install)

**Conflicts phát hiện:**
- [Mô tả conflict hoặc "Không có"]
```

---

## 📋 Format khi bắt đầu session mới

```
### Session YYYY-MM-DD — Bắt đầu
**Đọc trước:**
1. Entry gần nhất ở trên
2. agent/PROGRESS.md — xem progress hiện tại
3. tasks/<module>.md — xem chi tiết task cần làm

**Kiểm tra:**
- npm test có pass không?
- Có file nào đang edit dở không?
- Có conflict nào chưa resolve không?
```

---

## 📝 History

<!-- Thêm entries mới nhất ở đây -->

