/**
 * Election Manager - Leader Election khi primary dies
 *
 * Simplified Bully Algorithm:
 *   1. Khi primary die → node có ID lớn nhất trong healthy nodes trở thành leader
 *   2. Nếu tie → chọn node đầu tiên (theo thứ tự ID)
 *
 * Trong thực tế, Bully algorithm cần network calls giữa các nodes.
 * Ở đây我们 simulate bằng cách chạy trên 1 process duy nhất.
 */

import { ClusterManager } from './cluster';

/** Trạng thái của node trong election */
export type NodeState = 'FOLLOWER' | 'CANDIDATE' | 'LEADER';

/** Kết quả election */
export interface ElectionResult {
  winnerId: string;
  votes: Map<string, string>;
  duration: number;
}

/**
 * ElectionManager - Xử lý leader election
 */
export class ElectionManager {
  private cluster: ClusterManager;
  private state: NodeState;
  private leaderId: string | null;
  private votes: Map<string, string>;
  private electionInProgress: boolean;

  constructor(cluster: ClusterManager) {
    this.cluster = cluster;
    this.state = 'FOLLOWER';
    this.leaderId = null;
    this.votes = new Map();
    this.electionInProgress = false;
  }

  /**
   * Bắt đầu election
   *
   * Simplified: node có ID lớn nhất trong healthy nodes thắng
   * @returns ElectionResult
   */
  async startElection(): Promise<ElectionResult> {
    if (this.electionInProgress) {
      throw new Error('Election already in progress');
    }

    this.electionInProgress = true;
    this.state = 'CANDIDATE';
    this.votes = new Map();
    const startTime = Date.now();

    try {
      // Lấy tất cả healthy nodes
      const healthyNodes = this.cluster.getHealthyNodes();

      if (healthyNodes.length === 0) {
        throw new Error('No healthy nodes available for election');
      }

      // Simplified Bully: node có ID lớn nhất thắng
      // Trong thực tế, mỗi node sẽ REQUEST_VOTE đến nodes có ID lớn hơn
      let winner = healthyNodes[0];
      for (const node of healthyNodes) {
        if (node.id > winner.id) {
          winner = node;
        }
      }

      // Simulate voting: mỗi node bầu cho winner
      for (const node of healthyNodes) {
        this.votes.set(node.id, winner.id);
      }

      // Winner trở thành leader
      this.leaderId = winner.id;
      this.state = 'LEADER';
      this.cluster.setPrimary(winner);

      const duration = Date.now() - startTime;

      return {
        winnerId: winner.id,
        votes: new Map(this.votes),
        duration,
      };
    } finally {
      this.electionInProgress = false;
    }
  }

  /**
   * Xử lý vote request từ candidate
   *
   * @param candidateId - ID của candidate gửi request
   * @param currentLeaderId - ID của leader hiện tại (nếu có)
   * @returns true nếu accept vote
   */
  handleVoteRequest(_candidateId: string, currentLeaderId: string | null): boolean {
    // Nếu đã có leader và leader vẫn healthy → reject
    if (currentLeaderId) {
      const leader = this.cluster.getNodeById(currentLeaderId);
      if (leader && this.cluster.isHealthy(currentLeaderId)) {
        return false;
      }
    }

    // Nếu là FOLLOWER và chưa vote → accept
    if (this.state === 'FOLLOWER') {
      return true;
    }

    // Nếu là CANDIDATE → so sánh ID (higher ID wins)
    if (this.state === 'CANDIDATE') {
      // Không implement chi tiết vì simplified
      return false;
    }

    return false;
  }

  /**
   * Trở thành leader
   */
  becomeLeader(leaderId: string): void {
    this.state = 'LEADER';
    this.leaderId = leaderId;
  }

  /**
   * Trở thành follower
   */
  becomeFollower(leaderId: string | null): void {
    this.state = 'FOLLOWER';
    this.leaderId = leaderId;
  }

  /**
   * Lấy trạng thái hiện tại
   */
  getState(): NodeState {
    return this.state;
  }

  /**
   * Lấy leader ID
   */
  getLeaderId(): string | null {
    return this.leaderId;
  }

  /**
   * Kiểm tra có đang election không
   */
  isElectionInProgress(): boolean {
    return this.electionInProgress;
  }

  /**
   * Lấy kết quả vote
   */
  getVotes(): Map<string, string> {
    return new Map(this.votes);
  }
}
