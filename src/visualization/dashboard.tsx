/**
 * Dashboard Component
 *
 * Hiển thị cluster statistics real-time với:
 *   - Total nodes
 *   - Healthy nodes
 *   - Primary node
 *   - Ring size
 *   - Node list với status
 */

import React, { useState, useEffect } from 'react';
import { ClusterManager } from '../core/cluster';
import { ClusterStats } from '../core/cluster';

/** Props cho Dashboard component */
interface DashboardProps {
  /** ClusterManager instance */
  cluster: ClusterManager;
  /** Refresh interval (ms, default: 1000) */
  refreshInterval?: number;
}

/** Styles */
const styles: Record<string, React.CSSProperties> = {
  container: {
    fontFamily: 'monospace',
    backgroundColor: '#0f172a',
    color: '#e2e8f0',
    padding: '20px',
    borderRadius: '8px',
    minWidth: '300px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#3b82f6',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },
  statCard: {
    backgroundColor: '#1e293b',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  statLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#f1f5f9',
  },
  nodeList: {
    backgroundColor: '#1e293b',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #334155',
  },
  nodeListTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#94a3b8',
  },
  nodeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #334155',
  },
  nodeId: {
    fontSize: '12px',
    color: '#e2e8f0',
  },
  nodeStatus: {
    fontSize: '11px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  statusHealthy: {
    backgroundColor: '#166534',
    color: '#86efac',
  },
  statusUnhealthy: {
    backgroundColor: '#991b1b',
    color: '#fca5a5',
  },
  statusPrimary: {
    backgroundColor: '#1e40af',
    color: '#93c5fd',
  },
};

/**
 * Dashboard Component
 */
export function Dashboard({
  cluster,
  refreshInterval = 1000,
}: DashboardProps): React.JSX.Element {
  const [stats, setStats] = useState<ClusterStats | null>(null);
  const [nodes, setNodes] = useState<{ id: string; isHealthy: boolean; isPrimary: boolean }[]>([]);

  /**
   * Refresh stats
   */
  useEffect(() => {
    const refresh = () => {
      const newStats = cluster.getStats();
      setStats(newStats);

      // Lấy danh sách nodes
      const allNodes = cluster.getAllNodes();
      const primary = cluster.getPrimary();
      const nodeList = allNodes.map((node) => ({
        id: node.id,
        isHealthy: cluster.isHealthy(node.id),
        isPrimary: primary?.id === node.id,
      }));
      setNodes(nodeList);
    };

    // Refresh ngay lập tức
    refresh();

    // Refresh mỗi interval
    const interval = setInterval(refresh, refreshInterval);

    return () => clearInterval(interval);
  }, [cluster, refreshInterval]);

  return (
    <div style={styles.container}>
      <div style={styles.title}>⚡ Cluster Dashboard</div>

      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Total Nodes</div>
            <div style={styles.statValue}>{stats.totalNodes}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Healthy</div>
            <div style={styles.statValue}>{stats.healthyNodes}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Primary</div>
            <div style={styles.statValue}>{stats.primaryId ?? 'None'}</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statLabel}>Ring Size</div>
            <div style={styles.statValue}>{stats.ringSize}</div>
          </div>
        </div>
      )}

      <div style={styles.nodeList}>
        <div style={styles.nodeListTitle}>Nodes</div>
        {nodes.length === 0 && (
          <div style={{ color: '#64748b', fontSize: '12px' }}>No nodes</div>
        )}
        {nodes.map((node) => (
          <div key={node.id} style={styles.nodeItem}>
            <span style={styles.nodeId}>{node.id}</span>
            <span
              style={{
                ...styles.nodeStatus,
                ...(node.isPrimary
                  ? styles.statusPrimary
                  : node.isHealthy
                  ? styles.statusHealthy
                  : styles.statusUnhealthy),
              }}
            >
              {node.isPrimary ? 'PRIMARY' : node.isHealthy ? 'HEALTHY' : 'DOWN'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
