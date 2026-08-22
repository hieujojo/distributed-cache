/**
 * Tests cho Wire Protocol
 */

import {
  parseRequest,
  serializeResponse,
  serializeRequest,
  parseResponse,
} from '../../src/server/protocol';

// ─── parseRequest ────────────────────────────────────────────────

describe('parseRequest', () => {
  describe('SET command', () => {
    it('should parse SET with key and value', () => {
      const buf = Buffer.from('SET user:123 John\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('SET');
      expect(req.key).toBe('user:123');
      expect(req.value).toBe('John');
      expect(req.ttl).toBeUndefined();
    });

    it('should parse SET with TTL', () => {
      const buf = Buffer.from('SET user:123 John 60000\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('SET');
      expect(req.key).toBe('user:123');
      expect(req.value).toBe('John');
      expect(req.ttl).toBe(60000);
    });

    it('should parse SET with number value', () => {
      const buf = Buffer.from('SET counter 42\r\n');
      const req = parseRequest(buf);

      expect(req.value).toBe(42);
    });

    it('should parse SET with boolean value', () => {
      const buf = Buffer.from('SET active true\r\n');
      const req = parseRequest(buf);

      expect(req.value).toBe(true);
    });

    it('should parse SET with JSON value', () => {
      const json = JSON.stringify({ name: 'John', age: 30 });
      const buf = Buffer.from(`SET user:123 __JSON__${json}\r\n`);
      const req = parseRequest(buf);

      expect(req.type).toBe('SET');
      expect(req.key).toBe('user:123');
      expect(req.value).toEqual({ name: 'John', age: 30 });
    });

    it('should throw on SET without value', () => {
      const buf = Buffer.from('SET user:123\r\n');
      expect(() => parseRequest(buf)).toThrow('SET requires at least: SET key value');
    });

    it('should throw on SET with invalid TTL', () => {
      const buf = Buffer.from('SET user:123 John abc\r\n');
      expect(() => parseRequest(buf)).toThrow('TTL must be a number');
    });
  });

  describe('GET command', () => {
    it('should parse GET with key', () => {
      const buf = Buffer.from('GET user:123\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('GET');
      expect(req.key).toBe('user:123');
    });

    it('should throw on GET without key', () => {
      const buf = Buffer.from('GET\r\n');
      expect(() => parseRequest(buf)).toThrow('GET requires: GET key');
    });
  });

  describe('DEL command', () => {
    it('should parse DEL with key', () => {
      const buf = Buffer.from('DEL user:123\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('DEL');
      expect(req.key).toBe('user:123');
    });

    it('should throw on DEL without key', () => {
      const buf = Buffer.from('DEL\r\n');
      expect(() => parseRequest(buf)).toThrow('DEL requires: DEL key');
    });
  });

  describe('PING command', () => {
    it('should parse PING', () => {
      const buf = Buffer.from('PING\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('PING');
    });
  });

  describe('REPLICATE command', () => {
    it('should parse REPLICATE with key and value', () => {
      const buf = Buffer.from('REPLICATE user:123 John\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('REPLICATE');
      expect(req.key).toBe('user:123');
      expect(req.value).toBe('John');
    });

    it('should throw on REPLICATE without value', () => {
      const buf = Buffer.from('REPLICATE user:123\r\n');
      expect(() => parseRequest(buf)).toThrow('REPLICATE requires: REPLICATE key value');
    });
  });

  describe('ELECT command', () => {
    it('should parse ELECT with nodeId', () => {
      const buf = Buffer.from('ELECT node-1\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('ELECT');
      expect(req.nodeId).toBe('node-1');
    });

    it('should throw on ELECT without nodeId', () => {
      const buf = Buffer.from('ELECT\r\n');
      expect(() => parseRequest(buf)).toThrow('ELECT requires: ELECT nodeId');
    });
  });

  describe('error handling', () => {
    it('should throw on empty request', () => {
      const buf = Buffer.from('');
      expect(() => parseRequest(buf)).toThrow('Empty request');
    });

    it('should throw on unknown command', () => {
      const buf = Buffer.from('FOOBAR key\r\n');
      expect(() => parseRequest(buf)).toThrow('Unknown command: FOOBAR');
    });

    it('should be case-insensitive for commands', () => {
      const buf = Buffer.from('get user:123\r\n');
      const req = parseRequest(buf);

      expect(req.type).toBe('GET');
    });
  });
});

// ─── serializeResponse ───────────────────────────────────────────

describe('serializeResponse', () => {
  it('should serialize VALUE response', () => {
    const buf = serializeResponse({ type: 'VALUE', value: 'John' });
    expect(buf.toString()).toBe('VALUE John\r\n');
  });

  it('should serialize VALUE with number', () => {
    const buf = serializeResponse({ type: 'VALUE', value: 42 });
    expect(buf.toString()).toBe('VALUE 42\r\n');
  });

  it('should serialize VALUE with null', () => {
    const buf = serializeResponse({ type: 'VALUE', value: null });
    expect(buf.toString()).toBe('VALUE null\r\n');
  });

  it('should serialize VALUE with object', () => {
    const obj = { name: 'John' };
    const buf = serializeResponse({ type: 'VALUE', value: obj });
    expect(buf.toString()).toBe(`VALUE __JSON__${JSON.stringify(obj)}\r\n`);
  });

  it('should serialize OK response', () => {
    const buf = serializeResponse({ type: 'OK' });
    expect(buf.toString()).toBe('OK\r\n');
  });

  it('should serialize NULL response', () => {
    const buf = serializeResponse({ type: 'NULL' });
    expect(buf.toString()).toBe('NULL\r\n');
  });

  it('should serialize ERROR response', () => {
    const buf = serializeResponse({ type: 'ERROR', message: 'Key not found' });
    expect(buf.toString()).toBe('ERROR Key not found\r\n');
  });

  it('should serialize ERROR with default message', () => {
    const buf = serializeResponse({ type: 'ERROR' });
    expect(buf.toString()).toBe('ERROR Unknown error\r\n');
  });

  it('should serialize PONG response', () => {
    const buf = serializeResponse({ type: 'PONG' });
    expect(buf.toString()).toBe('PONG\r\n');
  });
});

// ─── serializeRequest ────────────────────────────────────────────

describe('serializeRequest', () => {
  it('should serialize SET request', () => {
    const buf = serializeRequest({ type: 'SET', key: 'user:123', value: 'John' });
    expect(buf.toString()).toBe('SET user:123 John\r\n');
  });

  it('should serialize SET with TTL', () => {
    const buf = serializeRequest({ type: 'SET', key: 'user:123', value: 'John', ttl: 60000 });
    expect(buf.toString()).toBe('SET user:123 John 60000\r\n');
  });

  it('should serialize GET request', () => {
    const buf = serializeRequest({ type: 'GET', key: 'user:123' });
    expect(buf.toString()).toBe('GET user:123\r\n');
  });

  it('should serialize DEL request', () => {
    const buf = serializeRequest({ type: 'DEL', key: 'user:123' });
    expect(buf.toString()).toBe('DEL user:123\r\n');
  });

  it('should serialize PING request', () => {
    const buf = serializeRequest({ type: 'PING' });
    expect(buf.toString()).toBe('PING\r\n');
  });

  it('should serialize REPLICATE request', () => {
    const buf = serializeRequest({ type: 'REPLICATE', key: 'user:123', value: 'John' });
    expect(buf.toString()).toBe('REPLICATE user:123 John\r\n');
  });

  it('should serialize ELECT request', () => {
    const buf = serializeRequest({ type: 'ELECT', nodeId: 'node-1' });
    expect(buf.toString()).toBe('ELECT node-1\r\n');
  });
});

// ─── parseResponse ───────────────────────────────────────────────

describe('parseResponse', () => {
  it('should parse VALUE response', () => {
    const buf = Buffer.from('VALUE John\r\n');
    const res = parseResponse(buf);

    expect(res.type).toBe('VALUE');
    expect(res.value).toBe('John');
  });

  it('should parse VALUE with number', () => {
    const buf = Buffer.from('VALUE 42\r\n');
    const res = parseResponse(buf);

    expect(res.value).toBe(42);
  });

  it('should parse VALUE with JSON object', () => {
    const obj = { name: 'John' };
    const buf = Buffer.from(`VALUE __JSON__${JSON.stringify(obj)}\r\n`);
    const res = parseResponse(buf);

    expect(res.value).toEqual(obj);
  });

  it('should parse OK response', () => {
    const buf = Buffer.from('OK\r\n');
    const res = parseResponse(buf);

    expect(res.type).toBe('OK');
  });

  it('should parse NULL response', () => {
    const buf = Buffer.from('NULL\r\n');
    const res = parseResponse(buf);

    expect(res.type).toBe('NULL');
  });

  it('should parse ERROR response', () => {
    const buf = Buffer.from('ERROR Key not found\r\n');
    const res = parseResponse(buf);

    expect(res.type).toBe('ERROR');
    expect(res.message).toBe('Key not found');
  });

  it('should parse ERROR with default message', () => {
    const buf = Buffer.from('ERROR\r\n');
    const res = parseResponse(buf);

    expect(res.type).toBe('ERROR');
    expect(res.message).toBe('Unknown error');
  });

  it('should parse PONG response', () => {
    const buf = Buffer.from('PONG\r\n');
    const res = parseResponse(buf);

    expect(res.type).toBe('PONG');
  });

  it('should throw on empty response', () => {
    const buf = Buffer.from('');
    expect(() => parseResponse(buf)).toThrow('Empty response');
  });

  it('should throw on unknown response type', () => {
    const buf = Buffer.from('UNKNOWN something\r\n');
    expect(() => parseResponse(buf)).toThrow('Unknown response type: UNKNOWN');
  });
});

// ─── Round-trip ──────────────────────────────────────────────────

describe('round-trip', () => {
  it('should serialize request → parse request', () => {
    const original = { type: 'SET' as const, key: 'user:123', value: 'John', ttl: 60000 };
    const buf = serializeRequest(original);
    const parsed = parseRequest(buf);

    expect(parsed.type).toBe(original.type);
    expect(parsed.key).toBe(original.key);
    expect(parsed.value).toBe(original.value);
    expect(parsed.ttl).toBe(original.ttl);
  });

  it('should serialize response → parse response', () => {
    const original = { type: 'VALUE' as const, value: { name: 'John' } };
    const buf = serializeResponse(original);
    const parsed = parseResponse(buf);

    expect(parsed.type).toBe(original.type);
    expect(parsed.value).toEqual(original.value);
  });
});
