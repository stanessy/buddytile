#!/usr/bin/env node
/**
 * Buddy Tile static site generator, zero dependencies.
 * `node build.js` writes the whole site (HTML, sitemap, robots, assets) to site/.
 */
const fs = require('fs');
const path = require('path');
const { SITE, SERVICES, CITIES, STEPS, TRUST, PROMISE, TESTIMONIALS, BALLPARK, DESIGNER } = require('./src/data');
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

// ---------- shared chrome ----------------------------------------------------

const header = (isHome) => `
<header class="site-header${isHome ? ' home' : ''}">
  <div class="container">
    <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
      <span class="badge-slot"><img class="badge" src="/assets/img/buddy-tile-sm.png?v=3" alt="Buddy Tile, a Buddy Built company" /></span>
    </a>
    <nav class="site-nav">
      <a class="hide-m" href="/#services">Services</a>
      <a class="hide-m" href="/projects/">Our Work</a>
      <a class="hide-m" href="/design/">Ballpark Price</a>
      <a class="phone-link" href="tel:${SITE.phone.replace(/[^0-9+]/g, '')}">${SITE.phone}</a>
      <a class="btn" href="#estimate">Free Estimate</a>
    </nav>
  </div>
</header>`;

const leadForm = (context) => `
<section class="estimate-band" id="estimate">
  <div class="container">
    <h2>READY TO <span class="hl">START</span> YOUR PROJECT?</h2>
    <p class="cta-sub">Two minutes now, an in-home visit this week, and your written estimate the same day. No pressure, no card fees, ever.</p>
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
        <img src="/assets/img/buddy-tile.png?v=3" alt="Buddy Tile badge" loading="lazy" />
        <div class="caption">a BUDDY BUILT company</div>
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
          <li><a href="/pay/">Make a payment</a></li>
          <li><a href="/blog/">Tile Talk, advice from the crew</a></li>
          <li><a href="https://buddybuilt.com/portal" target="_blank" rel="noopener">Customer Portal, track your project</a></li>
          <li><a href="https://buddybuilt.com" rel="noopener">The Buddy Built family</a></li>
          <li><a href="/privacy/">Privacy Policy</a></li>
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
  <link rel="icon" href="/assets/img/buddy-tile-sm.png?v=3" />
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
  logo: `${SITE.domain}/assets/img/buddy-tile.png?v=3`,
  slogan: SITE.tagline,
  parentOrganization: { '@type': 'Organization', name: 'Buddy Built LLC', url: 'https://buddybuilt.com' },
  areaServed: CITIES.map((c) => ({ '@type': 'City', name: `${c.name}, ${c.state}` })),
  priceRange: '$$',
  ...extra,
});

// ---------- pages ------------------------------------------------------------

const homeBody = `
<div class="hero">
  <div class="bg" style="background-image:url('/assets/img/hero-master-bath-remodel.jpg')"></div>
  <div class="scrim"></div>
  <div class="container hero-grid">
    <div>
      <h1>CUSTOM TILE SHOWERS &amp;<br/><span class="gold">GROUT CLEANING</span> IN WASHINGTON &amp;&nbsp;OREGON</h1>
      <hr class="gold-bar" />
      <p class="lead">Buddy Tile builds custom tile showers, bathroom remodels, tub-to-shower conversions, heated tile floors, and backsplashes. We also bring tired tile back to life with grout deep cleaning, sealing, and shower regrouts. Our licensed, bonded tile craftsmen serve Vancouver, Camas, and Battle Ground in Washington and the Portland metro in Oregon. Every shower gets flood-tested waterproofing, and your written estimate arrives the same day we measure.</p>
      <div class="chips">
        <span>Family owned</span><span>Licensed &amp; bonded</span><span>Flood-tested waterproofing</span><span>Same-day written estimates</span>
      </div>
    </div>
    <div class="hero-card">
      <h3>GET A FREE IN-HOME ESTIMATE</h3>
      <p class="hero-card-sub">We measure in person, and your written estimate arrives the same day.</p>
      <form class="lead-form hero-lead" data-context="hero">
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
    </div>
  </div>
