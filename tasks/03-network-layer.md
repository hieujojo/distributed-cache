# Tasks 03: Network Layer

> Module 3: TCP server + client library

---

## Mục tiêu

Implement TCP server và client library để nodes giao tiếp.

---

## Dependencies

```
Không cần cài thêm (dùng net module built-in của Node.js)
```

---

## Files đã tạo

### ✅ src/server/protocol.ts

```
Mục đích: Wire protocol cho TCP communication

Sẽ tạo:
  - Type CommandType = 'SET' | 'GET' | 'DEL' | 'PING' | 'REPLICATE' | 'ELECT'

  - Interface CacheRequest:
    - type: CommandType
    - key?: string
    - value?: Value
    - ttl?: number
    - nodeId?: string

  - Interface CacheResponse:
    - type: 'VALUE' | 'OK' | 'NULL' | 'ERROR' | 'PONG'
    - value?: Value
    - message?: string

  - Function parseRequest(buffer: Buffer): CacheRequest
    - Chuyển đổi raw TCP buffer thành CacheRequest object
    - Format: "COMMAND key value ttl\r\n"
    - Ví dụ: "SET user:123 John 60000\r\n"
    - Xử lý error nếu format sai

  - Function serializeResponse(response: CacheResponse): Buffer
    - Chuyển đổi CacheResponse thành TCP buffer
    - VALUE: "VALUE <value>\r\n"
    - OK: "OK\r\n"
    - NULL: "NULL\r\n"
    - ERROR: "ERROR <message>\r\n"
    - PONG: "PONG\r\n"

Tham chiếu:
  - Value từ '../core/types'

Sửa đổi: Không (file mới)
```

### ✅ src/server/cache-server.ts

```
Mục đích: TCP server nhận requests từ clients và nodes khác

Sẽ tạo:
  - import * as net from 'net'
  - import { parseRequest, serializeResponse } from './protocol'
  - import { CacheRequest, CacheResponse } from './protocol'
  - import { ClusterManager } from '../core/cluster'

  - Interface ServerConfig:
    - host: string
    - port: number
    - heartbeatInterval: number (default: 5000)
    - heartbeatTimeout: number (default: 15000)

  Class CacheServer:
    Private:
      - server: net.Server
      - config: ServerConfig
      - cluster: ClusterManager
      - isRunning: boolean

    Constructor(config: ServerConfig, cluster: ClusterManager):
      - this.config = config
      - this.cluster = cluster
      - this.isRunning = false

    start(): Promise<void>:
      - Tạo net.Server
      - server.on('connection', handleConnection)
      - server.listen(config.port, config.host)
      - this.isRunning = true
      - Return promise

    stop(): Promise<void>:
      - server.close()
      - this.isRunning = false
      - Return promise

    isRunning(): boolean:
      - Return this.isRunning

    Private handleConnection(socket: net.Socket):
      - socket.on('data', async (data) => {
          - const request = parseRequest(data)
          - const response = await processRequest(request)
          - socket.write(serializeResponse(response))
        })
      - socket.on('error', handleError)

    Private async processRequest(request: CacheRequest): Promise<CacheResponse>
      - Switch request.type:
        - 'GET': cluster.getNode(request.key).get(request.key)
        - 'SET': cluster.getNode(request.key).set(request.key, request.value, request.ttl)
        - 'DEL': cluster.getNode(request.key).delete(request.key)
        - 'PING': return { type: 'PONG' }
        - 'REPLICATE': replicate to replica
        - 'ELECT': handle election

Tham chiếu:
  - net module (Node.js built-in)
  - parseRequest từ './protocol'
  - serializeResponse từ './protocol'
  - CacheRequest từ './protocol'
  - CacheResponse từ './protocol'
  - ClusterManager từ '../core/cluster'

Sửa đổi: Không (file mới)
```

### ✅ src/server/client.ts

