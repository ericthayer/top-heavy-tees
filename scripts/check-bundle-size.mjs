// Fails the build when the JavaScript a first page view downloads, gzipped,
// is over budget. Run after `npm run build`.
//
// "First load" is whatever dist/index.html pulls in up front: the entry
// script plus its modulepreload links. Lazy route chunks are not counted,
// because they only load when someone navigates there.

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

/** First-load JS budget in KiB (1024 bytes), gzipped. */
export const BUDGET_KIB = 100;

/** Script and modulepreload URLs referenced by the built index.html. */
export function firstLoadAssets(html) {
  const urls = new Set();
  for (const tag of html.match(/<(?:script|link)\b[^>]*>/gi) ?? []) {
    const isScript = /^<script\b/i.test(tag) && /\btype=["']module["']/i.test(tag);
    const isPreload = /^<link\b/i.test(tag) && /\brel=["']modulepreload["']/i.test(tag);
    if (!isScript && !isPreload) continue;
    const url = tag.match(/\b(?:src|href)=["']([^"']+)["']/i)?.[1];
    if (url && /\.m?js(?:$|\?)/.test(url)) urls.add(url);
  }
  return [...urls];
}

export function gzipBytes(buffer) {
  return gzipSync(buffer, { level: 9 }).length;
}

function main() {
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  const assets = firstLoadAssets(html);
  if (!assets.length) {
    console.error('No scripts found in dist/index.html. Did the build run?');
    process.exit(2);
  }

  const rows = assets.map((url) => {
    const file = join(dist, url.replace(/^\/+/, '').split('?')[0]);
    return { url, bytes: gzipBytes(readFileSync(file)) };
  });
  const total = rows.reduce((sum, r) => sum + r.bytes, 0);
  const kib = (n) => (n / 1024).toFixed(2);

  console.log('First-load JavaScript (gzipped)');
  for (const r of rows) console.log(`  ${kib(r.bytes).padStart(7)} KiB  ${r.url}`);
  console.log(`  ${kib(total).padStart(7)} KiB  total, budget ${BUDGET_KIB} KiB (${kib(BUDGET_KIB * 1024 - total)} KiB left)`);

  if (total > BUDGET_KIB * 1024) {
    console.error(
      `\nOver budget by ${kib(total - BUDGET_KIB * 1024)} KiB. Load the new code lazily (dynamic import) ` +
        'or raise BUDGET_KIB in scripts/check-bundle-size.mjs on purpose.',
    );
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
