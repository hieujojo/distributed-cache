# Contributing

Cảm ơn bạn đã quan tâm đến contributing! 🎉

## Quick Start

```bash
# 1. Fork repository
# 2. Clone
git clone https://github.com/YOUR_USERNAME/distributed-cache.git
cd distributed-cache

# 3. Install
npm install

# 4. Create branch
git checkout -b feature/your-feature

# 5. Code + Test
npm test

# 6. Commit
git commit -m "feat(scope): your message"

# 7. Push + PR
git push origin feature/your-feature
```

## Commit Convention

```
<type>(<scope>): <subject>

feat:     Feature mới
fix:      Fix bug
docs:     Documentation
test:     Thêm/sửa tests
refactor: Refactor code
bench:    Benchmark
chore:    Maintenance

Scopes: core, server, strategy, vis, docs, agent
```

Ví dụ:
```
feat(core): add consistent hashing implementation
fix(replication): handle leader election race condition
docs(architecture): update component diagram
```

## Code Style

- TypeScript strict mode
- kebab-case cho files
- PascalCase cho classes
- camelCase cho functions/variables
- JSDoc cho mọi public API

## Testing

```bash
npm test                    # Chạy tests
npm run test:coverage       # Check coverage (>= 80%)
```

## Pull Request

1. Code compile không lỗi
2. Tất cả tests pass
3. Coverage >= 80%
4. Update docs (nếu cần)
5. PR description rõ ràng

## Questions?

Tạo Issue trên GitHub nếu có thắc mắc.

## License

Bằng việc contribute, bạn đồng ý rằng code sẽ được distribute dưới MIT License.
