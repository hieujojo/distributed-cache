# Tasks 04: Cluster Management

> Module 4: Cluster manager + leader election + failover

---

## Mục tiêu

Implement cluster management, leader election, và failover handling.

---

## Dependencies

```
Không cần cài thêm
```

---

## Files sẽ tạo

### ✅ src/core/cluster.ts

```
Mục đích: Quản lý danh sách nodes trong cluster

Sẽ tạo:
  - import { ConsistentHash } from './consistent-hashing'
  - import { CacheNode, HashConfig } from './types'

  Class ClusterManager (Singleton):
    Private static instance: ClusterManager
    Private nodes: Map<string, CacheNode>
    Private consistentHash: ConsistentHash
    Private primary: CacheNode | null
    Private heartbeatInterval: NodeJS.Timeout | null

    Static getInstance(): ClusterManager:
      - Nếu chưa có instance → tạo mới
      - return instance

    Static resetInstance(): void:
      - instance = null
      - Dùng cho testing

    addNode(node: CacheNode): void:
      - nodes.set(node.id, node)
      - consistentHash.addNode(node)
      - Nếu là node đầu tiên → trở thành primary

    removeNode(nodeId: string): void:
      - nodes.delete(nodeId)
      - consistentHash.removeNode(nodeId)
      - Nếu xóa primary → trigger election

    getNode(key: string): CacheNode | null:
      - return consistentHash.getNode(key)

    getHealthyNodes(): CacheNode[]:
      - Filter nodes theo health status
      - Return mảng nodes healthy

    getNodeById(nodeId: string): CacheNode | null:
      - return nodes.get(nodeId) || null

    startHeartbeat(): void:
      - setInterval gửi heartbeat mỗi N ms
      - Kiểm tra health của mỗi node
      - Nếu node không respond → đánh dấu unhealthy

    stopHeartbeat(): void:
      - clearInterval

    getStats(): ClusterStats:
      - totalNodes: nodes.size
      - healthyNodes: getHealthyNodes().length
      - primaryId: primary?.id
      - ringSize: consistentHash.getRingSize()

Tham chiếu:
  - ConsistentHash từ './consistent-hashing'
  - CacheNode từ './types'
  - HashConfig từ './types'

Sửa đổi: Không (file mới)
```

### ✅ src/core/election.ts

```
Mục đích: Leader election khi primary dies

Sẽ tạo:
  - Type NodeState = 'FOLLOWER' | 'CANDIDATE' | 'LEADER'

  - Interface ElectionResult:
    - winnerId: string
    - votes: Map<string, string>
    - duration: number

  Class ElectionManager:
    Private state: NodeState
    Private votes: Map<string, string>
    Private electionTimeout: NodeJS.Timeout | null

    startElection(): Promise<ElectionResult>:
      - state = 'CANDIDATE'
      - Gửi REQUEST_VOTE đến nodes có ID lớn hơn
      - Đợi responses (với timeout)
      - Nếu majority votes → trở thành LEADER
      - Nếu không → timeout, retry

    requestVote(nodeId: string): Promise<boolean>:
      - Gửi tin nhắn REQUEST_VOTE
      - Đợi response
      - Return true/false

    becomeLeader(): void:
      - state = 'LEADER'
      - Broadcast I_AM_LEADER
      - Bắt đầu gửi heartbeat

    becomeFollower(): void:
      - state = 'FOLLOWER'
      - Stop heartbeat
      - Bắt đầu listening for heartbeats

    Private handleVoteRequest(fromNodeId: string): boolean:
      - Nếu state === 'FOLLOWER' và chưa vote → accept
      - Nếu state === 'CANDIDATE' → so sánh ID
      - Return true/false

    Private handleLeaderAnnouncement(leaderId: string):
      - state = 'FOLLOWER'
      - Ghi nhận leader mới

Tham chiếu: Không (standalone module)

Sửa đổi: Không (file mới)
```

### ✅ src/core/failover.ts

