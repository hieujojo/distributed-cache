# Diagrams — Sơ đồ minh họa

> Các sơ đồ use case, relationship, và flow diagrams.

---

## Mục lục

1. [System Overview](#1-system-overview)
2. [Use Case Diagram](#2-use-case-diagram)
3. [Class Relationship](#3-class-relationship)
4. [Data Flow](#4-data-flow)
5. [State Diagram](#5-state-diagram)
6. [Sequence Diagram](#6-sequence-diagram)

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Distributed Cache System                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Client    │    │   Client    │    │   Client    │     │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                            ▼                                 │
│                   ┌─────────────────┐                        │
│                   │   API Gateway   │                        │
│                   │   (TCP Server)  │                        │
│                   └────────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│         ▼                  ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Node 1    │◄──►│   Node 2    │◄──►│   Node 3    │     │
│  │  (Primary)  │    │  (Replica)  │    │  (Replica)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                            ▼                                 │
│                   ┌─────────────────┐                        │
│                   │  Hash Ring      │                        │
│                   │  (Consistent)   │                        │
│                   └─────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Use Case Diagram

```
                    ┌─────────────────────────────────────┐
                    │      Distributed Cache System        │
                    │                                     │
   ┌────────┐      │  ┌─────────────────────────────┐    │
   │ Client │──────┼─►│       Set Key-Value          │    │
   │        │──────┼─►│       GET Key                │    │
   │        │──────┼─►│       Delete Key             │    │
   └────────┘      │  └─────────────────────────────┘    │
                    │                                     │
   ┌────────┐      │  ┌─────────────────────────────┐    │
   │  Admin │──────┼─►│       Monitor Cluster        │    │
   │        │──────┼─►│       Add/Remove Node        │    │
   │        │──────┼─►│       View Statistics        │    │
   └────────┘      │  └─────────────────────────────┘    │
                    │                                     │
   ┌────────┐      │  ┌─────────────────────────────┐    │
   │ System │──────┼─►│       Heartbeat Detection    │    │
   │        │──────┼─►│       Leader Election        │    │
   │        │──────┼─►│       Data Replication       │    │
   └────────┘      │  └─────────────────────────────┘    │
                    │                                     │
                    └─────────────────────────────────────┘
```

### Actor Descriptions

| Actor | Mô tả | Permissions |
|---|---|---|
| **Client** | Ứng dụng gọi cache service | GET, SET, DEL |
| **Admin** | Quản trị viên hệ thống | Monitor, Add/Remove nodes |
| **System** | Tự động hệ thống | Heartbeat, Election, Replication |

---

## 3. Class Relationship

```
┌──────────────────┐         ┌──────────────────┐
│  ClusterManager  │────────►│  ConsistentHash   │
│  (Singleton)     │         │  (Strategy Pattern)│
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ manages                    │ uses
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│    CacheNode     │────────►│ EvictionStrategy  │
│                  │         │  (Interface)      │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │ contains                   │ implemented by
         │                            │
         ▼                            ▼
┌──────────────────┐         ┌──────────────────┐
│  CacheEntry      │         │  LRUStrategy     │
│  (key, value,    │         │  LFUStrategy     │
│   ttl, metadata) │         │  FIFOStrategy    │
└──────────────────┘         └──────────────────┘
         │
         │ managed by
         │
         ▼
┌──────────────────┐         ┌──────────────────┐
│ ReplicationMgr   │────────►│   TCPAdapter     │
│ (Observer Pattern)│        │  (Adapter Pattern)│
└──────────────────┘         └────────┬─────────┘
                                      │
                                      │ wraps
                                      │
                                      ▼
                             ┌──────────────────┐
                             │   TCPServer      │
                             └──────────────────┘
```

### Relationships

| Relationship | Type | Mô tả |
|---|---|---|
| ClusterManager → ConsistentHash | Uses | ClusterManager dùng ConsistentHash để route requests |
| CacheNode → EvictionStrategy | Implements | CacheNode dùng strategy để evict data |
| CacheNode → CacheEntry | Contains | CacheNode chứa nhiều CacheEntry |
| ReplicationMgr → TCPAdapter | Uses | ReplicationMgr dùng TCPAdapter để sync data |
| TCPAdapter → TCPServer | Wraps | TCPAdapter wrap TCPServer |

---

## 4. Data Flow

### 4.1 Read Flow

```
Client                Cluster               Hash Ring           CacheNode
  │                     │                      │                   │
  │── GET user:123 ────→│                      │                   │
  │                     │                      │                   │
  │                     │── hash("user:123") ──→│                   │
  │                     │                      │                   │
  │                     │                      │── find node ─────→│
  │                     │                      │                   │
  │                     │                      │←──────────────────│
  │                     │                      │                   │
  │                     │── route to node ─────────────────────────→│
  │                     │                      │                   │
  │                     │                      │    check memory    │
  │                     │                      │    check TTL       │
  │                     │                      │                   │
  │                     │←── return value ─────────────────────────│
  │←── return value ────│                      │                   │
```

### 4.2 Write Flow

```
Client                Cluster               Hash Ring           CacheNode
  │                     │                      │                   │
  │── SET user:123 ────→│                      │                   │
  │   "John"            │                      │                   │
  │                     │                      │                   │
  │                     │── hash("user:123") ──→│                   │
  │                     │                      │                   │
  │                     │                      │── find node ─────→│
  │                     │                      │                   │
  │                     │←─────────────────────│                   │
  │                     │                      │                   │
  │                     │── route to node ─────────────────────────→│
  │                     │                      │                   │
  │                     │                      │    store in memory │
  │                     │                      │    apply TTL      │
  │                     │                      │                   │
  │                     │                      │    replicate ─────→│ (replica)
  │                     │                      │                   │
  │                     │←── ack ──────────────────────────────────│
  │←── ack ─────────────│                      │                   │
```

### 4.3 Failover Flow

```
Primary              Replica              Cluster Manager
  │                    │                      │
  │──── heartbeat ────→│                      │
  │                    │──── heartbeat ───────→│
  │                    │                      │
  │    PRIMARY DIES!   │                      │
  │                    │                      │
  │                    │←── no heartbeat ─────│
  │                    │                      │
  │                    │── start election ────→│
  │                    │                      │
  │                    │←── you are new leader─│
  │                    │                      │
  │                    │── become primary ────→│ (update cluster state)
  │                    │                      │
  │  (recovers)        │                      │
  │                    │←── sync data ────────│ (primary sync to recovered node)
```

---

## 5. State Diagram

### 5.1 Node States

```
                    ┌───────────────┐
                    │   CREATED     │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
            ┌──────│   STARTING    │──────┐
            │      └───────┬───────┘      │
            │              │              │
            │              ▼              │
            │      ┌───────────────┐      │
            │      │   RUNNING     │      │
            │      └───────┬───────┘      │
            │              │              │
            │              ▼              │
            │      ┌───────────────┐      │
            │      │  HEALTHY      │      │
            │      └───────┬───────┘      │
            │              │              │
            │              ▼              │
            │      ┌───────────────┐      │
            │      │  UNHEALTHY    │      │
            │      └───────┬───────┘      │
            │              │              │
            │              ▼              │
            │      ┌───────────────┐      │
            └─────►│   STOPPING    │◄─────┘
                   └───────┬───────┘
                           │
                           ▼
                   ┌───────────────┐
                   │    STOPPED    │
                   └───────────────┘
```

### 5.2 Key States

```
                    ┌───────────────┐
                    │   NOT CACHED  │
                    └───────┬───────┘
                            │
                            ▼ SET
                    ┌───────────────┐
                    │    CACHED     │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │  TTL EXPIRED  │ │  EVICTED     │ │   DELETED     │
      └───────┬───────┘ └───────┬───────┘ └───────┬───────┘
              │                 │                 │
              └─────────────────┼─────────────────┘
                                │
                                ▼
                    ┌───────────────┐
                    │   NOT CACHED  │
                    └───────────────┘
```

### 5.3 Cluster States

```
                    ┌───────────────┐
                    │    SINGLE     │ (1 node)
                    └───────┬───────┘
                            │
                            ▼ Add node
                    ┌───────────────┐
                    │   DEGRADED    │ (2 nodes, no quorum)
                    └───────┬───────┘
                            │
                            ▼ Add node
                    ┌───────────────┐
                    │   HEALTHY     │ (3+ nodes, quorum)
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
      ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
      │   PARTITION   │ │   DEGRADED    │ │   FAILED      │
      │ (split brain) │ │ (node down)   │ │ (quorum lost) │
      └───────────────┘ └───────────────┘ └───────────────┘
```

---

## 6. Sequence Diagram

### 6.1 Client Read

```
Client          ClusterManager     ConsistentHash     CacheNode
  │                  │                  │                 │
  │── GET key ──────→│                  │                 │
  │                  │                  │                 │
  │                  │── getNode(key) ──→│                 │
  │                  │                  │                 │
  │                  │                  │── find(node) ──→│
  │                  │                  │                 │
  │                  │                  │←── node ────────│
  │                  │                  │                 │
  │                  │←── node ─────────│                 │
  │                  │                  │                 │
  │                  │── get(key) ───────────────────────→│
  │                  │                  │                 │
  │                  │                  │    check TTL    │
  │                  │                  │                 │
  │                  │                  │    check memory │
  │                  │                  │                 │
  │                  │←── value ──────────────────────────│
  │                  │                  │                 │
  │←── value ────────│                  │                 │
```

### 6.2 Leader Election

```
NodeA              NodeB              NodeC             ClusterMgr
  │                  │                  │                  │
  │    (Primary dies)│                  │                  │
  │                  │                  │                  │
  │←── heartbeat ────│                  │                  │
  │   timeout!       │                  │                  │
  │                  │                  │                  │
  │── ELECTION ─────→│                  │                  │
  │                  │                  │                  │
  │── ELECTION ────────────────────────→│                  │
  │                  │                  │                  │
  │                  │── I_AM_ALIVE ───→│                  │
  │                  │                  │                  │
  │←── I_AM_ALIVE ───│                  │                  │
  │                  │                  │                  │
  │    (NodeB wins)  │                  │                  │
  │                  │                  │                  │
  │                  │── NEW_LEADER ──────────────────────→│
  │                  │                  │                  │
  │                  │                  │                  │── update state
  │                  │                  │                  │
  │                  │←── ACK ────────────────────────────│
```

---

## Tóm tắt

| Diagram | Mục đích | Khi nào xem |
|---|---|---|
| **System Overview** | Tổng quan kiến trúc | Lúc đầu |
| **Use Case** | Actors và permissions | Khi thiết kế API |
| **Class Relationship** | Các class kết nối thế nào | Khi viết code |
| **Data Flow** | Data di chuyển thế nào | Khi debug |
| **State Diagram** | Các trạng thái có thể có | Khi handle edge cases |
| **Sequence Diagram** | Interaction theo thời gian | Khi hiểu flow phức tạp |
