#!/usr/bin/env node
/**
 * Pull the curated portfolio from the Buddy Built platform and localize it:
 * photos land in assets/img/projects/, metadata in src/projects.json — so the
 * built site is fully static and never depends on (expiring) storage URLs.
 *
 *   BT_API=http://localhost:5001 node scripts/fetch-projects.js   # dev
 *   node scripts/fetch-projects.js                                # prod API
 *
 * Flagging a photo as Portfolio in the platform (Job → Files) is the publish
 * switch; run this then rebuild to refresh the site's project pages.
 */
const fs = require('fs');
const path = require('path');

const API = process.env.BT_API || 'https://buddybuilt.com';
const IMG_DIR = path.join(__dirname, '..', 'assets', 'img', 'projects');
const OUT = path.join(__dirname, '..', 'src', 'projects.json');

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

(async () => {
  let projects;
  try {
    const res = await fetch(`${API}/api/public/projects`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    projects = await res.json();
  } catch (e) {
    console.error(`Could not reach ${API} (${e.message}) — keeping the existing projects.json`);
    process.exit(0);
  }

  fs.mkdirSync(IMG_DIR, { recursive: true });
  const out = [];
  for (const p of projects) {
    const photos = [];
    for (let i = 0; i < p.photos.length; i++) {
      const photo = p.photos[i];
      const url = photo.url.startsWith('http') ? photo.url : `${API}${photo.url}`;
      const file = `project-${p.id}-${i + 1}.jpg`;
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        fs.writeFileSync(path.join(IMG_DIR, file), Buffer.from(await res.arrayBuffer()));
        photos.push({ file, caption: photo.caption, phase: photo.phase });
      } catch (e) {
        console.error(`  photo skipped (${e.message}): ${url}`);
      }
    }
    if (!photos.length) continue;
    out.push({
      id: p.id,
      slug: `tile-${slugify(p.city) || 'metro'}-${p.id}`,
      trade: p.trade,
      city: p.city,
      state: p.state,
      completed: p.completed,
      title:
        photos.find((x) => x.phase === 'after')?.caption ||
        photos[0].caption ||
        `Custom tile work in ${p.city || 'the metro'}`,
      photos,
    });
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`Wrote ${out.length} project(s) → src/projects.json (+ photos in assets/img/projects/)`);
})();