</div>

<div class="stat-band">
  <div class="container stat-grid">
    <div class="stat"><div class="n">SAME DAY</div><p>Written estimates, in your inbox before dinner</p></div>
    <div class="stat"><div class="n">5&ndash;8 DAYS</div><p>Demo to grout on most showers</p></div>
    <div class="stat"><div class="n">100%</div><p>Every shower flood-tested &amp; photographed before tile</p></div>
    <div class="stat"><div class="n">1</div><p>Number, one warranty, one standard</p></div>
  </div>
</div>

<section id="services">
  <div class="container center">
    <h2>WHAT WE <span class="hl">BUILD</span></h2>
    <hr class="gold-bar" />
    <p class="section-sub">Showers, kitchens, floors, and the waterproofing underneath it all, set by dedicated tile crews, not whoever answered the ad.</p>
    <div class="grid cols-3" style="text-align:left;">
      ${SERVICES.map(
        (s) => `<a class="card" href="/services/${s.slug}/">
        <img src="/assets/img/${s.photo}" alt="${esc(s.name)}" loading="lazy" />
        <div class="body"><h3>${s.name.toUpperCase()}</h3><p>${esc(s.metaDescription.split('.')[0])}.</p><div class="go">Learn more →</div></div>
      </a>`
      ).join('')}
    </div>
  </div>
</section>

