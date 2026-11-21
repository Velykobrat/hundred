import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readAppShell } from '../scripts/pwa-build-output.mjs';

const root = await mkdtemp(join(tmpdir(), 'hundred-pwa-build-'));
try {
  await mkdir(join(root, '.next/server/app'), { recursive: true });
  const source = '/page';
  await writeFile(join(root, '.next/app-path-routes-manifest.json'), JSON.stringify({ [source]: '/' }));
  await writeFile(join(root, '.next/server/app/index.html'), 'local-shell');
  assert.equal(await readAppShell(root), 'local-shell');
  const directory = join(root, '.next/server/route-cache/APP_PAGE', createHash('sha256').update(source).digest('hex'), '$');
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, 'index.html'), 'adapter-shell');
  await rm(join(root, '.next/server/app/index.html'));
  assert.equal(await readAppShell(root), 'adapter-shell', 'Vercel build must not require app/index.html');
  await rm(join(directory, 'index.html'));
  await assert.rejects(readAppShell(root), /root HTML missing/);
} finally {
  // Only the unique fixture directory created above is removed.
  await rm(root, { recursive: true, force: true });
}
console.log('PASS PWA build: standalone and deployment-adapter root HTML paths');
