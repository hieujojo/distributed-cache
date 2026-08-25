# 🎯 DESIGN DECISIONS — Các quyết định thiết kế

> **Mục đích:** Ghi lại MỌI quyết định thiết kế quan trọng + lý do + alternatives đã cân nhắc.
> Khi muốn thay đổi quyết định → phải discuss trước, cập nhật file này, và ghi rõ lý do thay đổi.
> Nguồn cảm hứng: `D:\Unity Project\Void Runner\agent\DECISIONS.md`

---

## D1. Ngôn ngữ: TypeScript (không phải JavaScript thuần)

**Ngày:** 2026-08-22
**Quyết định:** Dùng TypeScript cho toàn bộ project.
**Lý do:**
- Type safety giúp phát hiện lỗi compile-time thay vì runtime
- IDE autocomplete tốt hơn
- Documentation tự nhiên qua interfaces/types
- Cộng đồng Node.js lớn, nhiều library hỗ trợ TS

**Alternatives đã cân nhắc:**
- JavaScript thuần: ❌ Không có type checking, dễ bug khi project lớn
- Go: ❌ Performance tốt hơn nhưng ecosystem nhỏ hơn cho web tools
- Rust: ❌ Quá phức tạp cho learning project

**Tradeoffs:**
- ✅ Type safety, IDE support, documentation
- ❌ Compile step, learning curve cho người mới TS

---

## D2. MurmurHash (không phải SHA-256 hay MD5)

**Ngày:** 2026-08-22
**Quyết định:** Dùng murmurhash cho consistent hashing.
**Lý do:**
- Không phải cryptographic hash, focus vào performance
- Phân phối đồng đều tốt cho hash ring
- Được dùng trong Redis, Cassandra, DynamoDB

**Alternatives đã cân nhắc:**
- SHA-256: ❌ Quá chậm cho thao tác tần suất cao (10k+ ops/sec)
- MD5: ❌ Phân phối không đều bằng murmurhash
- CRC32: ❌ Phân phối không đều, vulnerability known

**Tradeoffs:**
- ✅ Nhanh, phân phối đều, được validate bởi production systems
- ❌ Không cryptographic (không cần cho cache)

---

## D3. Strategy Pattern + Factory cho Eviction Policies

**Ngày:** 2026-08-22 (cập nhật 2026-08-26)
**Quyết định:** Dùng Strategy Pattern + Factory function cho LRU, LFU, FIFO.
**Lý do:**
- Thêm eviction policy mới chỉ cần tạo file mới
- Không sửa CacheNode khi thêm policy
- `createEvictionStrategy(policy)` factory ẩn việc khởi tạo strategy
- CacheNode constructor nhận `evictionPolicy?: 'lru' | 'lfu' | 'fifo'`

**Alternatives đã cân nhắc:**
- If/else trong CacheNode: ❌ Vi phạm Open/Closed Principle
- Kế thừa từ BaseNode: ❌ Coupling cao, khó test riêng

**Tradeoffs:**
- ✅ Extensible, testable, loosely coupled
- ❌ Nhiều files hơn (3 files thay vì 1)

---

## D4. TCP Server (không phải HTTP/WebSocket)

**Ngày:** 2026-08-22
**Quyết định:** Dùng TCP net.Server cho network layer.
**Lý do:**
- Cache operations cần low latency
- TCP connection pooling hiệu quả hơn HTTP
- Compatible với Redis protocol (RESP)

**Alternatives đã cân nhắc:**
- HTTP Express: ❌ Quá nhiều overhead cho cache operations
- WebSocket: ❌ Overkill cho request-response pattern
- gRPC: ❌ Quá phức tạp, cần proto files

**Tradeoffs:**
- ✅ Low latency, compatible với Redis ecosystem
- ❌ Không có browser client directly (cần REST adapter)

---

## D5. EventEmitter cho Cluster Events

**Ngày:** 2026-08-22
**Quyết định:** Dùng EventEmitter (Node.js built-in) cho cluster events.
**Lý do:**
- Built-in, không cần thêm dependency
- Async event handling tự nhiên
- Phù hợp với Observer Pattern

**Alternatives đã cân nhắc:**
- RxJS: ❌ Quá nặng cho use case đơn giản
- Custom pub/sub: ❌ Reimplement wheel

**Tradeoffs:**
- ✅ Zero dependency, well-known pattern
- ❌ Memory leak nếu không remove listeners

---

## D6. React + Canvas cho Visualization

**Ngày:** 2026-08-22
**Quyết định:** Dùng React + HTML Canvas cho hash ring visualization.
**Lý do:**
- React quản lý UI components
- Canvas render hiệu quả cho 2D graphics
- Có thể benchmark trong browser

**Alternatives đã cân nhắc:**
- D3.js: ❌ Quá nặng,overkill cho simple visualization
- Plain Canvas: ❌ Không có component model
- Three.js: ❌ 3D không cần thiết

**Tradeoffs:**
- ✅ Phổ biến, easy to find React developers
- ❌ Cần 2 technology (React + Canvas)

---

## D7. Monorepo (không phải Multi-repo)

**Ngày:** 2026-08-22
**Quyết định:** Tất cả trong 1 repo (src/, tests/, docs/).
**Lý do:**
- Learning project, không cần deploy riêng
- Dễ quản lý, atomic commits
- CI/CD đơn giản hơn

**Alternatives đã cân nhắc:**
- Monorepo + workspaces: ❌ Không cần cho project nhỏ
- Multi-repo: ❌ Quá phức tạp

---

## D8. Jest cho Testing (không phải Vitest hay Mocha)

**Ngày:** 2026-08-22
**Quyết định:** Dùng Jest cho unit tests.
**Lý do:**
- Jest là standard cho Node.js projects
- Built-in assertion, mocking, coverage
- Matches JD requirements (Gear Games cần Jest)

**Alternatives đã cân nhắc:**
- Vitest: ❌ Mới hơn, ecosystem nhỏ hơn
- Mocha + Chai: ❌ Cần thêm libraries
- Node test runner: ❌ Still experimental

---

## D9. Append-Only cho Tasks Files

**Ngày:** 2026-08-22
**Quyết định:** Tasks files chỉ thêm, không xóa nội dung cũ.
**Lý do:**
- Audit trail — biết đã làm gì, khi nào
- Debugging — truy vết khi có bug
- History — biết evolution của project

**Quy tắc:**
- ✅ Thêm changelog entry mới
- ✅ Tick checkbox ⬜ → ✅
- ❌ Xóa nội dung cũ
- ❌ Viết lại toàn bộ file

---

*Cập nhật file này khi có quyết định thiết kế mới. Luôn ghi rõ: ngày, lý do, alternatives đã cân nhắc.*
