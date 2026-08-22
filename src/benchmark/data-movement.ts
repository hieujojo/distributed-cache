/**
 * Data Movement Benchmark - Đo % keys bị di chuyển khi thêm node mới
 *
 * Measures:
 *   - Số keys trước/sau khi thêm node
 *   - Số keys bị di chuyển
 *   - Percentage keys bị di chuyển
 *
 * Lý do quan trọng:
 *   - Redis Cluster: ~100% keys di chuyển (hash mod N)
 *   - Consistent Hashing: ~1/N keys di chuyển (ideal)
 */

import { ConsistentHash } from '../core/consistent-hashing';
import { HashNode } from '../core/consistent-hashing';

/** Kết quả data movement benchmark */
export interface MovementResult {
  /** Số keys trước khi thêm node */
  keysBefore: number;
  /** Số keys sau khi thêm node */
  keysAfter: number;
  /** Số keys bị di chuyển */
  keysMoved: number;
  /** Percentage keys bị di chuyển */
  percentageMoved: number;
  /** Node IDs trước khi thêm */
  nodeIdsBefore: string[];
  /** Node IDs sau khi thêm */
  nodeIdsAfter: string[];
}

/**
 * Benchmark data movement khi thêm node mới vào ring
 * @param ring - ConsistentHash ring hiện tại
 * @param keys - Các keys cần track
 * @param newNode - Node mới cần thêm
 * @returns MovementResult
 */
export function benchmarkDataMovement(
  ring: ConsistentHash,
  keys: string[],
  newNode: HashNode
): MovementResult {
  // Lưu node cho mỗi key trước khi thêm node mới
  const keysBefore = new Map<string, string>();
  for (const key of keys) {
    const node = ring.getNode(key);
    if (node) {
      keysBefore.set(key, node.id);
    }
  }

  // Thêm node mới vào ring
  ring.addNode(newNode);

  // Lưu node cho mỗi key sau khi thêm node mới
  const keysAfter = new Map<string, string>();
  for (const key of keys) {
    const node = ring.getNode(key);
    if (node) {
      keysAfter.set(key, node.id);
    }
  }

  // Đếm keys bị di chuyển
  let keysMoved = 0;
  for (const key of keys) {
    const nodeBefore = keysBefore.get(key);
    const nodeAfter = keysAfter.get(key);
    if (nodeBefore !== nodeAfter) {
      keysMoved++;
    }
  }

  // Tính percentage
  const percentageMoved = keys.length > 0
    ? (keysMoved / keys.length) * 100
    : 0;

  return {
    keysBefore: keysBefore.size,
    keysAfter: keysAfter.size,
    keysMoved,
    percentageMoved,
    nodeIdsBefore: [...new Set(keysBefore.values())],
    nodeIdsAfter: [...new Set(keysAfter.values())],
  };
}

/**
 * Benchmark data movement khi xóa node
 * @param ring - ConsistentHash ring hiện tại
 * @param keys - Các keys cần track
 * @param nodeId - ID node cần xóa
 * @returns MovementResult
 */
export function benchmarkDataMovementOnRemove(
  ring: ConsistentHash,
  keys: string[],
  nodeId: string
): MovementResult {
  // Lưu node cho mỗi key trước khi xóa
  const keysBefore = new Map<string, string>();
  for (const key of keys) {
    const node = ring.getNode(key);
    if (node) {
      keysBefore.set(key, node.id);
    }
  }

  // Xóa node khỏi ring
  ring.removeNode(nodeId);

  // Lưu node cho mỗi key sau khi xóa
  const keysAfter = new Map<string, string>();
  for (const key of keys) {
    const node = ring.getNode(key);
    if (node) {
      keysAfter.set(key, node.id);
    }
  }

  // Đếm keys bị di chuyển
  let keysMoved = 0;
  for (const key of keys) {
    const nodeBefore = keysBefore.get(key);
    const nodeAfter = keysAfter.get(key);
    if (nodeBefore !== nodeAfter) {
      keysMoved++;
    }
  }

  const percentageMoved = keys.length > 0
    ? (keysMoved / keys.length) * 100
    : 0;

  return {
    keysBefore: keysBefore.size,
    keysAfter: keysAfter.size,
    keysMoved,
    percentageMoved,
    nodeIdsBefore: [...new Set(keysBefore.values())],
    nodeIdsAfter: [...new Set(keysAfter.values())],
  };
}
