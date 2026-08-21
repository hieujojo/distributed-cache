# Quy trình Contribution

## Quy tắc chung

1. **Code style**: Tuân theo `agent/CODE_STYLE.md`
2. **Commit convention**: Tuân theo `agent/COMMIT_CONVENTION.md`
3. **Git workflow**: Tuân theo `agent/GIT_WORKFLOW.md`
4. **Testing**: Mọi feature mới phải có tests
5. **Documentation**: Mọi public API phải có JSDoc

## Quy trình贡献

### 1. Fork và Clone

```bash
# Fork repository trên GitHub
git clone https://github.com/hieujojo/distributed-cache.git
cd distributed-cache
git remote add fork https://github.com/YOUR_USERNAME/distributed-cache.git
```

### 2. Tạo feature branch

```bash
# Từ main branch
git checkout main
git pull origin main

# Tạo feature branch
git checkout -b feature/consistent-hashing
# hoặc
git checkout -b fix/replication-bug
# hoặc
git checkout -b docs/update-readme
```

### 3. Code và Test

```bash
# Viết code
# ...

# Chạy tests
npm test

# Chạy tests với coverage
npm run test:coverage

# Đảm bảo coverage >= 80%
```

### 4. Commit

```bash
# Xem changes
git status

# Stage files
git add src/core/consistent-hashing.ts
git add tests/consistent-hashing.test.ts

# Commit với convention
git commit -m "feat(core): add consistent hashing implementation

- Implement hash ring with virtual nodes
- Add O(log N) lookup using binary search
- Add unit tests for node addition/removal
- Benchmark: 80% less data movement vs naive hashing"
```

### 5. Push và Create PR

```bash
# Push lên fork
git push fork feature/consistent-hashing

# Tạo Pull Request trên GitHub
# - Title: feat(core): add consistent hashing implementation
# - Description: Mô tả chi tiết changes
# - Labels: feature, core
```

### 6. Code Review

- Reviewer sẽ review code
- Sửa theo feedback
- Approve và merge

## Branch Naming

```
feature/<name>     → Feature mới
fix/<name>         → Fix bug
docs/<name>        → Documentation
refactor/<name>    → Refactor code
test/<name>        → Thêm tests
benchmark/<name>   → Benchmark improvements
```

## Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
```
feat:     Feature mới
fix:      Fix bug
docs:     Documentation
style:    Code style (không ảnh hưởng logic)
refactor: Refactor code
test:     Thêm/sửa tests
bench:    Benchmark
chore:    Maintenance tasks
```

**Scopes:**
```
core:      Core logic (consistent hashing, replication)
server:    Network layer (TCP server, protocol)
strategy:  Cache strategies (LRU, LFU, TTL)
vis:       Visualization (React components)
docs:      Documentation
agent:     Development workflow
```

**Ví dụ:**
```
feat(core): add consistent hashing implementation
fix(server): handle connection timeout
docs(core): add architecture documentation
test(replication): add leader election tests
bench(core): add throughput benchmark
```

## Code Review Checklist

### Before Submitting PR

```
□ Code compiles without errors
□ All tests pass
□ Test coverage >= 80%
□ No console.log in production code
□ JSDoc cho mọi public API
□ README updated (nếu cần)
□ Chạy benchmark (nếu có performance impact)
```

### Reviewer Checklist

```
□ Code follows style guide
□ Tests cover edge cases
□ Documentation is clear
□ No security vulnerabilities
□ Performance acceptable
□ Breaking changes documented
```

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