```
Mục đích: Xử lý failover khi node dies

Sẽ tạo:
  - import { CacheNode } from './types'
  - import { ClusterManager } from './cluster'
  - import { ElectionManager } from './election'

  Class FailoverManager:
    Private cluster: ClusterManager
    Private election: ElectionManager
    Private failureThreshold: number
    Private recoveryTimeout: number

    Constructor(cluster: ClusterManager):
      - this.cluster = cluster
      - this.election = new ElectionManager()
      - this.failureThreshold = 3
      - this.recoveryTimeout = 30000

    detectFailure(nodeId: string): boolean:
      - Kiểm tra heartbeat count
      - Nếu missed > threshold → return true

    async triggerFailover(failedNode: CacheNode): Promise<void>:
      - Xóa failedNode khỏi cluster
      - Nếu failedNode là primary:
        - election.startElection()
      - Re-replicate data từ surviving nodes

    promoteReplica(replica: CacheNode): void:
      - replica.isPrimary = true
      - Update cluster state

    async handleRecovery(node: CacheNode): Promise<void>:
      - Đợi recoveryTimeout
      - Sync data từ primary
      - node.isPrimary = false
      - Thêm vào cluster

Tham chiếu:
  - CacheNode từ './types'
  - ClusterManager từ './cluster'
  - ElectionManager từ './election'

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

### ✅ tests/core/cluster.test.ts

```
Test cases:
  1. describe('ClusterManager')
     - describe('getInstance')
       - it('should return same instance')
       - it('should reset instance')
     - describe('addNode')
       - it('should add node to cluster')
       - it('should set first node as primary')
     - describe('removeNode')
       - it('should remove node from cluster')
     - describe('getNode')
       - it('should route key to correct node')
     - describe('getHealthyNodes')
       - it('should return healthy nodes only')
     - describe('getStats')
       - it('should return cluster stats')
```

### ✅ tests/core/election.test.ts

```
Test cases:
  1. describe('ElectionManager')
     - describe('startElection')
       - it('should start election')
       - it('should elect leader with highest ID')
     - describe('requestVote')
       - it('should accept vote from valid candidate')
       - it('should reject vote from invalid candidate')
     - describe('becomeLeader')
       - it('should set state to LEADER')
     - describe('becomeFollower')
       - it('should set state to FOLLOWER')
```

### ✅ tests/core/failover.test.ts

```
Test cases:
  1. describe('FailoverManager')
     - describe('detectFailure')
       - it('should detect failed node')
       - it('should not detect healthy node')
     - describe('triggerFailover')
       - it('should remove failed node')
       - it('should start election if primary fails')
     - describe('promoteReplica')
       - it('should promote replica to primary')
     - describe('handleRecovery')
       - it('should sync data from primary')
       - it('should add recovered node as replica')
```

---

## Kết quả

```
Test Suites: 3 passed, 3 total
Tests:       46 passed, 46 total (Module 4 only)
Total:       172 passed, 11 suites (toàn bộ project)
```

## Changelog

```
2026-08-21: Tạo file tasks
2026-08-22: Hoàn thành Module 4
  - Tạo src/core/cluster.ts: ClusterManager (Singleton) với heartbeat
  - Tạo src/core/election.ts: ElectionManager (Simplified Bully)
  - Tazo src/core/failover.ts: FailoverManager với failure detection
  - Tạo 3 test files: 46 tests cho module 4
```

---

## Commit message dự kiến

```
feat(core): add cluster management, election, and failover

- Add src/core/cluster.ts: ClusterManager (Singleton)
- Add src/core/election.ts: ElectionManager (Bully algorithm)
- Add src/core/failover.ts: FailoverManager
- Add tests/core/cluster.test.ts
- Add tests/core/election.test.ts
- Add tests/core/failover.test.ts

ClusterManager: manages nodes, routing, heartbeat
ElectionManager: leader election with vote request/response
FailoverManager: failure detection, promotion, recovery
```
