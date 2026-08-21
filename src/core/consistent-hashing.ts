/**
 * Consistent Hashing implementation với virtual nodes
 */

import { murmurHash, sortedInsert, sortedRemove } from './hash-helpers';
import { HashConfig } from './types';

/**
 * Cache node interface cho consistent hashing
 */
export interface HashNode {
  id: string;
}

/**
 * Consistent Hash Ring
 */
export class ConsistentHash {
  private virtualNodes: number;
  private ring: Map<number, HashNode>;
  private sortedPositions: number[];
  private nodeMap: Map<string, HashNode>;

  constructor(config?: Partial<HashConfig>) {
    this.virtualNodes = config?.virtualNodes ?? 150;
    this.ring = new Map();
    this.sortedPositions = [];
    this.nodeMap = new Map();
  }

  /**
   * Tìm node chịu trách nhiệm cho key
   * @param key - Key cần tìm node
   * @returns Node chịu trách nhiệm, hoặc null nếu ring rỗng
   */
  getNode(key: string): HashNode | null {
    if (this.sortedPositions.length === 0) {
      return null;
    }

    const hash = this.hashKey(key);
    const position = this.binarySearch(hash);
    const pos = this.sortedPositions[position];

    return this.ring.get(pos) ?? null;
  }

  /**
   * Thêm node vào ring
   * @param node - Node cần thêm
   */
  addNode(node: HashNode): void {
    this.nodeMap.set(node.id, node);

    for (let i = 0; i < this.virtualNodes; i++) {
      const pos = this.hashKey(`${node.id}:${i}`);
      sortedInsert(this.sortedPositions, pos);
      this.ring.set(pos, node);
    }
  }

  /**
   * Xóa node khỏi ring
   * @param nodeId - ID của node cần xóa
   */
  removeNode(nodeId: string): void {
    const node = this.nodeMap.get(nodeId);
    if (!node) return;

    for (let i = 0; i < this.virtualNodes; i++) {
      const pos = this.hashKey(`${nodeId}:${i}`);
      this.ring.delete(pos);
      sortedRemove(this.sortedPositions, pos);
    }

    this.nodeMap.delete(nodeId);
  }

  /**
   * Lấy thống kê phân phối keys
   * @returns Map<nodeId, count>
   */
  getKeyDistribution(): Map<string, number> {
    const distribution = new Map<string, number>();

    for (const node of this.nodeMap.values()) {
      distribution.set(node.id, 0);
    }

    return distribution;
  }

  /**
   * Số lượng positions trên ring
   */
  getRingSize(): number {
    return this.sortedPositions.length;
  }

  /**
   * Kiểm tra node có tồn tại không
   * @param nodeId - ID của node
   */
  hasNode(nodeId: string): boolean {
    return this.nodeMap.has(nodeId);
  }

  /**
   * Lấy tất cả nodes
   */
  getNodes(): HashNode[] {
    return Array.from(this.nodeMap.values());
  }

  /**
   * Hash key thành position trên ring
   */
  private hashKey(key: string): number {
    return murmurHash(key);
  }

  /**
   * Binary search tìm position đầu tiên >= hash
   * O(log N)
   */
  private binarySearch(hash: number): number {
    if (this.sortedPositions.length === 0) {
      return 0;
    }

    let low = 0;
    let high = this.sortedPositions.length;

    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.sortedPositions[mid] < hash) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    // Wrap về 0 nếu hash lớn hơn tất cả positions
    return low % this.sortedPositions.length;
  }
}
