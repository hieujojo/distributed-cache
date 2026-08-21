# Security Policy

> Các hướng dẫn bảo mật cho project này.

---

## Báo cáo Vulnerabilities

Nếu bạn phát hiện security vulnerability, vui lòng **KHÔNG** tạo public issue.

Thay vào đó, hãy email trực tiếp cho maintainer.

---

## Security Considerations

### 1. Network Security

```
Hiện tại:
  - TCP connections (không encrypted)
  - Dùng cho inter-node communication

Lưu ý:
  - Không expose trực tiếp ra internet
  - Dùng trong internal network
  - Có thể thêm TLS/SSL sau
```

### 2. Input Validation

```
Quy tắc:
  - Validate TẤT CẢ input từ client
  - Không tin tưởng data từ network
  - Sanitize key/value trước khi xử lý

Ví dụ:
  - Key: không quá 256 bytes
  - Value: không quá 1MB
  - Không chấp nhận null/undefined keys
```

### 3. Authentication (Tùy chọn)

```
Nếu expose API cho external clients:
  - Thêm API key authentication
  - Hoặc JWT tokens
  - Internal nodes: có thể trust nhau
```

### 4. Authorization

```
Phân quyền:
  - Admin: thêm/xóa nodes, xem stats
  - Client: get/set/delete keys
  - ReadOnly: chỉ get keys
```

### 5. Data Security

```
Lưu ý:
  - Cache data là temporary → không lưu sensitive data
  - Không lưu passwords, tokens, PII trong cache
  - Clear cache khi shutdown
```

---

## Checklist khi code

```
□ Validate tất cả input từ network
□ Không hardcode secrets (API keys, passwords)
□ Không commit .env files
□ Không log sensitive data
□ Handle errors gracefully (không leak info)
□ Không tin tưởng client data
```

---

## Known Limitations

```
1. TCP không encrypted
   → Cần thêm TLS/SSL cho production

2. Không có authentication
   → Hiện tại ai cũng có thể kết nối

3. Không có rate limiting
   → Có thể bị DDoS
```

---

## Cải thiện trong tương lai

```
⬜ Thêm TLS/SSL cho TCP connections
⬜ Thêm API key authentication
⬜ Thêm rate limiting
⬜ Thêm input sanitization library
⬜ Audit dependencies cho vulnerabilities
```
