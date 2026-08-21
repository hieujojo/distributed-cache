# Consistent Hashing — Phân tích sâu

## Bài toán

Bạn có distributed cache với N server. Khi client muốn lưu hoặc lấy 1 key, bạn cần quyết định server nào xử lý key đó.

### Approach cũ: Modular Hashing

```
server_index = hash(key) % N
```

**Vấn đề:**

```
Ban đầu: 3 server (S0, S1, S2)
Key "user:123" → hash("user:123") % 3 = 1 → S1

Thêm S3:
Key "user:123" → hash("user:123") % 4 = 3 → S3 (CHUYỂN RỒI!)

Kết quả: ~75% toàn bộ keys bị redistribute
```

Mỗi lần bạn thêm hoặc xóa server, hầu hết keys phải di chuyển. Trong hệ thống lớn với hàng triệu keys, điều này gây ra network traffic khổng lồ và temporary unavailability.

## Giải pháp: Consistent Hashing

### Hash Ring (Vòng tròn hash)

Thay vì dùng modular hashing, map cả server lẫn keys lên 1 vòng tròn (từ 0 đến 2^32 - 1).

```
        S1
        |
   key:X ●
        |
        |
S0 ─────●─────● S2
        |
        |
        ● key:Y
```

- Mỗi server được hash đến 1 vị trí trên ring
- Mỗi key được hash đến 1 vị trí trên ring
- Key thuộc về server đầu tiên tìm thấy theo chiều kim đồng hồ

### Tại sao cách này hoạt động?

```
Thêm S3:
  → Chỉ key giữa S2 và S3 (và S3 và S0) cần di chuyển
  → Key gần S0, S1 vẫn giữ nguyên
  → Chỉ ~1/N tổng số keys di chuyển

Xóa S1:
  → Chỉ key thuộc S1 di chuyển sang S2
  → Các key khác giữ nguyên
```

### Vấn đề: Phân phối không đều

Với ít server, keys có thể phân phối không đều:

```
Ring với 3 server:
  S0 sở hữu 60% không gian ring → xử lý 60% keys
  S1 sở hữu 10% không gian ring → xử lý 10% keys
  S2 sở hữu 30% không gian ring → xử lý 30% keys
```

### Giải pháp: Virtual Nodes (Node ảo)

Mỗi physical server có nhiều vị trí trên ring:

```
S0 → V0-1, V0-2, V0-3 (virtual nodes rải rác trên ring)
S1 → V1-1, V1-2, V1-3
S2 → V2-1, V2-2, V2-3

Kết quả: Phân phối đều hơn
```

**Approach phổ biến:** 100-200 virtual nodes cho mỗi physical server

## Chi tiết implement

### Hash Function

```
Input: server ID hoặc key string
Output: vị trí trên ring (0 đến 2^32 - 1)

Lựa chọn phổ biến:
  → FNV-1a: nhanh, phân phối tốt
  → MurmurHash3: rất nhanh, phân phối xuất sắc
  → SHA-256: chậm hơn nhưng cryptographic (thường thừa)
```

### Tìm server chịu trách nhiệm

```
Cho key "user:123":
1. hash("user:123") → vị trí P trên ring
2. Tìm server đầu tiên theo chiều kim đồng hồ từ P
3. Server đó sở hữu key này

Lookup hiệu quả:
  → Lưu server trong sorted array (theo vị trí ring)
  → Binary search để tìm server đầu tiên ≥ P
  → O(log N) lookup time
```

### Thêm node

```
Trước: S0(0), S1(100), S2(200) trên ring
Thêm S3 tại vị trí 150

Key giữa S1(100) và S3(150): S1 → S3
Key giữa S3(150) và S2(200): đã là S2
→ Chỉ key trong khoảng [100, 150] di chuyển từ S1 sang S3
```

### Xóa node

```
Trước: S0(0), S1(100), S2(200) trên ring
Xóa S1 tại vị trí 100

Key thuộc S1: di chuyển sang server tiếp theo theo chiều kim đồng hồ (S2)
→ Chỉ key từ S1 di chuyển
```

## Benchmark Metrics

### Data Movement

```
Metric: % keys thay đổi server khi thêm/xóa node

Naive (modular hashing): ~75-100%
Consistent hashing: ~10-20% (với virtual nodes)

Công thức: 1/N trong đó N = số lượng server
```

### Lookup Performance

```
Naive:       O(1) — hash + modulo
Consistent:  O(log N) — binary search trên ring

Với 100 nodes: O(log 100) = ~7 so sánh → effectively O(1)
```

## Sử dụng trong thực tế

| Hệ thống | Họ dùng Consistent Hashing thế nào? |
|---|---|
| **Amazon DynamoDB** | Phân phối data trên storage nodes |
| **Apache Cassandra** | Token ring cho data distribution |
| **Memcached** | Client-side consistent hashing |
| **Discord** | Route messages đến cache server đúng |
| **CDN** | Phân phối content trên edge servers |

## Câu hỏi phỏng vấn thường gặp

1. **Tại sao không dùng modular hashing?**
   → Thêm/xóa node gây redistribution lớn

2. **Virtual nodes là gì? Tại sao dùng?**
   → Nhiều vị trí mỗi server → phân phối đều hơn

3. **Khi node failure xảy ra thì sao?**
   → Key của nó di chuyển sang node tiếp theo theo chiều kim đồng hồ

4. **Xử lý hotspot thế nào?**
   → Nhiều virtual nodes hơn cho server phổ biến

5. **Data movement khi thêm node là bao nhiêu?**
   → Khoảng 1/N tổng số keys
