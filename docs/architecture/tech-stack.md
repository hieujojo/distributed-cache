# Technology Stack — Lý do chọn

## Tổng quan

| Layer | Công nghệ | Phiên bản | Lý do chọn |
|---|---|---|---|
| Language | TypeScript | 5.x | Type safety, IDE support |
| Runtime | Node.js | 22.x LTS | Non-blocking I/O, event-driven |
| Network | TCP sockets | built-in | Giao tiếp node-to-node |
| Frontend | React | 18.x | Component-based, ecosystem |
| Visualization | Canvas API | built-in | Render hash ring |
| Testing | Jest | 29.x | Industry standard |
| Build | tsup | latest | Bundle nhanh, ESM support |

---

## Chi tiết từng công nghệ

### 1. TypeScript

**Tại sao chọn:**
```
+ Type safety → giảm runtime errors
+ IDE support → autocomplete, refactoring
+ Documentation tự động → interface rõ ràng
+ Ecosystem lớn → nhiều libraries hỗ trợ
+ Phù hợp cho distributed systems → complex data structures
```

**Alternatives đã cân nhắc:**
```
JavaScript:
  - Không có type → dễ bug trong complex logic
  - Refactoring khó hơn

Go:
  + Rất nhanh, phù hợp cho networking
  - Learning curve cao
  - Ít ecosystem cho frontend visualization

Rust:
  + Performance tốt nhất
  - Quá phức tạp cho educational project
```

**Kết luận:** TypeScript balance giữa simplicity và correctness

---

### 2. Node.js

**Tại sao chọn:**
```
+ Event-driven, non-blocking I/O
  → Phù hợp cho handling nhiều connections đồng thời
  → Cache server cần handle hàng nghìn requests

+ Single language cho backend + frontend
  → Dùng TypeScript cho cả hai
  → Code sharing giữa server và visualization

+ Ecosystem lớn
  → Jest, tsup, React đều chạy tốt trên Node.js
```

**Alternatives đã cân nhắc:**
```
Deno:
  + Modern, TypeScript native
  - Ít ecosystem hơn Node.js
  - Compatibility issues với một số packages

Bun:
  + Rất nhanh
  - Còn mới, stability concerns
  - Ít production usage
```

**Kết luận:** Node.js stable, mature, phù hợp nhất

---

### 3. TCP Sockets

**Tại sao chọn:**
```
+ Low-level control
  → Hiểu cách nodes giao tiếp thật sự
  → Không bị ẩn bởi HTTP framework

+ Performance
  → Ít overhead hơn HTTP
  → Persistent connections

+ Phù hợp cho inter-node communication
  → Cache servers giao tiếp với nhau liên tục
```

**Alternatives đã cân nhắc:**
```
HTTP (Express/Fastify):
  + Dễ implement
  + Tooling sẵn có
  - Quá nhiều overhead cho inter-node
  - Không cần request/response format

WebSocket:
  + Real-time bidirectional
  - Phức tạp hơn TCP
  - Không cần bidirectional cho cache
```

**Kết luận:** TCP phù hợp cho low-latency inter-node communication

---

### 4. React + Canvas API

**Tại sao chọn:**
```
+ Component-based
  → Tách hash ring, dashboard, node map

+ Canvas API
  → Render hash ring interactive
  → Performance tốt hơn SVG cho nhiều nodes
  → Animation mượt mà

+ Familiar
  → Đã biết React từ các project trước
```

**Alternatives đã cân nhắc:**
```
D3.js:
  + Powerful data visualization
  - Quá phức tạp cho hash ring
  - Learning curve cao

Three.js:
  + 3D visualization
  - Không cần 3D cho hash ring
  - Heavy cho visualization đơn giản

Pure HTML/CSS:
  + Đơn giản
  - Không interactive
  - Khó animate
```

**Kết luận:** React + Canvas balance giữa simplicity và interactivity

---

### 5. Jest

**Tại sao chọn:**
```
+ Industry standard
  → Industry standard cho Node.js testing
  → Phổ biến nhất trong Node.js ecosystem

+ Built-in mocking
  → Mock TCP connections dễ dàng
  → Test isolation tốt

+ Coverage reports
  → Đo code coverage
  → Đảm bảo test đầy đủ
```

**Alternatives đã cân nhắc:**
```
Vitest:
  + Nhanh hơn Jest
  + ESM support tốt hơn
  - Ít ecosystem hơn Jest
  - Ít documentation hơn

Mocha/Chai:
  + Flexible
  - Không built-in assertions
  - Cần setup nhiều hơn
```

**Kết luận:** Jest mature, đầy đủ, phù hợp nhất

---

### 6. tsup

**Tại sao chọn:**
```
+ Bundle TypeScript nhanh
  → Dùng esbuild (written in Go)
  → Build < 1 giây

+ ESM + CJS support
  → Export cả hai format
  → Compatible với mọi project

+ Zero-config
  → Ít setup nhất
```

**Alternatives đã cân nhắc:**
```
tsc (TypeScript compiler):
  + Official
  - Chỉ compile, không bundle
  - Không optimize

Rollup:
  + Powerful
  - Config phức tạp
  - Chậm hơn

Webpack:
  + Feature-rich
  - Quá nặng cho library
  - Config phức tạp
```

**Kết luận:** tsup nhanh, đơn giản, phù hợp cho library

---

## Version Matrix

```json
{
  "typescript": "^5.4.0",
  "node": ">=22.0.0",
  "react": "^18.3.0",
  "jest": "^29.7.0",
  "tsup": "^8.0.0"
}
```

## Browser Support (Visualization)

```
Chrome:    90+     ✅
Firefox:   90+     ✅
Safari:    15+     ✅
Edge:      90+     ✅
IE:        —       ❌ (không hỗ trợ)
```
