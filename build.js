#!/usr/bin/env node
/**
 * Buddy Tile static site generator, zero dependencies.
 * `node build.js` writes the whole site (HTML, sitemap, robots, assets) to site/.
 */
const fs = require('fs');
const path = require('path');
const { SITE, SERVICES, CITIES, NEARBY_TOWNS, STEPS, TRUST, PROMISE, TESTIMONIALS, BALLPARK, DESIGNER } = require('./src/data');
// Real jobs from two sources: the platform's portfolio feed (refresh with
// `node scripts/fetch-projects.js`) plus the hand-curated galleries in
// projects-manual.json. Platform jobs list first, they're local and dated.
let PROJECTS = [];
try {
  PROJECTS = require('./src/projects.json');
} catch {
  /* no projects fetched yet */
}
try {
  PROJECTS = [...PROJECTS, ...require('./src/projects-manual.json')];
} catch {
  /* no manual galleries */
}
// Blog posts, written in the platform: refresh with `node scripts/fetch-posts.js`
let POSTS = [];
try {
  POSTS = require('./src/posts.json');
} catch {
  /* no posts yet, blog pages simply don't render */
}
// Tiny markdown renderer, enough for posts: ## headings, **bold**, *em*,
// [links](url), - lists, paragraphs. No dependencies, like everything here.
const mdInline = (t) =>
  esc(t)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, a, b) => `<a href="${b.startsWith('http') || b.startsWith('/') ? b : '#'}">${a}</a>`);
