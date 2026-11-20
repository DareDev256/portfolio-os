// jamesdare.com on Cloudflare Workers (moved off Vercel 2026-11-19).
// Static files are served by Workers static assets (dist/, with _headers).
// This script runs first only for the paths in wrangler.jsonc run_worker_first:
// the /api routes (the original Vercel Node handlers, unchanged, behind a small
// req/res adapter), the vercel.json redirects and rewrites, and the /passion proxy.
import chat from '../api/chat.js';
import draft from '../api/draft.js';
import slots from '../api/slots.js';
import book from '../api/book.js';
import agentCall from '../api/agent-call.js';
import GLOBAL_HEADERS from './global-headers.json' with { type: 'json' };

const API = { '/api/chat': chat, '/api/draft': draft, '/api/slots': slots, '/api/book': book, '/api/agent-call': agentCall };

// vercel.json rewrites (only used when no real file answers first).
const REWRITES = [
  [/^\/book\/?$/, '/book/'],
  [/^\/os(\/.*)?$/, '/os/'],
  [/^\/coldopen(\/.*)?$/, '/coldopen/'],
  [/^\/monitor(\/.*)?$/, '/monitor/'],
  [/^\/(about|work|media|connect|contact|settings|resume|terminal|services)\/?$/, '/monitor/'],
];

function withGlobalHeaders(resp) {
  const r = new Response(resp.body, resp);
  for (const [k, v] of Object.entries(GLOBAL_HEADERS)) if (!r.headers.has(k)) r.headers.set(k, v);
  return r;
}

async function runNodeHandler(handler, request) {
  const url = new URL(request.url);
  const raw = ['GET', 'HEAD', 'OPTIONS'].includes(request.method) ? '' : await request.text();
  const headers = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  headers['x-forwarded-for'] = request.headers.get('cf-connecting-ip') || headers['x-forwarded-for'] || '';
  let body = raw;
  if ((headers['content-type'] || '').includes('application/json') && raw) {
    try { body = JSON.parse(raw); } catch { body = raw; }
  }
  const req = {
    method: request.method,
    url: url.pathname + url.search,
    headers,
    body,
    query: Object.fromEntries(url.searchParams),
    async *[Symbol.asyncIterator]() { if (raw) yield Buffer.from(raw, 'utf8'); },
  };
  let status = 200; let sent = null; const out = new Headers();
  const res = {
    statusCode: 200,
    setHeader(k, v) { out.set(k, String(v)); return res; },
    getHeader(k) { return out.get(k); },
    status(code) { status = code; res.statusCode = code; return res; },
    json(obj) { if (!out.has('content-type')) out.set('content-type', 'application/json; charset=utf-8'); sent = JSON.stringify(obj); return res; },
    send(b) { sent = typeof b === 'string' || b instanceof Uint8Array ? b : JSON.stringify(b); return res; },
    end(b) { if (b !== undefined && sent === null) sent = b; return res; },
  };
  await handler(req, res);
  return new Response(sent === null ? null : sent, { status, headers: out });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (API[p]) {
      try { return withGlobalHeaders(await runNodeHandler(API[p], request)); }
      catch (e) { console.error('api', p, e && e.message); return withGlobalHeaders(Response.json({ error: 'Temporarily offline. Email james@stiersolutions.ca.' }, { status: 503 })); }
    }

    // vercel.json redirects
    if (p === '/studio' || p.startsWith('/studio/')) return Response.redirect(new URL('/', url), 308);
    if (p === '/cv') return Response.redirect(new URL('/resume/JamesOlusoga-AI-Engineer.pdf', url), 307);

    // /passion proxy (no CSP on these, same as the vercel.json negative lookahead)
    if (p === '/passion' || p.startsWith('/passion/')) {
      const upstream = new URL('https://passion-dashboard.vercel.app' + p + url.search);
      let up;
      try { up = await fetch(new Request(upstream, request)); } catch { up = null; }
      if (up && (up.status < 400 || up.status === 404)) return up;
      // Upstream paused or down: say so plainly instead of passing through a raw 402.
      const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard demo offline | James Olusoga</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#fff;color:#0a0a0b;font:16px/1.5 -apple-system,system-ui,sans-serif}main{max-width:32rem;padding:24px}h1{font-size:1.5rem;margin:0 0 .5rem}a{color:#d1381a}</style></head><body><main><h1>The dashboard demo is offline for a moment.</h1><p>It is moving to a new host. The rest of the site works: <a href="/">go back home</a>, or email <a href="mailto:james@stiersolutions.ca">james@stiersolutions.ca</a>.</p></main></body></html>';
      return withGlobalHeaders(new Response(html, { status: 503, headers: { 'content-type': 'text/html; charset=utf-8', 'retry-after': '3600', 'cache-control': 'no-store' } }));
    }

    // Real file first, then the SPA rewrite (Vercel checks the filesystem before rewrites).
    // A trailing-slash redirect from the asset layer counts as "no file" for a rewrite path,
    // so /os is served in place like it was on Vercel instead of bouncing to /os/.
    const asset = await env.ASSETS.fetch(request);
    const isRedirect = asset.status >= 300 && asset.status < 400;
    const rewritable = REWRITES.some(([re]) => re.test(p));
    if (asset.status !== 404 && !(isRedirect && rewritable)) return asset;
    for (const [re, target] of REWRITES) {
      if (re.test(p)) {
        const r = await env.ASSETS.fetch(new Request(new URL(target, url), request));
        return withGlobalHeaders(r);
      }
    }
    return asset;
  },
};
