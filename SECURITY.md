# Security Policy

## Known Limitations

> **⚠️ This is an educational project.** It demonstrates distributed cache concepts and is **NOT production-ready**.

| Issue | Severity | Description |
|---|---|---|
| No Authentication | 🔴 High | Anyone who can connect via TCP can read/write data |
| No TLS/SSL | 🔴 High | Data transmitted in plain text |
| No Rate Limiting | 🟡 Medium | Vulnerable to DoS attacks |
| No Input Validation | 🟡 Medium | Protocol parser does not validate input size |

**Do NOT use in production** without adding authentication, TLS, and rate limiting.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** open a public GitHub issue
2. Use [GitHub Private Vulnerability Reporting](https://github.com/hieujojo/distributed-cache/security/advisories/new) to report
3. Include: description, steps to reproduce, potential impact
4. You will receive acknowledgment within 48 hours

## Security Checklist for Production Use

If you adapt this code for production:

- [ ] Add TCP/TLS encryption
- [ ] Implement token-based authentication
- [ ] Add rate limiting per client
- [ ] Validate all protocol inputs
- [ ] Sanitize error messages (no internal details)
- [ ] Set maximum key/value sizes
- [ ] Enable audit logging
