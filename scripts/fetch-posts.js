#!/usr/bin/env node
/**
 * Pull published blog posts from the Buddy Built platform into src/posts.json.
 * Write and publish in the platform (Marketing → Blog), then:
 *
 *   BT_API=http://localhost:5001 node scripts/fetch-posts.js   # dev
 *   node scripts/fetch-posts.js                                # prod API
 *
 * Exits gracefully keeping the existing posts.json if the API is unreachable.
 */
const fs = require('fs');
const path = require('path');

const API = process.env.BT_API || 'https://buddybuilt.com';
const OUT = path.join(__dirname, '..', 'src', 'posts.json');

(async () => {
  try {
    const res = await fetch(`${API}/api/public/blog?division=tile`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    fs.writeFileSync(OUT, JSON.stringify(posts, null, 2));
    console.log(`Wrote ${posts.length} post(s) → src/posts.json`);
  } catch (e) {
    console.error(`Could not reach ${API} (${e.message}) — keeping the existing posts.json`);
  }
})();
