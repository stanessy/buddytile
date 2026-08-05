#!/usr/bin/env node
/**
 * Persistent preview: builds the site, serves docs/ on :4300, and rebuilds
 * automatically whenever src/ or build.js changes. Runs under the
 * com.buddytile.preview LaunchAgent (KeepAlive) — never needs manual restarts.
 */
const { execFileSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const PORT = 4300;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.ico': 'image/x-icon',
};

const build = () => {
  try {
    execFileSync('node', [path.join(ROOT, 'build.js')], { stdio: 'inherit' });
  } catch (err) {
    console.error('[preview] build failed:', err.message);
  }
};

build();

// Debounced rebuild on any source change
let timer = null;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(build, 300);
};
fs.watch(path.join(ROOT, 'src'), { recursive: true }, schedule);
fs.watch(path.join(ROOT, 'build.js'), schedule);
fs.watch(path.join(ROOT, 'assets'), { recursive: true }, schedule);

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(DOCS, p);
    if (!file.startsWith(DOCS)) return res.writeHead(403).end();
    fs.readFile(file, (err, buf) => {
      if (err) {
        // extensionless → try directory index
        return fs.readFile(path.join(DOCS, p, 'index.html'), (err2, buf2) => {
          if (err2) return res.writeHead(404).end('Not found');
          res.writeHead(200, { 'Content-Type': MIME['.html'] }).end(buf2);
        });
      }
      res
        .writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' })
        .end(buf);
    });
  })
  .listen(PORT, () => console.log(`[preview] buddytile on http://localhost:${PORT} (auto-rebuild on src change)`));
