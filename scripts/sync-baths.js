#!/usr/bin/env node
/**
 * Copy the built Buddy Baths path pages into this site so the hero buttons open
 * them on buddytile.com instead of leaving for buddybaths.com:
 *
 *   (cd ~/buddybaths && npm run build) && node scripts/sync-baths.js && node build.js
 *
 * Writes vendor-baths/ (committed; build.js copies it into docs/ as-is):
 *   one-day-showers/, custom-bathrooms/   the pages, canonical left on buddybaths.com
 *   baths-assets/                          their css/js/img/fonts
 * Root links other than the two pages point back to https://buddybaths.com.
 */
const fs = require('fs');
const path = require('path');

const SRC = process.env.BATHS_DOCS || path.join(require('os').homedir(), 'buddybaths', 'docs');
const OUT = path.join(__dirname, '..', 'vendor-baths');
const PAGES = ['one-day-showers', 'custom-bathrooms'];
const BATHS = 'https://buddybaths.com';

if (!fs.existsSync(path.join(SRC, PAGES[0], 'index.html'))) {
  console.error(`No built Buddy Baths site at ${SRC}, run npm run build in ~/buddybaths first.`);
  process.exit(1);
}

const assets = (s) => s.replace(/(["'(])\/assets\//g, '$1/baths-assets/');
const links = (s) => s.replace(/(href|action)="\/(?!baths-assets\/)([^"]*)"/g, (m, attr, rest) =>
  PAGES.some((p) => rest.startsWith(p + '/')) ? m : `${attr}="${BATHS}/${rest}"`);

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(path.join(SRC, 'assets'), path.join(OUT, 'baths-assets'), { recursive: true });
for (const f of ['styles.css', 'main.js']) {
  const p = path.join(OUT, 'baths-assets', f);
  fs.writeFileSync(p, assets(fs.readFileSync(p, 'utf8')));
}
for (const page of PAGES) {
  const html = links(assets(fs.readFileSync(path.join(SRC, page, 'index.html'), 'utf8')));
  if (!html.includes(`rel="canonical" href="${BATHS}/${page}/"`)) throw new Error(`${page}: canonical must stay on ${BATHS}`);
  fs.mkdirSync(path.join(OUT, page), { recursive: true });
  fs.writeFileSync(path.join(OUT, page, 'index.html'), html);
}
console.log(`Synced ${PAGES.join(', ')} + assets from ${SRC} → vendor-baths/`);
