import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '127.0.0.1';

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml'
};

function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 2 * 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function safeHeaders(headers) {
  const out = {};
  for (const [k, v] of headers.entries()) out[k] = v;
  return out;
}

function extractText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string') return payload.output_text;
  if (Array.isArray(payload.output)) {
    const texts = [];
    for (const item of payload.output) {
      if (!Array.isArray(item?.content)) continue;
      for (const c of item.content) {
        if (typeof c?.text === 'string') texts.push(c.text);
      }
    }
    if (texts.length) return texts.join('\n');
  }
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((x) => x?.text || x?.content || '').filter(Boolean).join('\n');
  }
  return '';
}

async function proxy(req, res) {
  let parsed;
  try {
    parsed = JSON.parse(await readBody(req));
  } catch (e) {
    return sendJson(res, 400, { error: `Invalid JSON: ${e.message}` });
  }

  const {
    url,
    apiKey = '',
    body,
    timeoutMs = 300000,
    extraHeaders = {}
  } = parsed || {};

  if (!url || typeof url !== 'string') return sendJson(res, 400, { error: 'Missing url' });
  if (!body || typeof body !== 'object') return sendJson(res, 400, { error: 'Missing body' });

  let target;
  try {
    target = new URL(url);
  } catch {
    return sendJson(res, 400, { error: 'Invalid URL' });
  }
  if (!['http:', 'https:'].includes(target.protocol)) {
    return sendJson(res, 400, { error: 'Only http/https URLs are supported' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`Timed out after ${timeoutMs} ms`)), Math.max(1000, Number(timeoutMs) || 300000));
  const start = performance.now();
  let firstByteAt = null;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream;q=0.9, */*;q=0.8',
    ...extraHeaders
  };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
      redirect: 'follow'
    });

    firstByteAt = performance.now();
    const raw = await upstream.text();
    const end = performance.now();

    let json = null;
    try { json = JSON.parse(raw); } catch {}

    sendJson(res, 200, {
      ok: upstream.ok,
      upstreamStatus: upstream.status,
      upstreamStatusText: upstream.statusText,
      headers: safeHeaders(upstream.headers),
      timing: {
        ttfbMs: Math.round(firstByteAt - start),
        totalMs: Math.round(end - start)
      },
      raw,
      json,
      extractedText: extractText(json)
    });
  } catch (e) {
    const end = performance.now();
    sendJson(res, 200, {
      ok: false,
      networkError: true,
      error: e?.message || String(e),
      name: e?.name || 'Error',
      timing: {
        ttfbMs: firstByteAt ? Math.round(firstByteAt - start) : null,
        totalMs: Math.round(end - start)
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function serveStatic(req, res) {
  let pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.normalize(path.join(__dirname, pathname));
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  try {
    const data = await fs.readFile(filePath);
    res.writeHead(200, {
      'Content-Type': mime[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('Not Found');
  }
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:' + PORT);
  if (req.method === 'POST' && req.url === '/api/proxy') return proxy(req, res);
  if (req.method === 'GET') return serveStatic(req, res);
  res.writeHead(405); res.end('Method Not Allowed');
});

server.listen(PORT, HOST, () => {
  console.log(`\nModel Fingerprint Tester running at http://${HOST}:${PORT}`);
  console.log('The server does not persist API keys. The browser can optionally remember settings in localStorage.');
  console.log('Press Ctrl+C to stop.\n');
});