```
Mục đích: Client library để gửi requests đến cache server

Sẽ tạo:
  - import * as net from 'net'
  - import { serializeRequest, parseResponse } from './protocol'
  - import { CacheRequest, CacheResponse } from './protocol'

  - Interface ClientConfig:
    - host: string
    - port: number
    - timeout: number (default: 5000)
    - retries: number (default: 3)

  Class CacheClient:
    Private:
      - socket: net.Socket | null
      - config: ClientConfig
      - isConnected: boolean

    Constructor(config: ClientConfig):
      - this.config = config
      - this.isConnected = false

    async connect(): Promise<void>:
      - Tạo socket mới
      - socket.connect(config.port, config.host)
      - Đợi connection thành công
      - this.isConnected = true

    async disconnect(): Promise<void>:
      - socket.end()
      - this.isConnected = false

    async get(key: string): Promise<Value | null>:
      - const request = { type: 'GET', key }
      - const response = await send(request)
      - Return response.value hoặc null

    async set(key: string, value: Value, ttl?: number): Promise<void>:
      - const request = { type: 'SET', key, value, ttl }
      - await send(request)

    async del(key: string): Promise<boolean>:
      - const request = { type: 'DEL', key }
      - const response = await send(request)
      - Return true nếu OK

    async ping(): Promise<boolean>:
      - const request = { type: 'PING' }
      - const response = await send(request)
      - Return response.type === 'PONG'

    Private async send(request: CacheRequest): Promise<CacheResponse>
      - Nếu chưa connect → throw error
      - Serialize request
      - socket.write(serialized)
      - Đợi response (với timeout)
      - Parse response
      - Retry nếu fail (với exponential backoff)

Tham chiếu:
  - net module (Node.js built-in)
  - serializeRequest từ './protocol'
  - parseResponse từ './protocol'
  - CacheRequest từ './protocol'
  - CacheResponse từ './protocol'
  - Value từ '../core/types'

Sửa đổi: Không (file mới)
```

---

## Tests đã tạo

### ✅ tests/server/protocol.test.ts

```
Test cases:
  1. describe('Protocol')
     - describe('parseRequest')
       - it('should parse SET command')
       - it('should parse GET command')
       - it('should parse DEL command')
       - it('should parse PING command')
       - it('should throw on invalid format')
     - describe('serializeResponse')
       - it('should serialize VALUE response')
       - it('should serialize OK response')
       - it('should serialize NULL response')
       - it('should serialize ERROR response')
       - it('should serialize PONG response')
```

### ✅ tests/server/cache-server.test.ts

```
Test cases:
  1. describe('CacheServer')
     - describe('start/stop')
       - it('should start server')
       - it('should stop server')
       - it('should report isRunning')
     - describe('handleConnection')
       - it('should accept connection')
       - it('should handle SET request')
       - it('should handle GET request')
       - it('should handle DEL request')
       - it('should handle PING request')
       - it('should handle timeout')
```

### ✅ tests/server/client.test.ts

```
Test cases:
  1. describe('CacheClient')
     - describe('connect/disconnect')
       - it('should connect to server')
       - it('should disconnect from server')
     - describe('operations')
       - it('should set and get value')
       - it('should delete key')
       - it('should ping server')
     - describe('error handling')
       - it('should retry on failure')
       - it('should handle timeout')
       - it('should throw if not connected')
```

---

## Kết quả

```
Test Suites: 3 passed, 3 total
Tests:       77 passed, 77 total (Module 3 only)
Total:       126 passed, 8 suites (toàn bộ project)
```

## Changelog

```
2026-08-21: Tạo file tasks
2026-08-22: Hoàn thành Module 3
  - Tạo src/server/protocol.ts: wire protocol parser/serializer
  - Tạo src/server/cache-server.ts: TCP server với consistent hashing routing
  - Tạo src/server/client.ts: client library với retry + timeout
  - Tạo 3 test files: 77 tests cho module 3
  - Fix connection cleanup issue trong server.stop()
  ```

---

## Commit message dự kiến

```
feat(server): add TCP server and client library

- Add src/server/protocol.ts: wire protocol parser/serializer
- Add src/server/cache-server.ts: TCP server with request handling
- Add src/server/client.ts: client library with retry logic
- Add tests/server/*.test.ts

Protocol supports: SET, GET, DEL, PING, REPLICATE, ELECT
Server handles: connections, requests, timeouts
Client handles: connect, disconnect, retries, exponential backoff
```