<section class="navy-block">
  <div class="container center">
    <h2>HOW YOU'LL BE <span class="hl">TREATED</span></h2>
    <hr class="gold-bar" />
    <p class="section-sub">Anyone can show you tile photos. Here's what it feels like to have Buddy Tile in your home.</p>
    <div class="promise-grid">
      ${PROMISE.map((p) => `<div class="promise"><h3>${p.title.toUpperCase()}</h3><p>${esc(p.body)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="container center">
    <h2>HOW IT <span class="hl">WORKS</span></h2>
    <p class="section-sub">One call is all it takes. Here's the whole ride, start to finish.</p>
    <div class="hiw-grid">
      ${STEPS.map(
        (st, i) => `<div class="hiw"><div class="circ"><span class="bebas">${['\u260E', '\u25A4', '\u2692', '\u2605'][i] || ''}</span><span class="num">${i + 1}</span></div><h3>${st.title.toUpperCase()}</h3><p>${esc(st.body)}</p></div>`
      ).join('')}
    </div>
    <div style="max-width:640px;margin:44px auto 0;">
      <h3>YOU'RE A NEIGHBOR, NOT A LEAD</h3>
      <p style="color:var(--stone);">Lead-generation sites sell your phone number to five strangers. Call Buddy Tile and you get Buddy Tile, our crews, our warranty, our number, from the first hello to the final walkthrough.</p>
    </div>
  </div>
</section>

<section class="alt">
  <div class="container center">
    <h2>WHAT YOUR <span class="hl">NEIGHBORS</span> SAY</h2>
    <hr class="gold-bar" />
    ${
      GOOGLE_REVIEWS
        ? `<p class="section-sub">${GOOGLE_REVIEWS.rating ? `<strong>${GOOGLE_REVIEWS.rating.toFixed(1)} ★</strong> from ${GOOGLE_REVIEWS.total} Google review${GOOGLE_REVIEWS.total === 1 ? '' : 's'} · ` : ''}<a href="${esc(GOOGLE_REVIEWS.mapsUrl || 'https://www.google.com/maps/place/?q=place_id:' + GOOGLE_REVIEWS.placeId)}" target="_blank" rel="noopener">Read them all on Google →</a></p>
    <div class="quote-grid">
      ${GOOGLE_REVIEWS.reviews
        .map(
          (t) => `<div class="quote-card"><div class="stars">${'★'.repeat(t.rating)}</div><blockquote>"${esc(t.text)}"</blockquote><div class="who">- ${esc(t.author)}</div><div class="where">Google review · ${esc(t.when)}</div></div>`
        )
        .join('')}
    </div>`
        : `<div class="quote-grid">
      ${TESTIMONIALS.map(
        (t) => `<div class="quote-card"><div class="stars">★★★★★</div><blockquote>"${esc(t.quote)}"</blockquote><div class="who">- ${esc(t.name)}</div><div class="where">${esc(t.where)}</div></div>`
      ).join('')}
    </div>`
    }
  </div>
</section>

<section>
  <div class="container center">
    <h2>THE <span class="hl">CRAFT</span> BEHIND THE FINISH</h2>
    <hr class="gold-bar" />
    <p class="section-sub">Anyone can show you a pretty "after." We're just as proud of what goes underneath, and we photograph both for you.</p>
    <div class="craft-pair">
      <figure>
        <img src="/assets/img/craft-tile-hands.jpg" alt="Buddy Tile installer setting tile over prepared substrate" loading="lazy" />
        <figcaption>
          <span class="craft-tag">THE WORK YOU NEVER SEE</span>
          <p>Waterproofing, flat substrates, tight layout, every hidden step photographed and sent to your phone before tile covers it.</p>
        </figcaption>
      </figure>
      <figure>
        <img src="/assets/img/marble-tile-shower-glass-door.jpg" alt="Finished marble tile shower with glass door" loading="lazy" />
        <figcaption>
          <span class="craft-tag gold">THE FINISH YOU LIVE WITH</span>
          <p>Set to TCNA standards over a flood-tested pan, built to look this good for decades, and warrantied by name.</p>
        </figcaption>
      </figure>
    </div>
    <div style="margin-top:38px;">
      <div class="finance-band">
        <div class="fb-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>
        </div>
        <div class="fb-copy">
          <div class="fb-title">PROJECT FINANCING AVAILABLE</div>
          <p>Pre-qualify in about 60 seconds through Acorn Finance.</p>
        </div>
        <a class="btn" href="${SITE.acornUrl}" target="_blank" rel="noopener">Check My Financing Options →</a>
      </div>
      <p class="finance-note">Financing offered through Acorn Finance's network of lenders and subject to credit approval. Pre-qualifying uses a soft credit inquiry that does not affect your credit score; proceeding with a lender's offer involves a hard credit pull, which can.</p>
    </div>
  </div>
</section>

<section class="alt" id="service-area">
  <div class="container">
    <h2>SERVICE AREA</h2>
    <hr class="gold-bar" />
    <p style="max-width:40em;color:var(--stone);">${SITE.serviceAreaBlurb}</p>
    <div class="grid cols-3">
      ${CITIES.map(
        (c) => `<a class="card" href="/tile-contractor/${c.slug}/"><div class="body"><h3>${c.name.toUpperCase()}, ${c.state}</h3><p>${esc(c.blurb)}</p><div class="go">Tile work in ${c.name} →</div></div></a>`
      ).join('')}
    </div>
  </div>
</section>

<section>
  <div class="container">
    <h2>WHY HOMEOWNERS PICK BUDDY</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${TRUST.map((t) => `<div><h3>${t.title.toUpperCase()}</h3><p style="color:var(--stone);margin:0;">${t.body}</p></div>`).join('')}
    </div>
  </div>
</section>

${leadForm('home')}`;


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
        <li>No credit card fees, ever</li>
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
    'Custom tile showers, bathroom floors, backsplashes, and heated floors in Vancouver WA and Portland OR. Free in-home estimates, online approval, no card fees. A Buddy Built company.',
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
      description: `${s.name} for ${c.name}, ${c.state} homeowners, free in-home estimates, licensed & bonded, no card fees. ${s.metaDescription}`.slice(0, 300),
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
    description: `Buddy Tile installs custom showers, bathroom tile, and backsplashes in ${c.name}, ${c.state}. Free in-home estimates, licensed & bonded, no card fees.`,
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
    <p class="lead">Pay your deposit or invoice online. Enter your invoice number and the email we have on file, and we'll send your secure payment page, card or Zelle, no fees either way.</p>
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
    'Pay your Buddy Tile deposit or invoice online, card or Zelle, no fees. Enter your invoice number and we email your secure payment link.',
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