const mdToHtml = (md) => {
  const out = [];
  let list = null;
  for (const raw of String(md || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (list && !line.startsWith('- ')) {
      out.push(`<ul>${list.join('')}</ul>`);
      list = null;
    }
    if (!line) continue;
    if (line.startsWith('### ')) out.push(`<h3>${mdInline(line.slice(4)).toUpperCase()}</h3>`);
    else if (line.startsWith('## ')) out.push(`<h2>${mdInline(line.slice(3)).toUpperCase()}</h2>`);
    else if (line.startsWith('- ')) (list = list || []).push(`<li>${mdInline(line.slice(2))}</li>`);
    else out.push(`<p>${mdInline(line)}</p>`);
  }
  if (list) out.push(`<ul>${list.join('')}</ul>`);
  return out.join('\n');
};
const postDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

// Real Google reviews: refresh with `node scripts/fetch-reviews.js` (needs
// GOOGLE_MAPS_API_KEY). Until real ones exist, the curated cards render.
let GOOGLE_REVIEWS = null;
try {
  const gr = require('./src/reviews.json');
  if (gr.reviews?.length) GOOGLE_REVIEWS = gr;
} catch {
  /* not fetched yet */
}
const monthYear = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
// Manual galleries may carry no city or date, say only what we know.
const projectByline = (pr) =>
  [pr.city ? `Tile work in ${pr.city}, ${pr.state}` : 'Tile, stone, and glass', pr.completed ? `Completed ${monthYear(pr.completed)}` : null, `Built by ${pr.brand || SITE.name}`]
    .filter(Boolean)
    .join(' · ');
const projectCard = (pr) => {
  const cover = pr.photos.find((x) => x.phase === 'after') || pr.photos[0];
  const sub = [pr.city ? `${pr.city}, ${pr.state}` : `${pr.photos.length} photos`, pr.completed ? monthYear(pr.completed) : null].filter(Boolean).join(' · ');
  return `<a class="card" href="/projects/${pr.slug}/"><img src="/assets/img/projects/${cover.file}" alt="${esc(pr.title)}${pr.city ? `, ${esc(pr.city)}, ${esc(pr.state)}` : ''}" loading="lazy" /><div class="body"><h3>${esc((pr.title || '').toUpperCase())}</h3><p>${esc(sub)}</p><div class="go">See this project →</div></div></a>`;
};

const OUT = path.join(__dirname, 'docs');
const V = Date.now().toString(36); // cache-buster for css/js
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---- Icon set: one stroke style everywhere (Lucide-style paths) -----------
const ICON_PATHS = {
  check: '<polyline points="20 6 9 17 4 12"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  droplet: '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  hammer: '<path d="m15 12-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15 22 10.64"/><path d="m20.91 11.7-1.25-1.25c-.6-.6-.93-1.4-.93-2.25v-.86L16.01 4.6a5.56 5.56 0 0 0-3.94-1.64H9l.92.82A6.18 6.18 0 0 1 12 8.4v1.56l2 2h2.47l2.26 1.91"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
  file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  chev: '<polyline points="6 9 12 15 18 9"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
};
const ico = (name, size = 24) =>
  `<svg class="ico" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name]}</svg>`;
const iconCircle = (name) => `<span class="ic">${ico(name, 26)}</span>`;
const telHref = () => `tel:${SITE.phone.replace(/[^0-9+]/g, '')}`;

// ---------- shared chrome ----------------------------------------------------

const header = (isHome) => `
<div class="topbar">
  <div class="container wide">
    <span class="tb-left">${ico('pin', 14)} Serving Vancouver, WA &amp; the Portland, OR metro <span class="tb-sep">·</span> ${ico('shield', 14)} Licensed, bonded &amp; insured in WA + OR</span>
    <span class="tb-right"><a href="mailto:${SITE.email}">${ico('mail', 14)} ${SITE.email}</a><a href="/pay/">Make a Payment</a></span>
  </div>
</div>
<header class="site-header${isHome ? ' home' : ''}">
  <div class="container wide">
    <a class="brand" href="/">
      <img class="brand-mark" src="/assets/img/buddy-tile-wordmark-white.png" alt="Buddy Tile" width="413" height="160" />
    </a>
    <nav class="site-nav">
      <a class="hide-m" href="/#services">Services</a>
      <a class="hide-m" href="/projects/">Our Work</a>
      <a class="hide-m" href="/#reviews">Reviews</a>
      <a class="hide-m" href="/design/">Ballpark Price</a>
      <a class="phone-link" href="${telHref()}">${ico('phone', 16)} ${SITE.phone}</a>
      <a class="btn" href="#estimate"${isHome ? ' data-open-estimate' : ''}>Free Estimate</a>
    </nav>
  </div>
</header>`;

const leadForm = (context) => `
<section class="estimate-band" id="estimate">
  <div class="container">
    <h2>READY TO <span class="hl">START</span> YOUR PROJECT?</h2>
    <p class="cta-sub">Two minutes now, an in-home visit this week, and your written estimate the same day. No pressure, ever.</p>
    <div class="estimate-card">
    <form class="lead-form" data-context="${esc(context)}">
      <input name="name" placeholder="Your name *" required maxlength="120" />
      <input name="phone" placeholder="Phone" maxlength="30" />
      <input name="email" type="email" placeholder="Email" class="full" maxlength="200" />
      <select name="city">
        <option value="">City…</option>
        ${CITIES.map((c) => `<option>${c.name}, ${c.state}</option>`).join('')}
      </select>
      <select name="projectType">
        <option value="">Project type…</option>
        <option>Tile shower remodel</option>
        <option>Bathroom floor / wall tile</option>
        <option>Kitchen backsplash</option>
        <option>Heated floors</option>
        <option>Repair / regrout</option>
        <option>Something else</option>
      </select>
      <textarea name="description" placeholder="Tell us about the project…" maxlength="3000"></textarea>
      <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" />
      <div class="human-check full">
        <label>Quick human check: what is <span class="hc-q">…</span>?
          <input name="humanCheck" inputmode="numeric" autocomplete="off" placeholder="?" required />
        </label>
      </div>
      <button class="btn" type="submit">Get My Free Estimate</button>
      <p class="form-status" hidden></p>
      <p class="form-note">We reply the same business day. Your info never gets sold. You're a neighbor, not a lead.</p>
    </form>
    </div>
  </div>
</section>`;

const footer = `
<footer class="site-footer">
  <div class="container">
    <div class="cols">
      <div class="badge-lockup">
        <img class="foot-mark" src="/assets/img/buddy-tile-wordmark-white.png" alt="Buddy Tile" loading="lazy" />
        <div class="caption">a BUDDY BUILT company</div>
        <p class="foot-blurb">Custom tile showers, bathroom remodels, backsplashes, and heated floors for Vancouver, WA and the Portland, OR metro. Family owned, licensed, bonded, and insured.</p>
      </div>
      <div>
        <h3>SERVICES</h3>
        <ul>${SERVICES.map((s) => `<li><a href="/services/${s.slug}/">${s.name}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h3>SERVICE AREA</h3>
        <ul>${CITIES.map((c) => `<li><a href="/tile-contractor/${c.slug}/">${c.name}, ${c.state}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h3>CONTACT</h3>
        <ul>
          <li><a href="tel:${SITE.phone.replace(/[^0-9+]/g, '')}">${SITE.phone}</a></li>
          <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
          <li><a href="/about/">About Buddy Tile</a></li>
          <li><a href="/blog/">Tile Talk, advice from the crew</a></li>
          <li><a href="https://buddybuilt.com" rel="noopener">The Buddy Built family</a></li>
          <li><a href="/privacy/">Privacy Policy</a></li>
          <li class="pay-row">
            <a href="https://buddybuilt.com/portal" target="_blank" rel="noopener">Customer Portal, track your project</a>
            <a class="pay-link" href="/pay/"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>Make a Payment</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <p>${SITE.legalLine}</p>
      <p>© ${new Date().getFullYear()} Buddy Built LLC · ${SITE.tagline} · <a href="https://buddybuilt.com">buddybuilt.com</a></p>
    </div>
  </div>
</footer>
<div class="mobile-cta">
  <a class="mc-call" href="tel:${SITE.phone.replace(/[^0-9+]/g, '')}">Call ${SITE.phone}</a>
  <a class="mc-est" href="#estimate">Free Estimate</a>
</div>
<script src="/assets/ballpark-config.js?v=${V}"></script>
<script src="/assets/main.js?v=${V}" defer></script>`;

const page = ({ url, title, description, jsonLd, body }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${SITE.domain}${url}" />
  <link rel="icon" href="/assets/img/buddy-tile-sm.png?v=4" />
  <link rel="stylesheet" href="/assets/styles.css?v=${V}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${SITE.domain}/assets/img/tile-shower-remodel-vancouver-wa.jpg" />
  <meta property="og:url" content="${SITE.domain}${url}" />
  <meta property="og:type" content="website" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
${header(url === '/')}
${body}
${footer}
</body>
</html>`;

const faqSection = (faqs) =>
  !faqs?.length
    ? ''
    : `
<section>
  <div class="container" style="max-width:840px;">
    <h2>QUESTIONS WE HEAR EVERY WEEK</h2>
    <hr class="gold-bar" />
    ${faqs
      .map(
        (f) => `<details style="border-bottom:1px solid #E5E7EB;padding:14px 0;"><summary style="font-weight:700;cursor:pointer;font-size:17px;">${esc(f.q)}</summary><p style="color:var(--stone);margin:10px 0 0;">${esc(f.a)}</p></details>`
      )
      .join('')}
  </div>
</section>`;

const faqLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: (faqs || []).map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

const businessLd = (extra = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: 'Buddy Tile',
  url: SITE.domain,
  telephone: SITE.phone,
  email: SITE.email,
  image: [
    `${SITE.domain}/assets/img/tile-shower-remodel-vancouver-wa.jpg`,
    `${SITE.domain}/assets/img/bathroom-tile-remodel-vancouver-wa.jpg`,
    `${SITE.domain}/assets/img/marble-tile-shower-glass-door.jpg`,
    `${SITE.domain}/assets/img/kitchen-tile-backsplash-installation.jpg`,
  ],
  logo: `${SITE.domain}/assets/img/buddy-tile.png?v=4`,
  slogan: SITE.tagline,
  parentOrganization: { '@type': 'Organization', name: 'Buddy Built LLC', url: 'https://buddybuilt.com' },
  areaServed: [...CITIES, ...NEARBY_TOWNS].map((c) => ({ '@type': 'City', name: `${c.name}, ${c.state}` })),
  priceRange: '$$',
  ...extra,
});

// ---------- pages ------------------------------------------------------------

// How-it-works step icons: clean filled SVGs instead of the old unicode glyphs
const hiwSvg = (d) => `<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true"><path d="${d}"/></svg>`;
const HIW_ICONS = [
  hiwSvg('M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z'),
  hiwSvg('M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'),
  hiwSvg('M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'),
  hiwSvg('M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z'),
];

// Featured on the homepage: one hero service, then four. Everything else is
// one click away on "Explore all services" (and still gets its own SEO page).
const FEATURED = ['shower-remodel', 'bathroom-tile', 'heated-floors', 'kitchen-backsplash', 'grout-cleaning'];
const svc = (slug) => SERVICES.find((x) => x.slug === slug);
const projectBySlug = (slug) => PROJECTS.find((x) => x.slug === slug);
const SHOWCASE = [
  { slug: 'whole-home-bathroom-remodel', photo: 'work-whole-home-bathroom-remodel-3.jpg', title: 'Herringbone shower, whole-home bathroom remodel', specs: 'Large-format porcelain · Herringbone accent band · Flood-tested pan · Frameless glass' },
  { slug: 'navy-brass-bathroom', photo: 'work-navy-brass-bathroom-4.jpg', title: 'Navy & brass bath', specs: 'Sculpted tile walls · Custom vanity · Brass fixtures' },
  { slug: 'chefs-kitchen-lattice-backsplash', photo: 'work-chefs-kitchen-lattice-backsplash-2.jpg', title: "Chef's kitchen, lattice backsplash", specs: 'Statement lattice · Full-height behind the range' },
];
const projectHref = (slug) => (projectBySlug(slug) ? `/projects/${slug}/` : '/projects/');
// Before/after only renders when a gallery actually has a "before" photo.
const BEFORE_AFTER = (() => {
  for (const pr of PROJECTS) {
    const before = (pr.photos || []).find((ph) => ph.phase === 'before');
    const after = (pr.photos || []).find((ph) => ph.phase === 'after');
    if (before && after) return { pr, before, after };
  }
  return null;
})();
const ratingLine = GOOGLE_REVIEWS && GOOGLE_REVIEWS.rating
  ? `<div class="hero-rating"><span class="stars">★★★★★</span> ${GOOGLE_REVIEWS.rating.toFixed(1)} from local homeowners on Google</div>`
  : `<div class="hero-rating">Family owned · Same-day written estimates · Licensed &amp; bonded</div>`;
const featuredReview = GOOGLE_REVIEWS && GOOGLE_REVIEWS.reviews?.length
  ? { text: GOOGLE_REVIEWS.reviews[0].text, who: GOOGLE_REVIEWS.reviews[0].author, where: 'Google review' }
  : { text: TESTIMONIALS[0].quote, who: TESTIMONIALS[0].name, where: TESTIMONIALS[0].where };

const estimateForm = (context, { compact = false } = {}) => `
<form class="lead-form hero-lead" data-context="${esc(context)}">
  <input name="name" placeholder="Your name *" required maxlength="120" class="full" />
  <input name="phone" type="tel" placeholder="Phone *" required maxlength="30" />
  <input name="email" type="email" placeholder="Email" maxlength="200" />
  <select name="projectType" class="full">
    <option value="">What are we building?</option>
    <option>Tile shower remodel</option>
    <option>Full bathroom remodel</option>
    <option>Bathroom floor / wall tile</option>
    <option>Kitchen backsplash</option>
    <option>Heated floors</option>
    <option>Grout cleaning &amp; sealing</option>
    <option>Repair / regrout</option>
  </select>
  ${compact ? '' : '<textarea name="description" placeholder="Tell us about the project…" maxlength="3000"></textarea>'}
  <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" />
  <div class="human-check full">
    <label>Quick human check: what is <span class="hc-q">…</span>?
      <input name="humanCheck" inputmode="numeric" autocomplete="off" placeholder="?" required />
    </label>
  </div>
  <button class="btn full" type="submit">Get My Free Estimate</button>
  <p class="form-status" hidden></p>
  <p class="form-note">We reply the same business day. Your info never gets sold. You're a neighbor, not a lead.</p>
</form>`;

// Homepage v3 (2026-09): contractor-marketing rhythm. Every section carries a
// photo, an icon, or brand color; Buddy appears three times; one CTA repeats.
const HOME_SERVICES = ['shower-remodel', 'bathroom-tile', 'kitchen-backsplash', 'heated-floors', 'tub-to-shower', 'grout-cleaning'];
const firstSentence = (t) => {
  const m = String(t || '').match(/^(.+?[.!?])(\s|$)/);
  return m ? m[1] : String(t || '');
};
const PROC_PHOTOS = ['real-bathroom-tile.jpg', 'craft-setting.jpg', 'craft-tile-hands.jpg', 'hero-master-bath-remodel.jpg'];
const PROC_ICONS = ['phone', 'pencil', 'hammer', 'smile'];
const WHY_ICONS = ['home', 'camera', 'lock', 'smile'];
const BLOG_FALLBACK = ['real-tile-shower.jpg', 'real-kitchen-backsplash.jpg', 'real-floor-tile.jpg'];
const HOME_FAQS = [...(svc('shower-remodel').faqs || []), ...(svc('grout-cleaning').faqs || []).slice(0, 1), ...(svc('heated-floors').faqs || []).slice(0, 1)];
const GOOGLE_REVIEWS_URL = GOOGLE_REVIEWS ? GOOGLE_REVIEWS.mapsUrl || `https://www.google.com/maps/place/?q=place_id:${GOOGLE_REVIEWS.placeId}` : 'https://www.google.com/maps/search/Buddy+Tile+Vancouver+WA';
const cityLink = (c) => `<li><a href="/tile-contractor/${c.slug}/">${ico('check', 14)} ${esc(c.name)}</a></li>`;
const townItem = (t) => `<li><span>${ico('check', 14)} ${esc(t.name)}</span></li>`;

const homeBody = `
<div class="home-hero v3">
  <div class="bg" style="background-image:url('/assets/img/hero-master-bath-remodel.jpg')"></div>
  <div class="scrim"></div>
  <div class="container wide hero-v3">
    <div class="hero-copy enter">
      <p class="eyebrow light">Vancouver, WA · Portland, OR</p>
      <h1>CUSTOM TILE SHOWERS, BATHROOMS &amp; <span class="gold">GROUT CLEANING</span><span class="h1-states">BUILT FOR WASHINGTON &amp; OREGON HOMES</span></h1>
      <p class="lead">Licensed, bonded tile craftsmen who build showers, bathroom remodels, backsplashes, and heated floors on flood-tested waterproofing, and bring tired tile back with grout cleaning, sealing, and regrouts. Written price in your inbox the same day we measure.</p>
      <div class="hero-btns">
        <a class="btn btn-lg" href="${telHref()}">${ico('phone', 18)} ${SITE.phone}</a>
        <a class="btn ghost btn-lg" href="/design/">Instant ballpark price →</a>
      </div>
      <div class="hero-proof">
        ${['Family owned', 'Licensed &amp; bonded', 'Flood-tested waterproofing', 'Same-day written estimates'].map((t) => `<span>${ico('checkCircle', 16)}${t}</span>`).join('')}
      </div>
    </div>
    <div class="hero-side">
    <div class="hero-mascot enter" style="--i:1">
      <img src="/assets/img/buddy-mascot-thumbs.webp" alt="Buddy, the Buddy Tile mascot, giving a thumbs up" width="735" height="1000" />
    </div>
    <div class="hero-card enter" style="--i:2">
      <p class="eyebrow">Free In-Home Estimate</p>
      <h3>Tell us about your project.</h3>
      <p class="hero-card-sub">We measure in person, and your written estimate arrives the same day.</p>
      ${estimateForm('hero', { compact: true })}
      <p class="hero-card-alt">Just browsing? <a href="/design/">Design your shower &amp; get an instant ballpark →</a></p>
    </div>
    </div>
  </div>
</div>

<div class="hero-tiles">
  <div class="container wide">
    <div class="ht-grid">
      <div class="ht">${iconCircle('users')}<h3>Family owned &amp; local</h3><p>You talk to the owner, and the person who quotes your job knows the crew by name.</p></div>
      <div class="ht">${iconCircle('droplet')}<h3>Flood-tested waterproofing</h3><p>Every shower pan is flood-tested and photographed before a single tile goes on.</p></div>
      <div class="ht">${iconCircle('file')}<h3>Same-day written estimates</h3><p>We measure in person, and your written price is in your inbox before dinner.</p></div>
      <div class="ht gold"><div class="big">5–8 <span>days</span></div><h3>For most shower installs</h3><p>Start to finish, with daily photos to your phone. Larger or more complex jobs take longer, and we tell you that before we start.</p></div>
    </div>
  </div>
</div>

<section class="sec" id="about">
  <div class="container wide intro-grid">
    <div class="reveal">
      <p class="eyebrow">Tile work built the right way</p>
      <h2 class="h-xl">Showers and floors that <span class="hl">outlast</span> the house.</h2>
      <p class="sub">Buddy Tile is a family-owned tile contractor serving Vancouver, Camas, and Battle Ground in Washington and the Portland metro in Oregon. We build custom tile showers, bathroom remodels, tub-to-shower conversions, heated floors, and backsplashes, and we bring tired tile back to life with grout cleaning, sealing, and regrouts.</p>
      <p class="sub">Every shower is built on a full Schluter-system membrane and flood-tested before tile. Every job gets floor runners, dust walls, and a vacuumed site each night. And every price is written down before we start.</p>
      <ul class="check-list">
        ${TRUST.slice(0, 4).map((t) => `<li>${ico('checkCircle', 20)}<div><strong>${esc(t.title)}</strong><span>${esc(t.body)}</span></div></li>`).join('')}
      </ul>
      <a class="btn" href="#estimate" data-open-estimate>Get a Free Estimate</a>
    </div>
    <figure class="intro-photo reveal reveal-img" style="--i:1">
      <div class="frame"><img src="/assets/img/craft-setting.jpg" alt="Buddy Tile installer setting large-format tile" loading="lazy" /></div>
      <figcaption>The work you never see: waterproofing and a flat substrate, photographed before tile covers it.</figcaption>
    </figure>
  </div>
</section>

<div class="trust-row">
  <div class="container wide">
    <span>${ico('shield', 22)} Licensed, bonded &amp; insured</span>
    <span>${ico('award', 22)} Warrantied by name</span>
    <span>${ico('camera', 22)} Daily progress photos</span>
    <span>${ico('pin', 22)} Crews in WA + OR</span>
  </div>
</div>

<section class="sec paper" id="services">
  <div class="container wide">
    <div class="sec-head center reveal">
      <p class="eyebrow">What we build</p>
      <h2 class="h-xl">Showers, floors &amp; backsplashes built for the <span class="hl">Pacific Northwest</span></h2>
      <p class="sub">Wet climate, old houses, and a lot of tile that was set over drywall. We build for the room you have, on the waterproofing it should have had.</p>
    </div>
    <div class="svc-cards">
      ${HOME_SERVICES.map((slug, i) => {
        const x = svc(slug);
        return `<a class="svc-card reveal" style="--i:${i}" href="/services/${x.slug}/">
        <div class="svc-img"><img src="/assets/img/${x.photo}" alt="${esc(x.name)}" loading="lazy" /></div>
        <div class="svc-body">
          <h3>${esc(x.name)}</h3>
          <p>${esc(firstSentence(x.intro))}</p>
          <span class="btn sm">Explore ${esc(x.name.split(' ')[0].toLowerCase() === 'custom' ? 'showers' : x.name.toLowerCase())} →</span>
        </div>
      </a>`;
      }).join('')}
    </div>
    <div class="all-services v3 reveal">
      <span class="all-label">All ${SERVICES.length} services:</span>
      ${SERVICES.map((x) => `<a href="/services/${x.slug}/">${esc(x.name)}</a>`).join('')}
    </div>
  </div>
</section>

${
  PROJECTS.length
    ? `<section class="sec" id="work">
  <div class="container wide">
    <div class="sec-head center reveal">
      <p class="eyebrow">Our work</p>
      <h2 class="h-xl">Real jobs. Real homes. <span class="hl">Real photos.</span></h2>
      <p class="sub">Photographed by the crew that built it, including the waterproofing you'd never otherwise see. No stock photos, ever.</p>
    </div>
    <div class="grid cols-3">${PROJECTS.slice(0, 3).map(projectCard).join('')}</div>
    <div class="sec-foot center reveal"><a class="btn ghost-dark" href="/projects/">See all projects →</a></div>
  </div>
</section>`
    : ''
}

<section class="cta-band">
  <img class="cta-buddy" src="/assets/img/buddy-mascot-thumbs.webp" alt="" aria-hidden="true" loading="lazy" />
  <div class="container center reveal">
    <p class="eyebrow light">We're ready when you are</p>
    <h2 class="h-xl light">Let's build something <span class="hl">strong</span> for your home.</h2>
    <a class="btn btn-lg" href="#estimate" data-open-estimate>Get a Free Estimate</a>
  </div>
</section>

<section class="sec" id="how-it-works">
  <div class="container wide">
    <div class="sec-head center reveal">
      <p class="eyebrow">How it works</p>
      <h2 class="h-xl">A simple, stress-free process from <span class="hl">start to finish</span></h2>
      <p class="sub">From your first call to the final walkthrough, you always know what happens next and who's doing it.</p>
    </div>
    <div class="proc-cards">
      ${STEPS.map(
        (st, i) => `<div class="pc reveal" style="--i:${i}">
        <div class="pc-photo"><img src="/assets/img/${PROC_PHOTOS[i]}" alt="" loading="lazy" /><span class="pc-num">${i + 1}</span></div>
        ${iconCircle(PROC_ICONS[i])}
        <h3>${esc(st.title)}</h3>
        <p>${esc(st.body)}</p>
      </div>`
      ).join('')}
    </div>
  </div>
</section>

<section class="why" id="standard">
  <div class="why-bg" style="background-image:url('/assets/img/real-walkin-shower.jpg')"></div>
  <div class="container wide why-in">
    <div class="sec-head center reveal">
      <p class="eyebrow light">The Buddy standard</p>
      <h2 class="h-xl light">Why homeowners trust <span class="hl">Buddy Tile</span></h2>
      <p class="sub light">No disappearing contractors. No mystery schedules. No wondering what's next.</p>
    </div>
    <div class="why-grid">
      ${PROMISE.map((pr, i) => `<div class="wc reveal" style="--i:${i}">${iconCircle(WHY_ICONS[i])}<div><h3>${esc(pr.title)}</h3><p>${esc(pr.body)}</p></div></div>`).join('')}
    </div>
  </div>
</section>

<section class="area-sec" id="service-area">
  <div id="service-map" class="area-bg" aria-label="Map of Buddy Tile service cities in Washington and Oregon"></div>
  <div class="container wide area-over">
    <div class="area-card reveal">
      <p class="eyebrow">Service area</p>
      <h2>Proudly serving Portland, Vancouver &amp; nearby communities</h2>
      <p class="area-sub">Buddy Tile is rooted in the Pacific Northwest. Crews roll out of Vancouver every morning and cover both sides of the river, the Willamette Valley, the Gorge, and the north Oregon coast. Tap a city to find it on the map.</p>
      <div class="area-cols">
        ${['OR', 'WA']
          .map(
            (st) => `<div class="area-col ${st === 'OR' ? 'or' : 'wa'}">
          <div class="state">${st === 'WA' ? 'Washington' : 'Oregon'}</div>
          <ul class="city-list${st === 'OR' ? ' cols2' : ''}">
            ${CITIES.filter((c) => c.state === st)
              .map((c) => `<li><button type="button" class="city-btn" data-city="${c.slug}">${esc(c.name)}</button><a class="city-go" href="/tile-contractor/${c.slug}/" aria-label="Tile work in ${esc(c.name)}">→</a></li>`)
              .join('')}
            ${NEARBY_TOWNS.filter((t) => t.state === st)
              .map((t) => `<li><button type="button" class="city-btn" data-town="${esc(t.name)}">${esc(t.name)}</button></li>`)
              .join('')}
          </ul>
        </div>`
          )
          .join('')}
      </div>
      <p class="map-note">Area not listed? <a href="#estimate" data-open-estimate>Give us a call</a>, we may still come to you.</p>
    </div>
  </div>
</section>
<script>window.BT_SERVICE_AREA = ${JSON.stringify({
  cities: CITIES.map((c) => ({ slug: c.slug, name: c.name, state: c.state, lat: c.lat, lng: c.lng, url: `/tile-contractor/${c.slug}/`, hoods: c.neighborhoods.slice(0, 4) })),
  towns: NEARBY_TOWNS,
})};</script>

<section class="sec" id="reviews">
  <div class="container wide">
    <div class="sec-head center reveal">
      <p class="eyebrow">Reviews</p>
      <h2 class="h-xl">Trusted by families across <span class="hl">Vancouver &amp; Portland</span></h2>
      <p class="sub">We treat every home like it's ours. Here's what that looks like from the homeowner's side.</p>
    </div>
    <div class="quote-grid">
      ${(GOOGLE_REVIEWS && GOOGLE_REVIEWS.reviews?.length ? GOOGLE_REVIEWS.reviews.slice(0, 3).map((r) => ({ quote: r.text, name: r.author, where: 'Google review' })) : TESTIMONIALS)
        .map((t, i) => `<div class="quote-card reveal" style="--i:${i}"><div class="stars">★★★★★</div><blockquote>“${esc(t.quote)}”</blockquote><div class="who">${esc(t.name)}</div><div class="where">${esc(t.where)}</div></div>`)
        .join('')}
    </div>
    <div class="sec-foot center reveal"><a class="btn ghost-dark" href="${esc(GOOGLE_REVIEWS_URL)}" target="_blank" rel="noopener">Read our Google reviews →</a></div>
  </div>
</section>

${
  POSTS.length
    ? `<section class="sec navy" id="tile-talk">
  <div class="container wide">
    <div class="sec-head center reveal">
      <p class="eyebrow light">Tile Talk</p>
      <h2 class="h-xl light">Straight answers for Northwest <span class="hl">homeowners</span></h2>
      <p class="sub light">Prices, materials, and what to expect, written by the people who set the tile.</p>
    </div>
    <div class="post-cards">
      ${POSTS.slice(0, 3)
        .map(
          (p, i) => `<a class="post-card reveal" style="--i:${i}" href="/blog/${p.slug}/">
        <img src="/assets/img/${BLOG_FALLBACK[i % BLOG_FALLBACK.length]}" alt="" loading="lazy" />
        <div class="body"><div class="date">${postDate(p.publishedAt)}</div><h3>${esc(p.title)}</h3><p>${esc(p.excerpt || '')}</p><span class="btn sm">Read more →</span></div>
      </a>`
        )
        .join('')}
    </div>
    <div class="sec-foot center reveal"><a class="btn ghost" href="/blog/">All articles →</a></div>
  </div>
</section>`
    : ''
}

<section class="sec paper" id="faq">
  <div class="container faq-wrap">
    <div class="sec-head center reveal">
      <p class="eyebrow">FAQ</p>
      <h2 class="h-xl">Questions we hear <span class="hl">every week</span></h2>
    </div>
    <div class="faq-list reveal">
      ${HOME_FAQS.map((f) => `<details class="faq"><summary>${esc(f.q)}${ico('chev', 20)}</summary><p>${esc(f.a)}</p></details>`).join('')}
    </div>
  </div>
</section>

<section class="final v3" id="estimate">
  <div class="container wide final-grid">
    <div class="final-copy reveal">
      <p class="eyebrow light">Free in-home estimate</p>
      <h2 class="h-xl light">Ready to upgrade your <span class="hl">bathroom?</span></h2>
      <p class="sub light">Two minutes now, an in-home visit this week, and your written estimate the same day. No pressure, ever.</p>
      <div class="final-contact">
        <a href="${telHref()}">${ico('phone', 20)} ${SITE.phone}</a>
        <a href="mailto:${SITE.email}">${ico('mail', 20)} ${SITE.email}</a>
      </div>
      <img class="final-buddy" src="/assets/img/buddy-mascot-thumbs.webp" alt="" aria-hidden="true" loading="lazy" />
    </div>
    <div class="estimate-card reveal" style="--i:1">
      ${estimateForm('home')}
    </div>
  </div>
</section>

<div class="modal" id="estimate-modal" hidden>
  <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="estimate-modal-title">
    <button class="modal-x" type="button" aria-label="Close" data-close-estimate>×</button>
    <p class="eyebrow">Free In-Home Estimate</p>
    <h3 id="estimate-modal-title">Tell us about your project.</h3>
    <p class="hero-card-sub">We measure in person, and your written estimate arrives the same day.</p>
    ${estimateForm('modal', { compact: true })}
    <p class="hero-card-alt">Just browsing? <a href="/design/">Design your shower &amp; get an instant ballpark →</a></p>
  </div>
</div>`;

const HERO_CHIPS = `<div class="chips">
        <span>Family owned</span><span>Licensed &amp; bonded</span><span>Flood-tested waterproofing</span><span>Same-day written estimates</span>
      </div>`;

const heroCard = (context) => `
    <div class="hero-card">
      <h3>GET A FREE IN-HOME ESTIMATE</h3>
      <p class="hero-card-sub">We measure in person, and your written estimate arrives the same day.</p>
      <form class="lead-form hero-lead" data-context="${context}">
        <input name="name" placeholder="Your name *" required maxlength="120" class="full" />
        <input name="phone" type="tel" placeholder="Phone *" required maxlength="30" />
        <select name="projectType">
          <option value="">Project…</option>
          <option>Tile shower remodel</option>
          <option>Bathroom floor / wall tile</option>
          <option>Kitchen backsplash</option>
          <option>Heated floors</option>
          <option>Repair / regrout</option>
        </select>
        <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" />
        <div class="human-check full">
        <label>Quick human check: what is <span class="hc-q">…</span>?
          <input name="humanCheck" inputmode="numeric" autocomplete="off" placeholder="?" required />
        </label>
      </div>
        <button class="btn full" type="submit">Get My Free Estimate</button>
        <p class="form-status" hidden></p>
      </form>
      <p class="hero-card-alt">Just browsing? <a href="/design/">Design your shower &amp; get an instant ballpark →</a></p>
    </div>`;

const pageHero = ({ h1, lead, photo, context }) => `
<div class="hero">
  <div class="bg" style="background-image:url('/assets/img/${photo}')"></div>
  <div class="scrim"></div>
  <div class="container hero-grid">
    <div>
      <h1>${h1}</h1>
      <hr class="gold-bar" />
      <p class="lead">${lead}</p>
      ${HERO_CHIPS}
    </div>
${heroCard(context)}
  </div>
</div>`;


const servicePage = (s) => `
${pageHero({
  h1: `${s.h1.toUpperCase()} IN <span class="gold">VANCOUVER, WA</span> &amp; PORTLAND, OR`,
  lead: esc(s.intro),
  photo: s.photo,
  context: `service:${s.slug}`,
})}
<div class="container breadcrumbs crumbs-after-hero"><a href="/">Home</a> / <a href="/#services">Services</a> / ${s.name}</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h2>WHAT'S INCLUDED</h2>
      <hr class="gold-bar" />
      <ul class="tick-list">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <p><a class="btn" href="#estimate">Get My Free Estimate</a></p>
    </div>
    <div>
      <img class="rounded-img" src="/assets/img/${s.photo}" alt="${esc(s.h1)} in Vancouver, WA and Portland, OR" />
      <p style="color:var(--stone);font-size:14px;margin-top:12px;">${SITE.serviceAreaBlurb}</p>
    </div>
  </div>
</section>
<section class="alt">
  <div class="container">
    <h2>MORE FROM BUDDY TILE</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${SERVICES.filter((x) => x.slug !== s.slug)
        .slice(0, 3)
        .map((x) => `<a class="card" href="/services/${x.slug}/"><div class="body"><h3>${x.name.toUpperCase()}</h3><div class="go">Learn more →</div></div></a>`)
        .join('')}
    </div>
  </div>
</section>
${faqSection(s.faqs)}
<section class="alt">
  <div class="container">
    <h2>${s.name.toUpperCase()} NEAR YOU</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${CITIES.map(
        (c) => `<a class="card" href="/services/${s.slug}/${c.slug}/"><div class="body"><h3>${c.name.toUpperCase()}, ${c.state}</h3><div class="go">${esc(s.name)} in ${c.name} →</div></div></a>`
      ).join('')}
    </div>
  </div>
</section>
${leadForm(`service:${s.slug}`)}`;

// The matrix page: one service in one city, localized copy, prices, and
// neighborhoods so every page earns its ranking instead of being a doorway.
const serviceCityPage = (s, c) => `
${pageHero({
  h1: `${s.h1.toUpperCase()} IN <span class="gold">${c.name.toUpperCase()}, ${c.state}</span>`,
  lead: esc(s.intro),
  photo: s.photo,
  context: `service:${s.slug}:${c.slug}`,
})}
<div class="container breadcrumbs crumbs-after-hero"><a href="/">Home</a> / <a href="/services/${s.slug}/">${esc(s.name)}</a> / ${c.name}, ${c.state}</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h2>${s.name.toUpperCase()} IN ${c.name.toUpperCase()}, ${c.state}</h2>
      <hr class="gold-bar" />
      <p>${esc(c.blurb)} We regularly work in ${c.neighborhoods.slice(0, -1).join(', ')} and ${c.neighborhoods[c.neighborhoods.length - 1]}, free in-home estimates, written the same day.</p>
      <ul class="tick-list">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <p><a class="btn" href="#estimate">Get My ${c.name} Estimate</a></p>
    </div>
    <div>
      <img class="rounded-img" src="/assets/img/${s.photo}" alt="${esc(s.h1)} in ${esc(c.name)}, ${c.state}" />
      <p style="color:var(--stone);font-size:14px;margin-top:12px;">Licensed, bonded &amp; insured · Serving ${c.name} and the surrounding metro.</p>
    </div>
  </div>
</section>
${faqSection(s.faqs)}
<section class="alt">
  <div class="container">
    <h2>MORE TILE WORK IN ${c.name.toUpperCase()}</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${SERVICES.filter((x) => x.slug !== s.slug)
        .slice(0, 6)
        .map((x) => `<a class="card" href="/services/${x.slug}/${c.slug}/"><div class="body"><h3>${x.name.toUpperCase()}</h3><div class="go">${esc(x.name)} in ${c.name} →</div></div></a>`)
        .join('')}
    </div>
    <p style="margin-top:18px;"><a href="/tile-contractor/${c.slug}/">Everything we do in ${c.name}, ${c.state} →</a>
      ${CITIES.filter((x) => x.slug !== c.slug).slice(0, 3).map((x) => ` · <a href="/services/${s.slug}/${x.slug}/">${esc(s.name)} in ${x.name}</a>`).join('')}
    </p>
  </div>
</section>
${leadForm(`service:${s.slug}:${c.slug}`)}`;

const cityPage = (c) => `
${pageHero({
  h1: `TILE CONTRACTOR IN <span class="gold">${c.name.toUpperCase()}, ${c.state}</span>`,
  lead: `Custom tile showers, bathroom floors, backsplashes, heated floors, and grout cleaning for ${c.name} homeowners. ${esc(c.blurb)}`,
  photo: 'bathroom-tile-remodel-vancouver-wa.jpg',
  context: `city:${c.slug}`,
})}
<div class="container breadcrumbs crumbs-after-hero"><a href="/">Home</a> / <a href="/#service-area">Service Area</a> / ${c.name}, ${c.state}</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h2>WHY ${c.name.toUpperCase()} HOMEOWNERS CALL US</h2>
      <hr class="gold-bar" />
      <ul class="tick-list">
        <li>Free in-home visits in ${c.name}, written estimate the same day</li>
        <li>Licensed, bonded &amp; insured in Washington and Oregon</li>
        <li>Schluter-system waterproofing on every shower, flood-tested</li>
        <li>Approve your estimate online; watch daily progress photos</li>
      </ul>
      <p><a class="btn" href="#estimate">Get My ${c.name} Estimate</a></p>
    </div>
    <div>
      <img class="rounded-img" src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="Tile bathroom remodel in ${esc(c.name)}, ${c.state}" />
    </div>
  </div>
</section>
<section class="alt">
  <div class="container">
    <h2>EVERYTHING WE DO IN ${c.name.toUpperCase()}</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${SERVICES.map(
        (x) => `<a class="card" href="/services/${x.slug}/${c.slug}/"><img src="/assets/img/${x.photo}" alt="${esc(x.name)} in ${esc(c.name)}, ${c.state}" loading="lazy" /><div class="body"><h3>${x.name.toUpperCase()}</h3><div class="go">${esc(x.name)} in ${c.name} →</div></div></a>`
      ).join('')}
    </div>
  </div>
</section>
${leadForm(`city:${c.slug}`)}`;

const projectsIndexBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Our Work</div>
<section style="padding-top:26px;">
  <div class="container">
    <h1>REAL JOBS. REAL HOMES. REAL PHOTOS.</h1>
    <hr class="gold-bar" />
    <p class="lead" style="max-width:760px;">Every project below is a real ${SITE.name} job, photographed by the crew that built it, including the waterproofing you'd never otherwise see. No stock photos, ever.</p>
    <div class="grid cols-3" style="margin-top:22px;">
      ${PROJECTS.map(projectCard).join('')}
    </div>
    ${PROJECTS.length === 0 ? '<p style="color:var(--stone);">Fresh projects are on the way, check back soon.</p>' : ''}
  </div>
</section>
${leadForm('projects')}`;

const projectPage = (pr) => {
  const cityMatch = CITIES.find((c) => c.name.toLowerCase() === (pr.city || '').toLowerCase());
  return `
<div class="container breadcrumbs"><a href="/">Home</a> / <a href="/projects/">Our Work</a> / ${esc(pr.city || 'Project')}</div>
<section style="padding-top:26px;">
  <div class="container">
    <h1>${esc(pr.title.toUpperCase())}</h1>
    <hr class="gold-bar" />
    <p class="lead">${esc(projectByline(pr))}</p>
    <div class="grid cols-2" style="margin-top:20px;">
      ${pr.photos
        .map(
          (ph) => `<figure style="margin:0;">
        <img class="rounded-img" src="/assets/img/projects/${ph.file}" alt="${esc(ph.caption || pr.title)}" loading="lazy" />
        <figcaption style="color:var(--stone);font-size:14px;margin-top:8px;">${ph.phase ? `<strong style="color:var(--navy);text-transform:uppercase;font-size:12px;letter-spacing:.06em;">${esc(ph.phase)}</strong> · ` : ''}${esc(ph.caption || '')}</figcaption>
      </figure>`
        )
        .join('')}
    </div>
    <p style="margin-top:24px;"><a class="btn" href="#estimate">Get a project like this priced free</a></p>
  </div>
</section>
<section class="alt">
  <div class="container">
    <h2>WANT THIS IN YOUR HOME?</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${SERVICES.slice(0, 3)
        .map((x) => `<a class="card" href="/services/${x.slug}/${cityMatch ? cityMatch.slug + '/' : ''}"><div class="body"><h3>${x.name.toUpperCase()}</h3><div class="go">${esc(x.name)}${cityMatch ? ` in ${cityMatch.name}` : ''} →</div></div></a>`)
        .join('')}
    </div>
    ${cityMatch ? `<p style="margin-top:18px;"><a href="/tile-contractor/${cityMatch.slug}/">Everything we do in ${cityMatch.name}, ${cityMatch.state} →</a></p>` : ''}
  </div>
</section>
${leadForm(`project:${pr.slug}`)}`;
};

const aboutBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / About</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h1>ONE COMPANY. EXPERTS IN EVERY TRADE.</h1>
      <hr class="gold-bar" />
      <p class="lead">Buddy Tile is the tile division of Buddy Built, a family of home-service brands built on one idea: hire the company, not a stranger from a lead site.</p>
      <p>Every Buddy crew works to one standard, carries one warranty, and answers to one phone number. Your estimator sketches your Tile Plan in your bathroom, sends your written estimate the same day, and the crew that shows up builds exactly what you approved, with photos of the waterproofing before it disappears behind tile.</p>
      <p>Need glass, plumbing, or flooring alongside the tile? That's the point of the family, one call brings the right Buddy trade, and everything lands on a single estimate.</p>
      <p><a class="btn" href="#estimate">Get My Free Estimate</a></p>
    </div>
    <div>
      <img class="rounded-img" src="/assets/img/craft-setting.jpg" alt="Buddy Tile craftsmanship" />
    </div>
  </div>
</section>
${leadForm('about')}`;

// ---------- build ------------------------------------------------------------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
fs.cpSync(path.join(__dirname, 'assets'), path.join(OUT, 'assets'), { recursive: true });
fs.copyFileSync(path.join(__dirname, 'src/styles.css'), path.join(OUT, 'assets/styles.css'));
fs.copyFileSync(path.join(__dirname, 'src/main.js'), path.join(OUT, 'assets/main.js'));
fs.writeFileSync(path.join(OUT, 'assets/ballpark-config.js'), `window.BT_BALLPARK = ${JSON.stringify(BALLPARK)};\nwindow.BT_DESIGNER = ${JSON.stringify(DESIGNER)};`);

const write = (url, html) => {
  const dir = path.join(OUT, url);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
};

const urls = [];
const add = (url, opts) => {
  urls.push(url);
  write(url, page({ url, ...opts }));
};

add('/', {
  title: 'Buddy Tile, Custom Tile Showers & Bathroom Remodels | Vancouver WA & Portland OR',
  description:
    'Custom tile showers, bathroom floors, backsplashes, and heated floors in Vancouver WA and Portland OR. Free in-home estimates, online approval. A Buddy Built company.',
  jsonLd: businessLd(),
  body: homeBody,
});

for (const s of SERVICES) {
  add(`/services/${s.slug}/`, {
    title: s.metaTitle,
    description: s.metaDescription,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: s.h1,
        description: s.metaDescription,
        provider: businessLd(),
        areaServed: CITIES.map((c) => `${c.name}, ${c.state}`),
      },
      faqLd(s.faqs),
    ],
    body: servicePage(s),
  });
  // One page per service per city, the long-tail matrix
  for (const c of CITIES) {
    add(`/services/${s.slug}/${c.slug}/`, {
      title: `${s.name} in ${c.name}, ${c.state} | Buddy Tile`,
      description: `${s.name} for ${c.name}, ${c.state} homeowners, free in-home estimates, licensed & bonded. ${s.metaDescription}`.slice(0, 300),
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: `${s.h1} in ${c.name}, ${c.state}`,
          description: s.metaDescription,
          provider: businessLd(),
          areaServed: { '@type': 'City', name: `${c.name}, ${c.state}` },
        },
        faqLd(s.faqs),
      ],
      body: serviceCityPage(s, c),
    });
  }
}

