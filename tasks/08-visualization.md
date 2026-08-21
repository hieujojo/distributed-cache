# Tasks 08: Visualization

> Module 8: Hash ring visualization + dashboard

---

## Mục tiêu

Implement React components để visualize hash ring và dashboard.

---

## Dependencies

```
Cần cài:
  npm install react react-dom
  npm install --save-dev @types/react @types/react-dom
```

---

## Files sẽ tạo

### ⬜ src/visualization/hash-ring.tsx

```
Mục đích: Render hash ring lên Canvas

Sẽ tạo:
  - import React, { useRef, useEffect } from 'react'
  - import { CacheNode } from '../core/types'

  - Interface HashRingProps:
    - nodes: CacheNode[]
    - selectedNode?: string
    - onNodeClick?: (nodeId: string) => void

  function HashRing(props: HashRingProps): JSX.Element:
    - canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
      - Vẽ hash ring khi nodes thay đổi
      - drawRing(canvas, nodes, selectedNode)
    }, [nodes, selectedNode])

    const handleClick = (e) => {
      - Tính position click trên canvas
      - Tìm node gần nhất
      - Gọi onNodeClick nếu có
    }

    Return:
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onClick={handleClick}
      />

  Private function drawRing(
    canvas: HTMLCanvasElement,
    nodes: CacheNode[],
    selectedNode?: string
  ):
    - Clear canvas
    - Vẽ ring (circle)
    - Với mỗi node:
      - Tính position trên ring
      - Vẽ node circle
      - Nếu selected → highlight
    - Vẽ labels

Tham chiếu:
  - React
  - CacheNode từ '../core/types'

Sửa đổi: Không (file mới)
```

### ⬜ src/visualization/dashboard.tsx

```
Mục đích: Hiển thị cluster statistics

Sẽ tạo:
  - import React, { useState, useEffect } from 'react'
  - import { ClusterManager } from '../core/cluster'

  - Interface DashboardProps:
    - cluster: ClusterManager
    - refreshInterval?: number (default: 1000)

  function Dashboard(props: DashboardProps): JSX.Element:
    - const [stats, setStats] = useState(null)

    useEffect(() => {
      - interval = setInterval(() => {
          - setStats(cluster.getStats())
        }, refreshInterval)
      - return () => clearInterval(interval)
    }, [])

    Return:
      <div className="dashboard">
        <h2>Cluster Dashboard</h2>
        <div className="stats">
          <div>Total Nodes: {stats?.totalNodes}</div>
          <div>Healthy Nodes: {stats?.healthyNodes}</div>
          <div>Primary: {stats?.primaryId}</div>
          <div>Ring Size: {stats?.ringSize}</div>
        </div>
      </div>

Tham chiếu:
  - React
  - ClusterManager từ '../core/cluster'

Sửa đổi: Không (file mới)
```

### ⬜ src/visualization/server.ts

```
Mục đích: Dev server cho visualization

Sẽ tạo:
  - Simple HTTP server để serve visualization
  - Proxy requests đến cache server

  Function startVizServer(port: number):
    - Tạo HTTP server
    - Serve static files từ dist/
    - Proxy /api/* đến cache server
    - Listen trên port

Tham chiếu: Không

Sửa đổi: Không (file mới)
```

---

## Tests sẽ tạo

```
Visualization thường không cần unit tests
Có thể test render output nếu cần
```

---

## Changelog

```
2026-08-21: Tạo file tasks
```

---

## Commit message dự kiến

```
feat(vis): add hash ring visualization and dashboard

- Add src/visualization/hash-ring.tsx: Canvas hash ring renderer
- Add src/visualization/dashboard.tsx: Cluster stats dashboard
- Add src/visualization/server.ts: Dev server

Visualization features:
  - Interactive hash ring with node selection
  - Real-time cluster statistics
  - Canvas-based rendering for performance
```
