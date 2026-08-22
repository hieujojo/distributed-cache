/**
 * Cache Client - Gửi requests đến CacheServer qua TCP
 *
 * Hỗ trợ: connect, disconnect, get, set, del, ping
 * Có retry logic và timeout
 */

import * as net from 'net';
import { Value } from '../core/types';
import {
  serializeRequest,
  parseResponse,
  CacheResponse,
} from './protocol';

/** Client configuration */
export interface ClientConfig {
  host: string;
  port: number;
  timeout?: number;
  retries?: number;
}

/**
 * CacheClient - TCP client cho distributed cache
 */
export class CacheClient {
  private socket: net.Socket | null;
  private config: Required<ClientConfig>;
  private isConnected: boolean;
  private buffer: string;
  private pendingResolve: ((response: CacheResponse) => void) | null;
  private pendingReject: ((err: Error) => void) | null;

  constructor(config: ClientConfig) {
    this.config = {
      timeout: 5000,
      retries: 3,
      ...config,
    };
    this.socket = null;
    this.isConnected = false;
    this.buffer = '';
    this.pendingResolve = null;
    this.pendingReject = null;
  }

  /**
   * Kết nối đến server
   * @returns Promise resolve khi kết nối thành công
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        resolve();
        return;
      }

      this.socket = new net.Socket();

      const timeout = setTimeout(() => {
        this.socket?.destroy();
        reject(new Error('Connection timeout'));
      }, this.config.timeout);

      this.socket.connect(this.config.port, this.config.host, () => {
        clearTimeout(timeout);
        this.isConnected = true;
        resolve();
      });

      this.socket.on('error', (err) => {
        clearTimeout(timeout);
        this.isConnected = false;
        reject(err);
      });

      this.socket.on('close', () => {
        this.isConnected = false;
        if (this.pendingReject) {
          this.pendingReject(new Error('Connection closed'));
          this.pendingResolve = null;
          this.pendingReject = null;
        }
      });

      this.socket.on('data', (data) => {
        this.buffer += data.toString();

        // Đợi \r\n delimiter
        const newlineIndex = this.buffer.indexOf('\r\n');
        if (newlineIndex !== -1) {
          const line = this.buffer.substring(0, newlineIndex);
          this.buffer = this.buffer.substring(newlineIndex + 2);

          try {
            const response = parseResponse(Buffer.from(line));
            if (this.pendingResolve) {
              this.pendingResolve(response);
              this.pendingResolve = null;
              this.pendingReject = null;
            }
          } catch (err) {
            if (this.pendingReject) {
              this.pendingReject(err instanceof Error ? err : new Error('Parse error'));
              this.pendingResolve = null;
              this.pendingReject = null;
            }
          }
        }
      });
    });
  }

  /**
   * Ngắt kết nối
   * @returns Promise resolve khi ngắt xong
   */
  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.socket || !this.isConnected) {
        this.isConnected = false;
        resolve();
        return;
      }

      this.socket.end(() => {
        this.isConnected = false;
        this.socket = null;
        resolve();
      });
    });
  }

  /**
   * Lấy giá trị từ cache server
   * @param key - Key cần lấy
   * @returns Value hoặc null
   */
  async get(key: string): Promise<Value | null> {
    const response = await this.send({ type: 'GET', key });

    switch (response.type) {
      case 'VALUE':
        return response.value ?? null;
      case 'NULL':
        return null;
      default:
        throw new Error(response.message || 'Unexpected response');
    }
  }

  /**
   * Lưu giá trị vào cache server
   * @param key - Key
   * @param value - Giá trị
   * @param ttl - Time to live (ms)
   */
  async set(key: string, value: Value, ttl?: number): Promise<void> {
    const response = await this.send({ type: 'SET', key, value, ttl });

    if (response.type !== 'OK') {
      throw new Error(response.message || 'SET failed');
    }
  }

  /**
   * Xóa key khỏi cache server
   * @param key - Key cần xóa
   * @returns true nếu xóa thành công
   */
  async del(key: string): Promise<boolean> {
    const response = await this.send({ type: 'DEL', key });
    return response.type === 'OK';
  }

  /**
   * Ping server
   * @returns true nếu server répond
   */
  async ping(): Promise<boolean> {
    const response = await this.send({ type: 'PING' });
    return response.type === 'PONG';
  }

  /**
   * Kiểm tra client có đang kết nối không
   */
  isClientConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Gửi request và đợi response (với retry)
   */
  private async send(request: { type: string; key?: string; value?: Value; ttl?: number; nodeId?: string }): Promise<CacheResponse> {
    if (!this.isConnected || !this.socket) {
      throw new Error('Not connected to server');
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.config.retries; attempt++) {
      try {
        return await this.sendOnce(request);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Send failed');

        // exponential backoff: 100ms, 200ms, 400ms...
        if (attempt < this.config.retries - 1) {
          const delay = 100 * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }

    throw lastError || new Error('Send failed after retries');
  }

  /**
   * Gửi 1 lần duy nhất
   */
  private sendOnce(request: { type: string; key?: string; value?: Value; ttl?: number; nodeId?: string }): Promise<CacheResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not available'));
        return;
      }

      // Timeout cho response
      const timeout = setTimeout(() => {
        this.pendingResolve = null;
        this.pendingReject = null;
        reject(new Error('Response timeout'));
      }, this.config.timeout);

      this.pendingResolve = (response) => {
        clearTimeout(timeout);
        resolve(response);
      };

      this.pendingReject = (err) => {
        clearTimeout(timeout);
        reject(err);
      };

      const buffer = serializeRequest(request as never);
      this.socket.write(buffer);
    });
  }
}
