/**
 * Helper functions cho hashing
 */

import murmur from 'murmurhash';

/**
 * Giá trị tối đa của hash (2^32 - 1)
 */
const MAX_HASH_VALUE = 0xFFFFFFFF;

/**
 * Hash key sử dụng murmurhash v2
 * @param key - Key cần hash
 * @returns Số nguyên dương
 */
export function murmurHash(key: string): number {
  return murmur.v2(key) & MAX_HASH_VALUE;
}

/**
 * Chèn position vào sorted array
 * @param positions - Sorted array hiện tại
 * @param pos - Position cần chèn
 * @returns Index vị trí đã chèn
 */
export function sortedInsert(positions: number[], pos: number): number {
  let low = 0;
  let high = positions.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (positions[mid] < pos) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  positions.splice(low, 0, pos);
  return low;
}

/**
 * Xóa position khỏi sorted array
 * @param positions - Sorted array
 * @param pos - Position cần xóa
 * @returns Index đã xóa, hoặc -1 nếu không tìm thấy
 */
export function sortedRemove(positions: number[], pos: number): number {
  const index = positions.indexOf(pos);
  if (index !== -1) {
    positions.splice(index, 1);
  }
  return index;
}
