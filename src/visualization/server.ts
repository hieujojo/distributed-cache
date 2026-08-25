/**
 * Visualization Dev Server
 *
 * Simple HTTP server để serve visualization:
 *   - Serve static files từ dist/
 *   - Proxy /api/* requests đến cache server
 *   - Serve index.html cho SPA routes
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';

/** MIME types cho static files */
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

/** Server config */
interface VizServerConfig {
  /** Port cho visualization server */
  port: number;
  /** Port của cache server (để proxy) */
  cachePort?: number;
  /** Directory chứa static files */
  staticDir?: string;
}

/**
 * Tạo visualization server
 * @param config - Server config
 * @returns HTTP server instance
 */
export function startVizServer(config: VizServerConfig): http.Server {
  const {
    port,
    cachePort = 3000,
    staticDir = path.join(process.cwd(), 'public'),
  } = config;

  const server = http.createServer((req, res) => {
    const url = req.url ?? '/';

    // Proxy API requests đến cache server
    if (url.startsWith('/api/')) {
      proxyToCacheServer(req, res, cachePort);
      return;
    }

    // Serve static files
    serveStaticFile(req, res, staticDir, url);
  });

  server.listen(port, () => {
    console.log(`🌐 Visualization server running at http://localhost:${port}`);
    console.log(`📡 Proxying /api/* to cache server at port ${cachePort}`);
  });

  return server;
}

/**
 * Proxy request đến cache server
 */
function proxyToCacheServer(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  cachePort: number
): void {
  const options = {
    hostname: 'localhost',
    port: cachePort,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Cache server unavailable' }));
  });

  req.pipe(proxyReq, { end: true });
}

/**
 * Serve static file
 */
function serveStaticFile(
  _req: http.IncomingMessage,
  res: http.ServerResponse,
  staticDir: string,
  url: string
): void {
  // Default to index.html
  let filePath = url === '/' ? '/index.html' : url;

  // Security: prevent directory traversal
  filePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');

  const fullPath = path.join(staticDir, filePath);

  // Check file exists
  fs.stat(fullPath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Serve index.html cho SPA routes
      const indexPath = path.join(staticDir, 'index.html');
      fs.readFile(indexPath, (err2, data) => {
        if (err2) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not Found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      });
      return;
    }

    // Read and serve file
    fs.readFile(fullPath, (err2, data) => {
      if (err2) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
        return;
      }

      const ext = path.extname(fullPath);
      const contentType = MIME_TYPES[ext] ?? 'application/octet-stream';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
}

export default startVizServer;

// Chạy server khi execute trực tiếp (ESM)
const isMainModule = process.argv[1]?.includes('server.ts');
if (isMainModule) {
  const port = parseInt(process.env.VIZ_PORT || '8080', 10);
  const cachePort = parseInt(process.env.CACHE_PORT || '3000', 10);
  startVizServer({ port, cachePort });
}
