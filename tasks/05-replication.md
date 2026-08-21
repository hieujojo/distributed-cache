# Tasks 05: Replication

> Module 5: Data replication + sync

---

## Mục tiêu

Implement data replication giữa primary và replicas.

---

## Dependencies

```
Không cần cài thêm
```

---

## Files sẽ tạo

### ⬜ src/core/replication.ts

```
Mục đích: Quản lý replication data giữa nodes

Sẽ tạo:
  - import { CacheNode, Value } from './types'
  - import { ClusterManager } from './cluster'

  - Type ReplicationMode = 'sync' | 'async' | 'hybrid'

  - Interface ReplicationConfig:
    - factor: number (default: 3)
    - mode: ReplicationMode (default: 'hybrid')
    - syncTimeout: number (default: 5000)

  Class ReplicationManager:
    Private config: ReplicationConfig
    Private cluster: ClusterManager
    Private replicationLag: number
    Private replicatedKeys: Set<string>

    Constructor(config: ReplicationConfig, cluster: ClusterManager):
      - this.config = config
      - this.cluster = cluster
      - this.replicatedKeys = new Set()

    async replicate(key: string, value: Value): Promise<void>:
      - Lấy primary từ cluster
      - Lấy replicas (factor - 1 nodes)
      - Switch theo config.mode:
        - 'sync': Đợi TẤT CẢ replicas ack
        - 'async': Gửi không đợi, ack ngay
        - 'hybrid': Đợi 1 replica, async với còn lại
      - Update replicatedKeys

    async syncFromLeader(leader: CacheNode): Promise<void>:
      - Lấy tất cả keys từ leader
      - Với mỗi key: leader.get(key) → local.set(key, value)
      - Update replicationLag

    getReplicas(key: string): CacheNode[]:
      - Lấy primary node chứa key
      - Lấy N nodes tiếp theo theo consistent hash
      - Return mảng replicas

    getReplicationLag(): number:
      - Return replicationLag

    getReplicatedKeys(): number:
      - Return replicatedKeys.size

    Private async syncToReplica(replica: CacheNode, key: string, value: Value): Promise<boolean>:
      - Gửi REPLICATE command đến replica
      - Đợi response (với timeout)
      - Return true/false

Tham chiếu:
  - CacheNode từ './types'
  - Value từ './types'
  - ClusterManager từ './cluster'

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

### ⬜ tests/core/replication.test.ts

```
Test cases:
  1. describe('ReplicationManager')
     - describe('replicate')
       - it('should replicate to sync replicas')
       - it('should replicate to async replicas')
       - it('should replicate to hybrid replicas')
       - it('should handle replica failure')
     - describe('syncFromLeader')
       - it('should sync all keys from leader')
       - it('should handle partial sync')
     - describe('getReplicas')
       - it('should return correct replicas')
     - describe('getReplicationLag')
       - it('should return lag measurement')
     - describe('getReplicatedKeys')
       - it('should return replicated keys count')
```

---

## Changelog

```
2026-08-21: Tạo file tasks
```

---

## Commit message dự kiến

```
feat(core): add data replication manager

- Add src/core/replication.ts: ReplicationManager
- Add tests/core/replication.test.ts

ReplicationManager supports:
  - Sync replication: wait for all replicas
  - Async replication: fire and forget
  - Hybrid replication: wait for 1, async rest
  - Sync from leader after recovery
  - Replication lag measurement
```
