#!/usr/bin/env node
// Hardened post-deploy verification gate for truststandardprotocol.com.
//
// Replaces the old "12x200" check, which is MEANINGLESS on this server: the vhost
// has (or had) a catch-all that returns the landing page with HTTP 200 for ANY
// path — including garbage. A deploy "passing" 12x200 proves nothing. This gate
// checks what actually matters:
//
//   1. A nonexistent path must NOT return 200 (the catch-all must be dead or
//      at minimum must not impersonate real routes).
//   2. Every real route must be DISTINCT content (not the same landing bytes).
//   3. /.well-known/tsp-manifest.json must be served as application/json and
//      carry the REAL ceremony root key (j01aKrIu...), not the demo key.
//   4. The demo manifest at /agent/tsp-manifest.json, if present, must still
//      self-label as demo (it must never silently become the trust anchor).
//   5. Manifest freshness: warn when issuedAt + acceptableAge is in the past.
//
// Usage: node scripts/verify-deploy.mjs [--base https://truststandardprotocol.com]
// Exit 0 = all checks pass; exit 1 = any failure. Zero dependencies.

const BASE = (() => {
  const i = process.argv.indexOf('--base');
  return (i !== -1 && process.argv[i + 1]) ? process.argv[i + 1].replace(/\/$/, '') : 'https://truststandardprotocol.com';
})();

const REAL_ROOT_X = 'j01aKrIuS94ldv8P_O6vNHJEZ1uP3OjtKdgI6jXkq-w';
const ROUTES = ['/', '/why/', '/conformance/', '/docs/', '/hard-questions/', '/leaderboard/',
  '/playground/', '/pricing/', '/protocol/', '/register/', '/seal/', '/security/', '/status/',
  '/tools/', '/trust/', '/verify/'];

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const ok = (msg) => console.log(`  ok    ${msg}`);
const warn = (msg) => console.log(`  WARN  ${msg}`);

async function get(path) {
  const res = await fetch(BASE + path, { redirect: 'follow' });
  const body = await res.text();
  return { status: res.status, type: res.headers.get('content-type') ?? '', body };
}

console.log(`verify-deploy against ${BASE}\n`);

// 1. catch-all probe
{
  const probe = await get('/definitely-not-a-real-page-xyz-31337/');
  if (probe.status === 200) fail(`nonexistent path returned 200 (${probe.body.length}B) — catch-all still impersonates routes`);
  else ok(`nonexistent path -> ${probe.status} (no catch-all impersonation)`);
}

// 2. route distinctness
{
  const seen = new Map(); // size+title fingerprint -> route
  for (const r of ROUTES) {
    const res = await get(r);
    if (res.status !== 200) { fail(`${r} -> ${res.status}`); continue; }
    const title = (res.body.match(/<title>([^<]*)<\/title>/i) ?? [])[1] ?? '';
    const fp = `${res.body.length}:${title}`;
    if (seen.has(fp) && r !== '/') fail(`${r} serves identical content to ${seen.get(fp)} (${fp})`);
    else { seen.set(fp, r); ok(`${r} 200 distinct ("${title.slice(0, 40)}", ${res.body.length}B)`); }
  }
}

// 3. real trust anchor
{
  const m = await get('/.well-known/tsp-manifest.json');
  if (m.status !== 200) fail(`/.well-known/tsp-manifest.json -> ${m.status}`);
  else if (!m.type.includes('application/json')) fail(`manifest content-type is "${m.type}", not application/json`);
  else {
    let doc;
    try { doc = JSON.parse(m.body); } catch { doc = null; }
    if (!doc) fail('manifest is not valid JSON');
    else if (doc.rootKey?.x !== REAL_ROOT_X) fail(`manifest rootKey.x is "${doc.rootKey?.x}" — NOT the real ceremony root`);
    else {
      ok(`real ceremony root served (rootKey.x = ${REAL_ROOT_X.slice(0, 12)}..., sequence ${doc.sequence})`);
      // 5. freshness per the manifest's own policy
      const ageLimit = new Date(new Date(doc.issuedAt).getTime() + (doc.acceptableAge?.seconds ?? 0) * 1000);
      if (Number.isFinite(ageLimit.getTime()) && ageLimit < new Date())
        warn(`manifest is past its own acceptableAge (issuedAt ${doc.issuedAt} + ${doc.acceptableAge?.seconds}s < now) — re-issue (sequence+1) needed`);
      else ok(`manifest within its acceptableAge window (until ${ageLimit.toISOString()})`);
    }
  }
}

// 4. demo manifest must stay honestly labeled
{
  const d = await get('/agent/tsp-manifest.json');
  if (d.status === 200) {
    let doc; try { doc = JSON.parse(d.body); } catch { doc = null; }
    if (doc && !/demo/i.test(`${doc.issuer} ${doc.note}`)) fail('/agent/tsp-manifest.json no longer self-labels as demo');
    else ok('/agent demo manifest still honestly self-labeled (or absent)');
  } else ok(`/agent/tsp-manifest.json -> ${d.status} (absent is fine)`);
}

console.log(failures ? `\nDEPLOY GATE FAILED — ${failures} failure(s)` : '\nDEPLOY GATE GREEN');
process.exit(failures ? 1 : 0);