for (const c of CITIES) {
  add(`/tile-contractor/${c.slug}/`, {
    title: `Tile Contractor in ${c.name}, ${c.state} | Showers, Floors, Backsplashes | Buddy Tile`,
    description: `Buddy Tile installs custom showers, bathroom tile, and backsplashes in ${c.name}, ${c.state}. Free in-home estimates, licensed & bonded.`,
    jsonLd: businessLd({ areaServed: { '@type': 'City', name: `${c.name}, ${c.state}` } }),
    body: cityPage(c),
  });
}

add('/projects/', {
  title: `Our Work, Real Tile Projects in Vancouver WA & Portland OR | ${SITE.name}`,
  description:
    'Real tile showers, floors, and backsplashes photographed by the crews that built them, including the waterproofing you never see. Vancouver WA & Portland OR.',
  jsonLd: businessLd(),
  body: projectsIndexBody,
});
for (const pr of PROJECTS) {
  add(`/projects/${pr.slug}/`, {
    title: `${pr.title}${pr.city ? `, ${pr.city}, ${pr.state}` : ''} | ${SITE.name} Project`,
    description: `${pr.title}: a real ${SITE.name} project${pr.city ? ` in ${pr.city}, ${pr.state}` : ''}${pr.completed ? `, completed ${monthYear(pr.completed)}` : ''}, with the crew's own photos.`,
    jsonLd: [
      businessLd(),
      {
        '@context': 'https://schema.org',
        '@type': 'ImageGallery',
        name: pr.title,
        description: pr.city ? `Tile project in ${pr.city}, ${pr.state}` : `A real ${SITE.name} tile project`,
        image: pr.photos.map((ph) => `${SITE.domain}/assets/img/projects/${ph.file}`),
      },
    ],
    body: projectPage(pr),
  });
}


const payBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Make a Payment</div>
<section style="padding-top:26px;">
  <div class="container" style="max-width:640px;">
    <h1>MAKE A <span class="hl">PAYMENT</span></h1>
    <p class="lead">Pay your deposit or invoice online. Enter your invoice number and the email we have on file, and we'll send your secure payment page, card or Zelle.</p>
    <form id="pay-lookup" class="lead-form" style="max-width:520px;">
      <input name="number" placeholder="Invoice number *" required maxlength="40" />
      <input name="email" type="email" placeholder="Email on the invoice *" required maxlength="200" />
      <button class="btn full" type="submit">Email Me My Payment Link</button>
      <p class="form-status" hidden></p>
      <p class="form-note" style="color:var(--stone);">Your invoice number is at the top of the invoice we emailed you. The payment page is private to you, that's why we send it to your email instead of showing it here.</p>
    </form>
    <div style="margin-top:34px;border-top:1px solid var(--line);padding-top:22px;">
      <h3>PREFER TO TALK TO A PERSON?</h3>
      <p style="color:var(--stone);">Call <a href="tel:${SITE.phone.replace(/[^0-9+]/g, '')}" style="font-weight:700;">${SITE.phone}</a> and we'll take your payment over the phone or answer anything about your invoice. Card, Zelle, or check, whatever is easiest for you.</p>
    </div>
  </div>
