/**
 * Wire Protocol cho TCP communication
 *
 * Format request:  "COMMAND [key] [value] [ttl]\r\n"
 * Format response: "TYPE [value/message]\r\n"
 *
 * Commands: SET, GET, DEL, PING, REPLICATE, ELECT
 * Response types: VALUE, OK, NULL, ERROR, PONG
 */

import { Value } from '../core/types';

// ─── Types ───────────────────────────────────────────────────────

/** Các command được hỗ trợ */
export type CommandType = 'SET' | 'GET' | 'DEL' | 'PING' | 'REPLICATE' | 'ELECT';

/** Request từ client/server khác */
export interface CacheRequest {
  type: CommandType;
  key?: string;
  value?: Value;
  ttl?: number;
  nodeId?: string;
}

/** Response trả về */
export interface CacheResponse {
  type: 'VALUE' | 'OK' | 'NULL' | 'ERROR' | 'PONG';
  value?: Value;
  message?: string;
}

// ─── Parser ──────────────────────────────────────────────────────

/**
 * Parse raw TCP buffer thành CacheRequest
 *
 * Format: "COMMAND key value ttl\r\n"
 * - SET user:123 John 60000
 * - GET user:123
 * - DEL user:123
 * - PING
 *
 * @param buffer - Raw data từ TCP socket
 * @returns CacheRequest object
 * @throws Error nếu format sai
 */
export function parseRequest(buffer: Buffer): CacheRequest {
  const text = buffer.toString('utf-8').trim();

  if (!text) {
    throw new Error('Empty request');
  }

  const parts = text.split(' ');
  const command = parts[0].toUpperCase() as CommandType;

  switch (command) {
    case 'SET': {
      // SET key value ttl
      if (parts.length < 3) {
        throw new Error('SET requires at least: SET key value');
      }
      const key = parts[1];
      const value = parseValue(parts[2]);
      const ttl = parts[3] ? parseInt(parts[3], 10) : undefined;

      if (parts[3] && isNaN(ttl!)) {
        throw new Error('TTL must be a number');
      }

      return { type: 'SET', key, value, ttl };
    }

    case 'GET': {
      // GET key
      if (parts.length < 2) {
        throw new Error('GET requires: GET key');
      }
      return { type: 'GET', key: parts[1] };
    }

    case 'DEL': {
      // DEL key
      if (parts.length < 2) {
        throw new Error('DEL requires: DEL key');
      }
      return { type: 'DEL', key: parts[1] };
    }

    case 'PING': {
      return { type: 'PING' };
    }

    case 'REPLICATE': {
      // REPLICATE key value
      if (parts.length < 3) {
        throw new Error('REPLICATE requires: REPLICATE key value');
      }
      return { type: 'REPLICATE', key: parts[1], value: parseValue(parts[2]) };
    }

    case 'ELECT': {
      // ELECT nodeId
      if (parts.length < 2) {
        throw new Error('ELECT requires: ELECT nodeId');
      }
      return { type: 'ELECT', nodeId: parts[1] };
    }

    default:
      throw new Error(`Unknown command: ${command}`);
  }
}

// ─── Serializer ──────────────────────────────────────────────────

/**
 * Serialize CacheResponse thành TCP buffer
 *
 * @param response - Response object
 * @returns Buffer ready to send via TCP
 */
export function serializeResponse(response: CacheResponse): Buffer {
  let line: string;

  switch (response.type) {
    case 'VALUE':
      line = `VALUE ${serializeValue(response.value)}`;
      break;
    case 'OK':
      line = 'OK';
      break;
    case 'NULL':
      line = 'NULL';
      break;
    case 'ERROR':
      line = `ERROR ${response.message || 'Unknown error'}`;
      break;
    case 'PONG':
      line = 'PONG';
      break;
    default:
      line = 'ERROR Unknown response type';
  }

  return Buffer.from(line + '\r\n', 'utf-8');
}

/**
 * Serialize CacheRequest thành TCP buffer (dùng cho client)
 *
 * @param request - Request object
 * @returns Buffer ready to send via TCP
 */
export function serializeRequest(request: CacheRequest): Buffer {
  let line: string;

  switch (request.type) {
    case 'SET':
      line = `SET ${request.key} ${serializeValue(request.value)}${request.ttl !== undefined ? ` ${request.ttl}` : ''}`;
      break;
    case 'GET':
      line = `GET ${request.key}`;
      break;
    case 'DEL':
      line = `DEL ${request.key}`;
      break;
    case 'PING':
      line = 'PING';
      break;
    case 'REPLICATE':
      line = `REPLICATE ${request.key} ${serializeValue(request.value)}`;
      break;
    case 'ELECT':
      line = `ELECT ${request.nodeId}`;
      break;
    default:
      throw new Error(`Unknown command: ${request.type}`);
  }

  return Buffer.from(line + '\r\n', 'utf-8');
}

/**
 * Parse response từ TCP buffer
 *
 * @param buffer - Raw data từ TCP socket
 * @returns CacheResponse object
 * @throws Error nếu format sai
 */
export function parseResponse(buffer: Buffer): CacheResponse {
  const text = buffer.toString('utf-8').trim();

  if (!text) {
    throw new Error('Empty response');
  }

  const spaceIndex = text.indexOf(' ');
  const type = spaceIndex === -1 ? text : text.substring(0, spaceIndex);
  const rest = spaceIndex === -1 ? '' : text.substring(spaceIndex + 1);

  switch (type) {
    case 'VALUE':
      return { type: 'VALUE', value: parseValue(rest) };
    case 'OK':
      return { type: 'OK' };
    case 'NULL':
      return { type: 'NULL' };
    case 'ERROR':
      return { type: 'ERROR', message: rest || 'Unknown error' };
    case 'PONG':
      return { type: 'PONG' };
    default:
      throw new Error(`Unknown response type: ${type}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

/**
 * Parse value từ string protocol
 *
 * Objects/arrays được encode dạng JSON: __JSON__{"key":"value"}
 * Strings, numbers, booleans giữ nguyên
 */
function parseValue(raw: string): Value {
  // JSON object/array
  if (raw.startsWith('__JSON__')) {
    try {
      return JSON.parse(raw.substring(8)) as Value;
    } catch {
      return raw;
    }
  }

  // Boolean
  if (raw === 'true') return true;
  if (raw === 'false') return false;

  // Null
  if (raw === 'null') return null;

  // Number
  const num = Number(raw);
  if (!isNaN(num) && raw !== '') return num;

  // String
  return raw;
}

/**
 * Serialize value thành string protocol
 */
function serializeValue(value: Value | undefined): string {
  if (value === undefined) return '';
  if (value === null) return 'null';
  if (typeof value === 'object') return `__JSON__${JSON.stringify(value)}`;
  return String(value);
}
