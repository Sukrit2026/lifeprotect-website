const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3010;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://formspree.io");

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }

  const parsedUrl = url.parse(req.url);
  const pathname = decodeURIComponent(parsedUrl.pathname);
  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  filePath = path.normalize(filePath);

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const basename = path.basename(filePath);
  if (basename.startsWith('.') || basename === 'serve.js' || basename === 'package.json' || basename === 'package-lock.json') {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>');
      } else {
        console.error('Server error:', err);
        res.writeHead(500);
        res.end('Server Error');
      }
      return;
    }

    // Cache static assets
    if (ext !== '.html') {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }

    const textTypes = ['.html', '.css', '.js', '.json', '.svg', '.xml', '.txt'];
    const finalContentType = textTypes.includes(ext) ? contentType + '; charset=utf-8' : contentType;

    res.writeHead(200, { 'Content-Type': finalContentType });
    res.end(data);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`LifeProtect dev server running at http://localhost:${PORT}`);
});