</section>`;

add('/pay/', {
  title: 'Make a Payment | Buddy Tile',
  description:
    'Pay your Buddy Tile deposit or invoice online, card or Zelle. Enter your invoice number and we email your secure payment link.',
  jsonLd: null,
  body: payBody,
});

if (POSTS.length) {
  const blogIndexBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Tile Talk</div>
<section style="padding-top:26px;">
  <div class="container">
    <h1>TILE <span class="hl">TALK</span></h1>
    <p class="lead" style="max-width:720px;">Straight answers about tile, showers, and remodeling in the Northwest, written by the people who do the work. No fluff, real prices, real photos.</p>
    <div class="grid cols-3" style="margin-top:22px;">
      ${POSTS.map(
        (p) => `<a class="card" href="/blog/${p.slug}/"><div class="body"><h3>${esc(p.title.toUpperCase())}</h3><p>${esc(p.excerpt || '')}</p><div class="go">Read it →</div></div></a>`
      ).join('')}
    </div>
  </div>
</section>
${leadForm('blog')}`;

  add('/blog/', {
    title: `Tile Talk, Advice From the Crew | ${SITE.name}`,
    description:
      'Straight answers about tile showers, bathroom remodels, and grout from a working tile crew in Vancouver WA and Portland OR.',
    jsonLd: businessLd(),
    body: blogIndexBody,
  });

  for (const p of POSTS) {
    add(`/blog/${p.slug}/`, {
      title: `${p.title} | ${SITE.name}`,
      description: (p.excerpt || p.title).slice(0, 300),
      jsonLd: [
        businessLd(),
        {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: p.title,
          description: p.excerpt || undefined,
          datePublished: p.publishedAt,
          dateModified: p.updatedAt || p.publishedAt,
          author: { '@type': 'Organization', name: SITE.name },
          publisher: { '@type': 'Organization', name: SITE.name },
          mainEntityOfPage: `${SITE.domain}/blog/${p.slug}/`,
        },
      ],
      body: `
<div class="container breadcrumbs"><a href="/">Home</a> / <a href="/blog/">Tile Talk</a> / ${esc(p.title)}</div>
<section style="padding-top:26px;">
  <div class="container" style="max-width:760px;">
    <h1>${esc(p.title.toUpperCase())}</h1>
    <p style="color:var(--stone);font-size:14px;">${postDate(p.publishedAt)} · ${SITE.name}</p>
    <div class="post-body">${mdToHtml(p.bodyMd)}</div>
    <p style="margin-top:30px;"><a class="btn" href="#estimate">Get My Free Estimate</a></p>
  </div>
</section>
${leadForm('blog-post')}`,
    });
  }
}

