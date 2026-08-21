# Git Workflow

## Branch Strategy

```
main              ← Production-ready code
  │
  ├── feature/*   ← Features mới
  ├── fix/*       ← Bug fixes
  ├── docs/*      ← Documentation
  └── refactor/*  ← Code refactoring
```

## Branch Naming

```
feature/consistent-hashing
feature/replication-manager
fix/leader-election-race
docs/architecture
refactor/cache-node
test/replication
bench/throughput
```

## Quy trình làm việc

### 1. Bắt đầu feature mới

```bash
# Update main
git checkout main
git pull origin main

# Tạo feature branch
git checkout -b feature/my-feature

# Bắt đầu code
```

### 2. Trong khi code

```bash
# Commit thường xuyên (mỗi logical change)
git add .
git commit -m "feat(core): add hash function"

# Nếu cần lưu tạm
git stash

# Kiểm tra status
git status
git log --oneline
```

### 3. Hoàn thành feature

```bash
# Đảm bảo tests pass
npm test

# Push lên remote
git push origin feature/my-feature

# Tạo Pull Request trên GitHub
```

### 4. Code Review

```bash
# Nếu có feedback, sửa và commit thêm
git add .
git commit -m "fix(core): address review comments"

# Push lại
git push origin feature/my-feature
```

### 5. Merge

```bash
# Sau khi approve, merge vào main
git checkout main
git pull origin main
git merge feature/my-feature

# Xóa feature branch
git branch -d feature/my-feature
git push origin --delete feature/my-feature
```

## Commit Rules

### Frequency

```
✓ Commit mỗi logical change
✓ Commit khi hoàn thành 1 task
✓ Commit trước khi switch branch
✗ Không commit "WIP" hoặc "fix"
✗ Không commit directly vào main
```

### Message

```
✓ Dùng commit convention (xem COMMIT_CONVENTION.md)
✓ Mô tả WHY, không chỉ WHAT
✓ Tối đa 50 ký tự cho subject
✗ Không dùng "fix bug" hoặc "update"
✗ Không commit code chưa test
```

## Stashing

```bash
# Lưu tạm changes
git stash save "work in progress"

# Xem danh sách stashes
git stash list

# Apply stash
git stash apply

# Xóa stash
git stash drop
```

## Rebasing

```bash
# Cập nhật feature branch với main
git checkout feature/my-feature
git rebase main

# Nếu conflict
# Sửa conflict files
git add .
git rebase --continue
```

## Cherry-picking

```bash
# Lấy commit từ branch khác
git cherry-pick <commit-hash>
```

## Undo Changes

```bash
# Undo unstaged changes
git checkout -- <file>

# Undo staged changes
git reset HEAD <file>

# Undo last commit (giữ changes)
git reset --soft HEAD~1

# Undo last commit (xóa changes)
git reset --hard HEAD~1
```

## Git Config

```bash
# Set user info
git config user.name "Your Name"
git config user.email "your@email.com"

# Set default branch name
git config --global init.defaultBranch main

# Set editor
git config --global core.editor "code --wait"
```

## Common Commands

```bash
# Xem log
git log --oneline
git log --graph --oneline

# Xem diff
git diff
git diff --staged

# Xem branches
git branch -a

# Xem remote
git remote -v
```
