# Contributing

Cảm ơn bạn đã quan tâm đến contributing! 🎉

---

## Quick Start

```bash
# 1. Fork repository trên GitHub

# 2. Clone
git clone https://github.com/YOUR_USERNAME/distributed-cache.git
cd distributed-cache

# 3. Install
npm install

# 4. Tạo feature branch
git checkout -b feature/your-feature

# 5. Code + Test
npm test

# 6. Commit
git commit -m "feat(scope): your message"

# 7. Push + PR
git push origin feature/your-feature
```

---

## Commit Convention

> Chi tiết xem: agent/COMMIT_CONVENTION.md

```
<type>(<scope>): <subject>

Types: feat, fix, docs, test, bench, refactor, style, chore
Scopes: core, server, strategy, vis, docs, agent
```

**Ví dụ:**
```
feat(core): add consistent hashing implementation
fix(replication): handle leader election race condition
docs(architecture): update component diagram
```

---

## Code Style

> Chi tiết xem: agent/CODE_STYLE.md

```
- TypeScript strict mode
- kebab-case cho files (consistent-hashing.ts)
- PascalCase cho classes (ConsistentHash)
- camelCase cho functions/variables (getNode)
- JSDoc cho mọi public API
```

---

## Git Workflow

> Chi tiết xem: agent/GIT_WORKFLOW.md

```
- Không commit trực tiếp lên main
- Luôn tạo feature branch
- Branch naming: feature/<name>, fix/<name>, docs/<name>
- Squash commits khi merge PR
```

---

## Testing

```bash
npm test                    # Chạy tests
npm run test:coverage       # Check coverage (>= 80%)
npm run test:watch          # Watch mode
```

**Yêu cầu:**
```
- Mọi feature mới PHẢI có tests
- Coverage >= 80%
- Tất cả tests PHẢI pass trước khi commit
```

---

## Pull Request

### Trước khi submit

```
□ Code compile không lỗi
□ Tất cả tests pass
□ Coverage >= 80%
□ Không có console.log trong production code
□ JSDoc cho mọi public API
□ Update docs (nếu cần)
□ Chạy benchmark (nếu có performance impact)
```

### PR Description

```
## Mô tả
Mô tả ngắn gọn changes

## Changes
- Thêm/sửa/xóa gì

## Test plan
- Cách test changes

## Breaking changes (nếu có)
- Mô tả breaking changes
```

---

## Code Review

### Reviewer Checklist

```
□ Code follows style guide
□ Tests cover edge cases
□ Documentation is clear
□ No security vulnerabilities
□ Performance acceptable
□ Breaking changes documented
```

---

## Issue Reporting

### Bug Report

```markdown
## Mô tả
Mô tả bug

## Steps to reproduce
1. ...
2. ...
3. ...

## Expected behavior
Mô tả behavior mong đợi

## Actual behavior
Mô tả behavior thực tế

## Environment
- Node.js version:
- OS:
- npm version:
```

### Feature Request

```markdown
## Mô tả
Mô tả feature cần

## Use case
Tại sao cần feature này

## Proposed solution
Giải pháp đề xuất
```

---

## Questions?

Tạo Issue trên GitHub nếu có thắc mắc.

---

## License

Bằng việc contribute, bạn đồng ý rằng code sẽ được distribute dưới MIT License.