// /ballpark/ merged into /design/, keep old links alive with a redirect
write('/ballpark/', `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${SITE.domain}/design/"><meta http-equiv="refresh" content="0;url=/design/"></head><body><a href="/design/">Design &amp; Price your project</a></body></html>`);



const privacyBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Privacy Policy</div>
<section style="padding-top:26px;">
  <div class="container" style="max-width:760px;">
    <h1>PRIVACY POLICY</h1>
    <hr class="gold-bar" />
    <p style="color:var(--stone);font-size:14px;">Effective August 4, 2026 · Buddy Tile, a registered trade name of Buddy Built LLC</p>

    <h3 style="margin-top:28px;">WHAT WE COLLECT</h3>
    <p>When you request an estimate (on buddytile.com, by phone, or through a Facebook or Instagram lead form), we collect the information you provide: your name, phone number, email, project address, and details about your project. Our website keeps standard server logs; we do not run third-party advertising trackers on buddytile.com.</p>

    <h3>HOW WE USE IT</h3>
    <p>We use your information to respond to your request, schedule visits, prepare and deliver estimates, send appointment reminders and project updates, and provide the services you hire us for. If you provide your phone number, we may call or text you about your project; reply STOP to any text to opt out. Message and data rates may apply.</p>

    <h3>WHAT WE NEVER DO</h3>
    <p>We never sell your personal information, and we never share it with other contractors or lead-generation networks. You contacted Buddy Tile; only Buddy Tile (and the Buddy Built family it belongs to) will contact you.</p>

    <h3>WHO WE SHARE IT WITH</h3>
    <p>Your information lives in our own project-management system and is shared only with the service providers that make our business run, such as email and text-message delivery services and payment processors, and with our crews as needed to perform your work, or where the law requires it.</p>

    <h3>FACEBOOK &amp; INSTAGRAM LEAD FORMS</h3>
    <p>If you submit a Meta lead form, Meta transmits your responses to us and also processes them under its own <a href="https://www.facebook.com/privacy/policy/" rel="noopener">Data Policy</a>. We use those responses only as described above.</p>

    <h3>RETENTION &amp; YOUR RIGHTS</h3>
    <p>We keep project records as long as needed to honor warranties and meet legal obligations. You may request a copy of the personal information we hold about you, ask us to correct it, or ask us to delete it (where the law doesn't require us to keep it) by emailing <a href="mailto:${SITE.email}">${SITE.email}</a> or calling <a href="tel:${SITE.phone.replace(/[^0-9+]/g, '')}">${SITE.phone}</a>.</p>

    <h3>CHANGES</h3>
    <p>If we update this policy, the new version will be posted here with a new effective date.</p>

    <p style="margin-top:24px;color:var(--stone);font-size:14px;">${SITE.legalLine}</p>
  </div>
</section>`;

add('/privacy/', {
  title: 'Privacy Policy | Buddy Tile',
  description:
    'How Buddy Tile collects and uses your information: only to deliver your project. Never sold, never shared with other contractors.',
  jsonLd: null,
  body: privacyBody,
});


const designBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Ballpark Price</div>
<section style="padding-top:26px;">
  <div class="container">
    <h1>YOUR INSTANT BALLPARK</h1>
    <hr class="gold-bar" />
    <p class="lead" style="max-width:38em;">Pick your project, style it, and get an instant ballpark, in about two minutes. One number at the end, no pressure, no spam.</p>
    <div class="design-grid">
      <div>
        <div class="design-step"><h3><span class="dnum">1</span>YOUR PROJECT</h3>
          <div class="project-grid" id="ds-type">
            <div class="project-card on" data-type="shower"><img src="/assets/img/tile-shower-remodel-vancouver-wa.jpg" alt="Tile shower" /><div class="fl">Tile Shower</div></div>
            <div class="project-card" data-type="floor"><img src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="Bathroom floor tile" /><div class="fl">Bathroom Floor</div></div>
            <div class="project-card" data-type="backsplash"><img src="/assets/img/kitchen-tile-backsplash-installation.jpg" alt="Kitchen backsplash" /><div class="fl">Kitchen Backsplash</div></div>
            <div class="project-card" data-type="remodel"><img src="/assets/img/marble-tile-shower-glass-door.jpg" alt="Full bathroom remodel" /><div class="fl">Full Bathroom Remodel</div></div>
          </div>
        </div>
        <div class="design-step" data-show="shower"><h3><span class="dnum">2</span>SIZE</h3>
          <div class="design-dims">
            <label>Width (in) <input type="number" id="ds-w" value="60" min="30" max="120" /></label>
            <label>Depth (in) <input type="number" id="ds-d" value="36" min="30" max="96" /></label>
            <label>Walls
              <select id="ds-walls"><option value="3" selected>3 walls</option><option value="2">2 walls</option></select>
            </label>
          </div>
          <div class="design-chips" id="ds-h">
            <button type="button" data-h="96" class="on">8' walls</button>
            <button type="button" data-h="108">9'</button>
            <button type="button" data-h="120">10'</button>
          </div>
          <div class="design-areas" id="ds-areas"></div>
        </div>
        <div class="design-step" data-show="floor backsplash" hidden><h3><span class="dnum">2</span>SIZE</h3>
          <div class="design-dims">
            <label>Approximate square feet <input type="number" id="ds-sqft" value="60" min="10" max="600" /></label>
          </div>
          <div class="design-chips" id="ds-sizes"></div>
          <p style="font-size:12.5px;color:var(--stone);margin:0;">Not sure? Pick the closest. We measure exactly at your free visit.</p>
        </div>
        <div class="design-step" data-show="remodel" hidden><h3><span class="dnum">2</span>BATHROOM SIZE</h3>
          <div class="project-grid" id="ds-rsize">
            <div class="project-card rs" data-rsize="small"><img src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="" /><div class="fl">Small / Powder<br /><span>~40 sq ft</span></div></div>
            <div class="project-card rs on" data-rsize="standard"><img src="/assets/img/tile-shower-remodel-vancouver-wa.jpg" alt="" /><div class="fl">Standard<br /><span>~60 sq ft</span></div></div>
            <div class="project-card rs" data-rsize="large"><img src="/assets/img/marble-tile-shower-glass-door.jpg" alt="" /><div class="fl">Large / Primary<br /><span>~100+ sq ft</span></div></div>
          </div>
        </div>
        <div class="design-step" data-show="shower floor"><h3><span class="dnum">3</span>THE SCOPE</h3>
          <div class="project-grid" id="ds-scope">
            <div class="project-card sc on" data-scope="tile"><img src="/assets/img/craft-tile-hands.jpg" alt="" /><div class="fl">Just tile<br /><span>New tile where it is today</span></div></div>
            <div class="project-card sc" data-scope="complex"><img src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="" /><div class="fl">More than tile<br /><span>Moving fixtures, layout changes, gut work</span></div></div>
          </div>
        </div>
        </div>
      <div class="design-side">
        <div class="design-preview">
          <div id="ds-preview-shower" class="preview-photo">
            <img src="/assets/img/shower-preview.png" alt="Corner shower with dimension arrows" />
            <span class="pm pm-h">Wall Height<br /><b id="pv-dh">96 in</b></span>
            <span class="pm pm-w">Depth<br /><b id="pv-dd">36 in</b></span>
            <span class="pm pm-d">Width<br /><b id="pv-dw">60 in</b></span>
          </div>
          <img id="ds-preview-img" src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="Project preview" hidden style="width:100%;border-radius:10px;display:block;" />
        </div>
        <div class="design-price">
          <div id="design-gate">
            <h3 style="margin-bottom:2px;">SEE YOUR BALLPARK</h3>
            <p class="hero-card-sub">One number for the whole project. Where should we send it?</p>
            <form class="lead-form hero-lead" id="design-gate-form">
              <input name="name" placeholder="Your name *" required maxlength="120" class="full" />
              <input name="email" type="email" placeholder="Email *" required maxlength="200" />
              <input name="phone" type="tel" placeholder="Phone (optional)" maxlength="30" />
              <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" />
              <div class="human-check full">
                <label>Quick human check: what is <span class="hc-q">…</span>?
                  <input name="humanCheck" inputmode="numeric" autocomplete="off" placeholder="?" required />
                </label>
              </div>
              <button class="btn full" type="submit">Show My Ballpark</button>
              <p class="form-status" hidden></p>
              <p class="form-note" style="color:var(--stone);">We'll email you a 6-digit code to confirm it's really you. No spam, ever.</p>
            </form>
          </div>
          <div id="design-verify" hidden>
            <h3 style="margin-bottom:2px;">CHECK YOUR EMAIL</h3>
            <p class="hero-card-sub">We sent a 6-digit code to <strong id="design-verify-email"></strong>. Enter it here and your ballpark appears.</p>
            <form class="lead-form hero-lead" id="design-verify-form">
              <input name="code" class="full code-input" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" placeholder="6-digit code" required />
              <button class="btn full" type="submit">Verify &amp; Show Ballpark</button>
              <p class="form-status" hidden></p>
              <p class="form-note verify-links" style="color:var(--stone);">
                Didn't get it? Check spam, or <a href="#" id="design-verify-resend">send a new code</a> · <a href="#" id="design-verify-edit">change email</a>
              </p>
            </form>
          </div>
          <div id="design-result" hidden>
            <div class="labor-badge">YOUR PROJECT BALLPARK</div>
            <div class="range" id="design-range">$…</div>
            <p class="note">Core build only, niches, benches, glass, heated floors and other upgrades are priced at your free estimate. ${BALLPARK.laborOnly} ${BALLPARK.disclaimerShort}</p>
            <button class="btn full" id="design-book-btn" type="button">Book My Free In-Home Estimate</button>
            <p class="form-status" id="design-book-status" hidden></p>
            <p class="form-note" style="color:var(--stone);">Your design comes with it, no re-explaining.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;

add('/design/', {
  title: 'Instant Ballpark Price, Showers, Floors, Backsplashes & Remodels | Buddy Tile',
  description:
    'Design your tile shower, bathroom floor, or kitchen backsplash and get an instant ballpark price for Vancouver WA & Portland OR. Visual, fast, no spam.',
  jsonLd: businessLd(),
  body: designBody,
});


add('/about/', {
  title: 'About Buddy Tile, a Buddy Built Company',
  description:
    'Buddy Tile is the tile division of Buddy Built: one standard, one warranty, one number. Meet the family of home-service brands built for your home.',
  jsonLd: businessLd(),
  body: aboutBody,
});

// sitemap + robots
fs.writeFileSync(
  path.join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE.domain}${u}</loc></url>`)
    .join('\n')}\n</urlset>\n`
);
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.domain}/sitemap.xml\n`);
// GitHub Pages: custom domain + skip Jekyll processing
fs.writeFileSync(path.join(OUT, 'CNAME'), 'buddytile.com\n');
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');

console.log(`Built ${urls.length} pages → docs/`);
