#!/usr/bin/env bash
# Deploy jamesdare.com to Cloudflare Workers (static assets + API routes).
# Moved off Vercel 2026-11-19 (Hobby team paused for Fluid CPU). Static is served free;
# cf/worker.mjs runs only for /api/*, the vercel.json redirects/rewrites and /passion.
# Secrets live in the Worker (wrangler secret put/bulk), never in this repo.
set -euo pipefail
cd "$(dirname "$0")/.."
npm run build
# Vercel Web Analytics does not exist on Cloudflare; drop its tag so it cannot 404.
for f in dist/index.html dist/coldopen/index.html dist/monitor/index.html dist/os/index.html; do
  [ -f "$f" ] && perl -0pi -e 's#<script defer src="/_vercel/insights/script\.js"></script>\s*##g' "$f"
done
# vercel.json headers -> dist/_headers (static files) and cf/global-headers.json (Worker responses).
python3 - <<'PY'
import json
v=json.load(open('vercel.json')); out=[]; glob=None
for blk in v['headers']:
    src=blk['source']
    path={'/sw.js':'/sw.js','/data/(.*)':'/data/*'}.get(src,'/*' if src.startswith('/((?!passion') else None)
    if path is None: raise SystemExit('unknown header source: '+src)
    if path=='/*': glob=blk['headers']
    out.append(path); out+= [f"  {h['key']}: {h['value']}" for h in blk['headers']]
open('dist/_headers','w').write('\n'.join(out)+'\n')
json.dump({h['key']:h['value'] for h in glob}, open('cf/global-headers.json','w'))
PY
cd cf && npx -y wrangler@4 deploy
