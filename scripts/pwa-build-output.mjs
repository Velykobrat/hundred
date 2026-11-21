import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function readAppShell(root) {
  // Next's deployment-adapter build stores response bodies by route-cache identity;
  // standalone next build keeps the legacy app/index.html layout instead.
  const routes = JSON.parse(await readFile(join(root, '.next/app-path-routes-manifest.json'), 'utf8'));
  const source = Object.keys(routes).find(key => routes[key] === '/' && key.endsWith('/page'));
  if (!source) throw new Error('PWA: no prerendered root page in the App Router manifest');
  const identity = createHash('sha256').update(source).digest('hex');
  const candidates = [
    join(root, '.next/server/route-cache/APP_PAGE', identity, '$', 'index.html'),
    join(root, '.next/server/app/index.html'),
  ];
  for (const file of candidates) {
    try { return await readFile(file, 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  throw new Error(`PWA: root HTML missing; checked ${candidates.join(', ')}`);
}
