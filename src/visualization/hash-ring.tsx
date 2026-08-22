/**
 * Hash Ring Visualization Component
 *
 * Renders hash ring lên Canvas với:
 *   - Circular ring representing the hash space
 *   - Nodes positioned on the ring
 *   - Interactive node selection
 *   - Labels cho mỗi node
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { CacheNode } from '../core/node';

/** Props cho HashRing component */
interface HashRingProps {
  /** Danh sách nodes trong cluster */
  nodes: CacheNode[];
  /** Node đang được chọn */
  selectedNode?: string;
  /** Callback khi click vào node */
  onNodeClick?: (nodeId: string) => void;
  /** Chiều rộng canvas (default: 500) */
  width?: number;
  /** Chiều cao canvas (default: 500) */
  height?: number;
}

/** Colors */
const COLORS = {
  ring: '#334155',
  ringBorder: '#64748b',
  node: '#3b82f6',
  nodeSelected: '#ef4444',
  nodeHover: '#60a5fa',
  label: '#e2e8f0',
  background: '#0f172a',
};

/**
 * Hash Ring Component
 */
export function HashRing({
  nodes,
  selectedNode,
  onNodeClick,
  width = 500,
  height = 500,
}: HashRingProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Vẽ hash ring
   */
  const drawRing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    // Vẽ ring
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = COLORS.ringBorder;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vẽ ring fill
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.ring;
    ctx.fill();

    // Vẽ nodes trên ring
    const angleStep = nodes.length > 0 ? (Math.PI * 2) / nodes.length : 0;

    nodes.forEach((node, index) => {
      const angle = angleStep * index - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      const isSelected = node.id === selectedNode;
      const nodeRadius = isSelected ? 14 : 10;

      // Node circle
      ctx.beginPath();
      ctx.arc(x, y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? COLORS.nodeSelected : COLORS.node;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node label
      ctx.fillStyle = COLORS.label;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Position label ngoài ring
      const labelRadius = radius + 30;
      const labelX = centerX + labelRadius * Math.cos(angle);
      const labelY = centerY + labelRadius * Math.sin(angle);

      ctx.fillText(node.id, labelX, labelY);
    });

    // Title
    ctx.fillStyle = COLORS.label;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Consistent Hash Ring', centerX, 30);

    // Stats
    ctx.font = '12px monospace';
    ctx.fillText(`Nodes: ${nodes.length}`, centerX, height - 20);
  }, [nodes, selectedNode, width, height]);

  /**
   * Redraw khi nodes thay đổi
   */
  useEffect(() => {
    drawRing();
  }, [drawRing]);

  /**
   * Xử lý click trên canvas
   */
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onNodeClick || nodes.length === 0) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;

      // Tìm node gần nhất
      const angleStep = (Math.PI * 2) / nodes.length;
      let foundNode: CacheNode | undefined;
      let closestDistance = Infinity;

      for (const node of nodes) {
        const index = nodes.indexOf(node);
        const angle = angleStep * index - Math.PI / 2;
        const nodeX = centerX + radius * Math.cos(angle);
        const nodeY = centerY + radius * Math.sin(angle);

        const distance = Math.sqrt(
          Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2)
        );

        if (distance < closestDistance && distance < 30) {
          closestDistance = distance;
          foundNode = node;
        }
      }

      if (foundNode) {
        onNodeClick(foundNode.id);
      }
    },
    [nodes, onNodeClick, width, height]
  );

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{ cursor: onNodeClick ? 'pointer' : 'default' }}
    />
  );
}

export default HashRing;
