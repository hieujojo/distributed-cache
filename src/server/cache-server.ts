/**
 * Cache Server - TCP server nhận requests từ clients
 *
 * Xử lý: GET, SET, DEL, PING
 * Routes requests đến CacheNode dựa trên consistent hashing
 */

import * as net from 'net';
import { CacheNode } from '../core/node';
import { ConsistentHash } from '../core/consistent-hashing';
import {
  parseRequest,
  serializeResponse,
  CacheRequest,
  CacheResponse,
} from './protocol';

/** Server configuration */
export interface ServerConfig {
  host: string;
  port: number;
  heartbeatInterval?: number;
  heartbeatTimeout?: number;
}

/**
 * CacheServer - TCP server cho distributed cache
 */
export class CacheServer {
  private server: net.Server | null;
  private config: ServerConfig;
  private nodes: Map<string, CacheNode>;
  private consistentHash: ConsistentHash;
  private _isRunning: boolean;
  private connections: Set<net.Socket>;

  constructor(config: ServerConfig) {
    this.config = {
      heartbeatInterval: 5000,
      heartbeatTimeout: 15000,
      ...config,
    };
    this.server = null;
    this.nodes = new Map();
    this.consistentHash = new ConsistentHash();
    this._isRunning = false;
    this.connections = new Set();
  }

  /**
   * Thêm cache node vào server
   * @param node - CacheNode cần thêm
   */
  addNode(node: CacheNode): void {
    this.nodes.set(node.id, node);
    this.consistentHash.addNode({ id: node.id });
  }

  /**
   * Xóa cache node khỏi server
   * @param nodeId - ID của node cần xóa
   */
  removeNode(nodeId: string): void {
    this.nodes.delete(nodeId);
    this.consistentHash.removeNode(nodeId);
  }

  /**
   * Lấy node chịu trách nhiệm cho key
   * @param key - Key cần tìm node
   * @returns CacheNode hoặc null
   */
  getNodeForKey(key: string): CacheNode | null {
    const hashNode = this.consistentHash.getNode(key);
    if (!hashNode) return null;
    return this.nodes.get(hashNode.id) ?? null;
  }

  /**
   * Start TCP server
   * @returns Promise resolve khi server ready
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        this.handleConnection(socket);
      });

      this.server.on('error', (err) => {
        this._isRunning = false;
        reject(err);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        this._isRunning = true;
        resolve();
      });
    });
  }

  /**
   * Stop TCP server
   * @returns Promise resolve khi server closed
   */
  stop(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.server) {
        this._isRunning = false;
        resolve();
        return;
      }

      // Đóng tất cả connections trước
      for (const conn of this.connections) {
        conn.destroy();
      }
      this.connections.clear();

      this.server.close(() => {
        this._isRunning = false;
        this.server = null;
        resolve();
      });
    });
  }

  /**
   * Server có đang chạy không
   */
  isRunning(): boolean {
    return this._isRunning;
  }

  /**
   * Xử lý kết nối từ client
   */
  private handleConnection(socket: net.Socket): void {
    this.connections.add(socket);
    let buffer = '';

    socket.on('data', async (data) => {
      buffer += data.toString();

      // Xử lý từng request (separator: \r\n)
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.substring(0, newlineIndex);
        buffer = buffer.substring(newlineIndex + 2);

        if (!line) continue;

        try {
          const request = parseRequest(Buffer.from(line));
          const response = await this.processRequest(request);
          socket.write(serializeResponse(response));
        } catch (err) {
          const errorResponse: CacheResponse = {
            type: 'ERROR',
            message: err instanceof Error ? err.message : 'Unknown error',
          };
          socket.write(serializeResponse(errorResponse));
        }
      }
    });

    socket.on('error', () => {
      // Client ngắt kết nối — không cần log
    });

    socket.on('close', () => {
      this.connections.delete(socket);
    });
  }

  /**
   * Xử lý request và trả về response
   */
  private async processRequest(request: CacheRequest): Promise<CacheResponse> {
    switch (request.type) {
      case 'GET': {
        const node = this.getNodeForKey(request.key!);
        if (!node) {
          return { type: 'ERROR', message: 'No node available' };
        }
        const value = node.get(request.key!);
        if (value === null) {
          return { type: 'NULL' };
        }
        return { type: 'VALUE', value };
      }

      case 'SET': {
        const node = this.getNodeForKey(request.key!);
        if (!node) {
          return { type: 'ERROR', message: 'No node available' };
        }
        node.set(request.key!, request.value!, request.ttl);
        return { type: 'OK' };
      }

      case 'DEL': {
        const node = this.getNodeForKey(request.key!);
        if (!node) {
          return { type: 'ERROR', message: 'No node available' };
        }
        const deleted = node.delete(request.key!);
        return deleted ? { type: 'OK' } : { type: 'NULL' };
      }

      case 'PING': {
        return { type: 'PONG' };
      }

      default:
        return { type: 'ERROR', message: `Unsupported command: ${request.type}` };
    }
  }
}
