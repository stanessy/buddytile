#!/usr/bin/env node
/**
 * Pull real Google reviews for the Buddy Tile GBP and cache them in
 * src/reviews.json — the build renders the newest three on the homepage.
 * Like the projects feed, this runs at build time so the live site is
 * fully static and never calls Google from a visitor's browser.
 *
 *   GOOGLE_MAPS_API_KEY=... node scripts/fetch-reviews.js
 *
 * Needs a Google Cloud key with the Places API enabled (one call per run —
 * effectively free). Without a key, or if Google is unreachable, it exits
 * gracefully and keeps whatever reviews.json already holds.
 *
 * Place resolution: BT_PLACE_ID env wins; otherwise the placeId cached in
 * reviews.json; otherwise a one-time Find Place search near the shop.
 */
const fs = require('fs');
const path = require('path');

const KEY = process.env.GOOGLE_MAPS_API_KEY;
const OUT = path.join(__dirname, '..', 'src', 'reviews.json');
const SEARCH = process.env.BT_PLACE_QUERY || 'Buddy Tile Vancouver WA';
// Shop coordinates from the GBP maps link — biases the search to our listing
const NEAR = '45.7021633,-122.6068511';

const readExisting = () => {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch {
    return null;
  }
};

const get = async (url) => {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.status && data.status !== 'OK') {
    throw new Error(`${data.status}${data.error_message ? `: ${data.error_message}` : ''}`);
  }
  return data;
};

(async () => {
  if (!KEY) {
    console.log('GOOGLE_MAPS_API_KEY not set — keeping existing reviews.json');
    return;
  }
  try {
    let placeId = process.env.BT_PLACE_ID || readExisting()?.placeId;
    if (!placeId) {
      const found = await get(
        'https://maps.googleapis.com/maps/api/place/findplacefromtext/json' +
          `?input=${encodeURIComponent(SEARCH)}&inputtype=textquery` +
          `&locationbias=circle:20000@${NEAR}&fields=place_id,name&key=${KEY}`
      );
      const c = found.candidates?.[0];
      if (!c) throw new Error(`no place found for "${SEARCH}"`);
      console.log(`Resolved "${c.name}" → ${c.place_id}`);
      placeId = c.place_id;
    }

    const details = await get(
      'https://maps.googleapis.com/maps/api/place/details/json' +
        `?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,url` +
        `&reviews_sort=newest&key=${KEY}`
    );
    const r = details.result;
    const reviews = (r.reviews || [])
      .filter((rev) => rev.text && rev.rating >= 4)
      .slice(0, 3)
      .map((rev) => ({
        author: rev.author_name,
        rating: rev.rating,
        text: rev.text.trim(),
        when: rev.relative_time_description,
        time: rev.time,
      }));

    fs.writeFileSync(
      OUT,
      JSON.stringify(
        {
          placeId,
          rating: r.rating || null,
          total: r.user_ratings_total || 0,
          mapsUrl: r.url || null,
          reviews,
        },
        null,
        2
      )
    );
    console.log(`Wrote ${reviews.length} review(s), ${r.rating}★ over ${r.user_ratings_total} → src/reviews.json`);
  } catch (e) {
    console.error(`Reviews fetch failed (${e.message}) — keeping existing reviews.json`);
  }
})();
