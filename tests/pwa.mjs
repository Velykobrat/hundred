import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const worker = await readFile(new URL('../src/pwa/worker.js', import.meta.url), 'utf8');
const origin = 'https://hundred.test';
const build = { version: 'test', shell: '<html>Actual Hundred shell</html>', manifest: '{"name":"Hundred"}', assets: ['/_next/static/app.js', '/_next/static/app.css', '/_next/static/font.woff2', '/pwa-192.png'] };

function harness({ failAsset = false } = {}) {
  const listeners = new Map();
  const stores = new Map([['hundred-pwa-old', new Map()], ['other-app', new Map()]]);
  let requests = 0;
  let offline = false;
  let claimed = false;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const store = stores.get(name);
      return { async put(key, response) { store.set(key, response); }, async match(key) { return store.get(key)?.clone(); } };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  class LocalRequest { constructor(path, options) { this.url = new URL(path, origin).href; Object.assign(this, options); } }
  runInNewContext(worker, {
    BUILD: build, caches, Request: LocalRequest, Response, URL, Set,
    self: { location: { origin }, clients: { async claim() { claimed = true; } }, addEventListener(type, listener) { listeners.set(type, listener); } },
    async fetch(request) {
      requests++;
      if (offline) throw new Error('Offline');
      if (failAsset && request.url.endsWith('app.js')) return new Response('Login page', { headers: { 'content-type': 'text/html' } });
      return new Response('asset', { headers: { 'content-type': 'application/octet-stream' } });
    },
  });
  return {
    stores, get requests() { return requests; }, get claimed() { return claimed; },
    offline() { offline = true; },
    async lifecycle(type) { let task; listeners.get(type)({ waitUntil(promise) { task = promise; } }); await task; },
    fetch(path, mode = 'cors', method = 'GET') {
      let result;
      listeners.get('fetch')({ request: { url: new URL(path, origin).href, mode, method }, respondWith(promise) { result = promise; } });
      return result;
    },
  };
}

const app = harness();
await app.lifecycle('install');
assert.equal(app.requests, build.assets.length);
assert.ok(app.stores.has('hundred-pwa-old'), 'waiting install must preserve active build');
assert.equal(app.claimed, false, 'installation must not take over an open form');
await app.lifecycle('activate');
assert.equal(app.stores.has('hundred-pwa-old'), false);
assert.ok(app.stores.has('other-app'), 'only Hundred shell caches may be deleted');
assert.equal(app.claimed, true);
app.offline();
for (const path of ['/', '/?source=installed', '/#home', '/#resource', '/#settings']) {
  assert.equal(await (await app.fetch(path, 'navigate')).text(), build.shell);
}
for (const path of build.assets) assert.equal(await (await app.fetch(path)).text(), 'asset');
assert.equal(await (await app.fetch('/manifest.webmanifest')).text(), build.manifest);
assert.equal(await (await app.fetch('/_next/static/app.js?dpl=deployment')).text(), 'asset');
assert.equal(app.requests, build.assets.length, 'offline cached views must not require network');
for (const path of ['/backup.json', '/import.json', '/sw.js', '/api/data', '/?_rsc=test', '/other', 'https://external.test/app.js']) {
  assert.equal(app.fetch(path), undefined, 'must not intercept: ' + path);
}
assert.equal(app.fetch('/', 'cors', 'POST'), undefined);
assert.equal(app.fetch('/other', 'navigate'), undefined);

const broken = harness({ failAsset: true });
await assert.rejects(broken.lifecycle('install'));
assert.equal(broken.stores.has('hundred-pwa-test'), false, 'partial shell must not activate');
assert.ok(broken.stores.has('hundred-pwa-old'), 'failed update preserves existing offline app');

const manifest = JSON.parse(await readFile(new URL('../app/manifest.webmanifest', import.meta.url), 'utf8'));
assert.equal(manifest.name, 'Hundred');
assert.equal(manifest.display, 'standalone');
assert.equal(manifest.start_url, '/');
for (const icon of manifest.icons) {
  const png = await readFile(new URL('../public' + icon.src, import.meta.url));
  const size = Number(icon.sizes.split('x')[0]);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), size);
  assert.equal(png.readUInt32BE(20), size);
}
console.log('PASS PWA: atomic install, offline shell/assets, request exclusions, update lifecycle and manifest icons');

// Optional check against a real production server after npm run build.
if (process.argv.includes('--production')) {
  const base = 'http://localhost:3100';
  const response = await fetch(base + '/sw.js');
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.match(response.headers.get('cache-control'), /no-store/);
  const generated = await response.text();
  const production = JSON.parse(generated.match(/^const BUILD = (.+);$/m)[1]);
  assert.match(production.version, /^[a-f0-9]{20}$/);
  assert.match(production.shell, /rel="manifest"/);
  assert.match(production.shell, /\/_next\/static\//);
  assert.deepEqual(JSON.parse(production.manifest), manifest);
  await Promise.all(production.assets.map(async path => {
    const asset = await fetch(base + path, { redirect: 'error' });
    assert.equal(asset.status, 200, path);
    assert.ok(!asset.headers.get('content-type')?.includes('text/html'), path);
    assert.ok((await asset.arrayBuffer()).byteLength > 0, path);
  }));
  const html = await (await fetch(base + '/')).text();
  assert.match(html, /manifest\.webmanifest/);
  assert.equal((await fetch(base + '/manifest.webmanifest')).status, 200);
  console.log(`PASS PWA production HTTP: worker headers, generated shell, manifest and ${production.assets.length} assets`);
}
