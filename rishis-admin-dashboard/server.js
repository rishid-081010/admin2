const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, '../real-estate-image-enhancer/client/dist');
const BACKEND_PORT = 5000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.csv': 'text/csv; charset=utf-8',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Forward /api and /uploads to backend on port 5000
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend gateway proxy error', details: e.message }));
    });

    req.pipe(proxyReq);
    return;
  }

  // Serve static files from compiled dist
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
  let safePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  let filePath = path.join(DIST_DIR, safePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 A SQUARED UNIFIED NATIVE PORTAL RUNNING AT:`);
  console.log(`   👉 http://localhost:${PORT}`);
  console.log(`====================================================`);
});
