#!/usr/bin/env node
/**
 * Buddy Tile static site generator — zero dependencies.
 * `node build.js` writes the whole site (HTML, sitemap, robots, assets) to site/.
 */
const fs = require('fs');
const path = require('path');
const { SITE, SERVICES, CITIES, STEPS, TRUST, PROMISE, TESTIMONIALS, BALLPARK, DESIGNER } = require('./src/data');

const OUT = path.join(__dirname, 'docs');
const V = Date.now().toString(36); // cache-buster for css/js
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- shared chrome ----------------------------------------------------

const header = (isHome) => `
<header class="site-header${isHome ? ' home' : ''}">
  <div class="container">
    <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
      <span class="badge-slot"><img class="badge" src="/assets/img/buddy-tile-sm.png?v=3" alt="Buddy Tile — a Buddy Built company" /></span>
    </a>
    <nav class="site-nav">
      <a class="hide-m" href="/#services">Services</a>
      <a class="hide-m" href="/#service-area">Service Area</a>
      <a class="hide-m" href="/design/">Ballpark Price</a>
      <a class="hide-m" href="/about/">About</a>
      <a class="hide-m" href="https://buddybuilt.com/portal" target="_blank" rel="noopener">Customer Portal</a>
      <a class="phone-link" href="tel:${SITE.phone.replace(/[^0-9+]/g, '')}">${SITE.phone}</a>
      <a class="btn" href="#estimate">Free Estimate</a>
    </nav>
  </div>
</header>`;

const leadForm = (context) => `
<section class="estimate-band" id="estimate">
  <div class="container">
    <h2>GET YOUR FREE ESTIMATE</h2>
    <hr class="gold-bar" />
    <p style="max-width:36em;color:rgba(255,255,255,0.85);">Two minutes now, an in-home visit this week, and your written estimate the same day. No pressure, no card fees, ever.</p>
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
      <p class="form-note">We reply the same business day. Your info never gets sold — you're a neighbor, not a lead.</p>
    </form>
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
          <li><a href="https://buddybuilt.com/portal" target="_blank" rel="noopener">Customer Portal — track your project</a></li>
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
  <div class="bg" style="background-image:url('/assets/img/tile-shower-remodel-vancouver-wa.jpg')"></div>
  <div class="scrim"></div>
  <div class="container hero-grid">
    <div>
      <h1>THE BATHROOM YOU'LL<br/>LOVE COMING HOME TO.</h1>
      <hr class="gold-bar" />
      <p class="lead">You've lived with the cracked grout and the cold floor long enough. In about a week, our tile craftsmen turn the room you apologize for into the one you show off — and treat you, your home, and your budget with the care a neighbor deserves.</p>
      <div class="chips">
        <span>Family owned</span><span>Licensed &amp; bonded</span><span>Flood-tested waterproofing</span><span>Same-day written estimates</span>
      </div>
    </div>
    <div class="hero-card">
      <h3>GET A FREE IN-HOME ESTIMATE</h3>
      <p class="hero-card-sub">We measure in person — your written estimate arrives the same day.</p>
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

<section id="services">
  <div class="container center">
    <h2>WHAT WE BUILD</h2>
    <hr class="gold-bar" />
    <p class="section-sub">Showers, kitchens, floors, and the waterproofing underneath it all — set by dedicated tile crews, not whoever answered the ad.</p>
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

<section class="alt">
  <div class="container center">
    <h2>HOW YOU'LL BE TREATED</h2>
    <hr class="gold-bar" />
    <p class="section-sub">Anyone can show you tile photos. Here's what it feels like to have Buddy Tile in your home.</p>
    <div class="promise-grid">
      ${PROMISE.map((p) => `<div class="promise"><h3>${p.title.toUpperCase()}</h3><p>${esc(p.body)}</p></div>`).join('')}
    </div>
  </div>
</section>

<section>
  <div class="container two-col">
    <div>
      <h2>HOW IT WORKS</h2>
      <hr class="gold-bar" />
      <div class="steps">
        ${STEPS.map((s) => `<div class="step"><h3>${s.title.toUpperCase()}</h3><p>${s.body}</p></div>`).join('')}
      </div>
    </div>
    <div>
      <img class="rounded-img" src="/assets/img/craft-tile-hands.jpg" alt="Buddy Tile installer setting tile" loading="lazy" />
      <h3 style="margin-top:20px;">YOU'RE A NEIGHBOR, NOT A LEAD</h3>
      <p style="color:var(--stone);">Lead-generation sites sell your phone number to five strangers. Call Buddy Tile and you get Buddy Tile — our crews, our warranty, our number, from the first hello to the final walkthrough.</p>
    </div>
  </div>
</section>

<section class="alt">
  <div class="container center">
    <h2>WHAT YOUR NEIGHBORS SAY</h2>
    <hr class="gold-bar" />
    <div class="quote-grid">
      ${TESTIMONIALS.map(
        (t) => `<div class="quote-card"><div class="stars">★★★★★</div><blockquote>"${esc(t.quote)}"</blockquote><div class="who">– ${esc(t.name)}</div><div class="where">${esc(t.where)}</div></div>`
      ).join('')}
    </div>
  </div>
</section>

<section>
  <div class="container center">
    <h2>THE CRAFT BEHIND THE FINISH</h2>
    <hr class="gold-bar" />
    <p class="section-sub">Anyone can show you a pretty "after." We're just as proud of what goes underneath — and we photograph both for you.</p>
    <div class="craft-pair">
      <figure>
        <img src="/assets/img/craft-tile-hands.jpg" alt="Buddy Tile installer setting tile over prepared substrate" loading="lazy" />
        <figcaption>
          <span class="craft-tag">THE WORK YOU NEVER SEE</span>
          <p>Waterproofing, flat substrates, tight layout — every hidden step photographed and sent to your phone before tile covers it.</p>
        </figcaption>
      </figure>
      <figure>
        <img src="/assets/img/marble-tile-shower-glass-door.jpg" alt="Finished marble tile shower with glass door" loading="lazy" />
        <figcaption>
          <span class="craft-tag gold">THE FINISH YOU LIVE WITH</span>
          <p>Set to TCNA standards over a flood-tested pan — built to look this good for decades, and warrantied by name.</p>
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

const servicePage = (s) => `
<div class="container breadcrumbs"><a href="/">Home</a> / <a href="/#services">Services</a> / ${s.name}</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h1>${s.h1.toUpperCase()}</h1>
      <hr class="gold-bar" />
      <p class="lead">${esc(s.intro)}</p>
      <ul class="tick-list">${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <p><a class="btn" href="#estimate">Get My Free Estimate</a></p>
    </div>
    <div>
      <img class="rounded-img" src="/assets/img/${s.photo}" alt="${esc(s.h1)}" />
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
${leadForm(`service:${s.slug}`)}`;

const cityPage = (c) => `
<div class="container breadcrumbs"><a href="/">Home</a> / <a href="/#service-area">Service Area</a> / ${c.name}, ${c.state}</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h1>TILE CONTRACTOR IN ${c.name.toUpperCase()}, ${c.state}</h1>
      <hr class="gold-bar" />
      <p class="lead">Custom tile showers, bathroom floors, backsplashes, and heated floors for ${c.name} homeowners. ${esc(c.blurb)}</p>
      <ul class="tick-list">
        <li>Free in-home visits in ${c.name} — written estimate the same day</li>
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
    <h2>POPULAR IN ${c.name.toUpperCase()}</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
      ${SERVICES.slice(0, 3)
        .map((x) => `<a class="card" href="/services/${x.slug}/"><img src="/assets/img/${x.photo}" alt="${esc(x.name)}" loading="lazy" /><div class="body"><h3>${x.name.toUpperCase()}</h3><div class="go">Learn more →</div></div></a>`)
        .join('')}
    </div>
  </div>
</section>
${leadForm(`city:${c.slug}`)}`;

const aboutBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / About</div>
<section style="padding-top:26px;">
  <div class="container two-col">
    <div>
      <h1>ONE COMPANY. EXPERTS IN EVERY TRADE.</h1>
      <hr class="gold-bar" />
      <p class="lead">Buddy Tile is the tile division of Buddy Built — a family of home-service brands built on one idea: hire the company, not a stranger from a lead site.</p>
      <p>Every Buddy crew works to one standard, carries one warranty, and answers to one phone number. Your estimator sketches your Tile Plan in your bathroom, sends your written estimate the same day, and the crew that shows up builds exactly what you approved — with photos of the waterproofing before it disappears behind tile.</p>
      <p>Need glass, plumbing, or flooring alongside the tile? That's the point of the family — one call brings the right Buddy trade, and everything lands on a single estimate.</p>
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
  title: 'Buddy Tile — Custom Tile Showers & Bathroom Remodels | Vancouver WA & Portland OR',
  description:
    'Custom tile showers, bathroom floors, backsplashes, and heated floors in Vancouver WA and Portland OR. Free in-home estimates, online approval, no card fees. A Buddy Built company.',
  jsonLd: businessLd(),
  body: homeBody,
});

for (const s of SERVICES) {
  add(`/services/${s.slug}/`, {
    title: s.metaTitle,
    description: s.metaDescription,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: s.h1,
      description: s.metaDescription,
      provider: businessLd(),
      areaServed: CITIES.map((c) => `${c.name}, ${c.state}`),
    },
    body: servicePage(s),
  });
}

for (const c of CITIES) {
  add(`/tile-contractor/${c.slug}/`, {
    title: `Tile Contractor in ${c.name}, ${c.state} | Showers, Floors, Backsplashes | Buddy Tile`,
    description: `Buddy Tile installs custom showers, bathroom tile, and backsplashes in ${c.name}, ${c.state}. Free in-home estimates, licensed & bonded, no card fees.`,
    jsonLd: businessLd({ areaServed: { '@type': 'City', name: `${c.name}, ${c.state}` } }),
    body: cityPage(c),
  });
}

// /ballpark/ merged into /design/ — keep old links alive with a redirect
write('/ballpark/', `<!doctype html><html><head><meta charset="utf-8"><title>Redirecting…</title><link rel="canonical" href="${SITE.domain}/design/"><meta http-equiv="refresh" content="0;url=/design/"></head><body><a href="/design/">Design &amp; Price your project</a></body></html>`);



const privacyBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Privacy Policy</div>
<section style="padding-top:26px;">
  <div class="container" style="max-width:760px;">
    <h1>PRIVACY POLICY</h1>
    <hr class="gold-bar" />
    <p style="color:var(--stone);font-size:14px;">Effective August 4, 2026 · Buddy Tile, a registered trade name of Buddy Built LLC</p>

    <h3 style="margin-top:28px;">WHAT WE COLLECT</h3>
    <p>When you request an estimate — on buddytile.com, by phone, or through a Facebook or Instagram lead form — we collect the information you provide: your name, phone number, email, project address, and details about your project. Our website keeps standard server logs; we do not run third-party advertising trackers on buddytile.com.</p>

    <h3>HOW WE USE IT</h3>
    <p>We use your information to respond to your request, schedule visits, prepare and deliver estimates, send appointment reminders and project updates, and provide the services you hire us for. If you provide your phone number, we may call or text you about your project; reply STOP to any text to opt out. Message and data rates may apply.</p>

    <h3>WHAT WE NEVER DO</h3>
    <p>We never sell your personal information, and we never share it with other contractors or lead-generation networks. You contacted Buddy Tile; only Buddy Tile (and the Buddy Built family it belongs to) will contact you.</p>

    <h3>WHO WE SHARE IT WITH</h3>
    <p>Your information lives in our own project-management system and is shared only with the service providers that make our business run — such as email and text-message delivery services and payment processors — and with our crews as needed to perform your work, or where the law requires it.</p>

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
<div class="container breadcrumbs"><a href="/">Home</a> / Design &amp; Price</div>
<section style="padding-top:26px;">
  <div class="container">
    <h1>DESIGN IT. PRICE IT.</h1>
    <hr class="gold-bar" />
    <p class="lead" style="max-width:38em;">Pick your project, style it, and get an instant ballpark — in about two minutes. One number at the end, no pressure, no spam.</p>
    <div class="design-grid">
      <div>
        <div class="design-step"><h3><span class="dnum">1</span>YOUR PROJECT</h3>
          <div class="project-grid" id="ds-type">
            <div class="project-card on" data-type="shower"><img src="/assets/img/tile-shower-remodel-vancouver-wa.jpg" alt="Tile shower" /><div class="fl">Tile Shower</div></div>
            <div class="project-card" data-type="floor"><img src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="Bathroom floor tile" /><div class="fl">Bathroom Floor</div></div>
            <div class="project-card" data-type="backsplash"><img src="/assets/img/kitchen-tile-backsplash-installation.jpg" alt="Kitchen backsplash" /><div class="fl">Kitchen Backsplash</div></div>
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
          <p style="font-size:12.5px;color:var(--stone);margin:0;">Not sure? Pick the closest — we measure exactly at your free visit.</p>
        </div>
        <div class="design-step" data-show="shower"><h3><span class="dnum">3</span>FEATURES</h3>
          <div class="feature-grid" id="ds-features"></div>
        </div>
        <div class="design-step" data-show="floor backsplash" hidden><h3><span class="dnum">3</span>THE INSTALL</h3>
          <div class="project-grid">
            <div class="project-card grade on" data-grade="standard"><img src="/assets/img/bathroom-tile-remodel-vancouver-wa.jpg" alt="" /><div class="fl">Standard tile<br /><span>Porcelain &amp; ceramic</span></div></div>
            <div class="project-card grade" data-grade="premium"><img src="/assets/img/herringbone-tile-floor-portland-or.jpg" alt="" /><div class="fl">Detailed install<br /><span>Large format, stone, mosaic</span></div></div>
          </div>
          <div class="feature-grid" id="ds-flat-extras" style="margin-top:10px;"></div>
        </div>
        <div class="design-step" data-show="shower backsplash"><h3><span class="dnum">4</span>TILE LOOK</h3>
          <p style="font-size:13px;color:var(--stone);margin:0 0 10px;">Patterns like herringbone add setting time — it's all in your ballpark.</p>
          <div class="design-chips" id="ds-layout">
            <button type="button" data-k="straight" class="on">Straight</button>
            <button type="button" data-k="brick">Brick</button>
            <button type="button" data-k="vertical">Vertical</button>
            <button type="button" data-k="herringbone">Herringbone</button>
          </div>
          <div class="design-chips" id="ds-floor" data-show="shower">
            <button type="button" data-k="standard" class="on">Standard shower floor</button>
            <button type="button" data-k="mosaic">Mosaic shower floor</button>
          </div>
        </div>
      </div>
      <div class="design-side">
        <div class="design-preview">
          <svg id="ds-preview-svg" viewBox="0 0 352 292" aria-label="Your shower preview">
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto"><path d="M0,0 L7,3.5 L0,7 z" fill="#6B7280"/></marker>
            </defs>
            <g transform="translate(30,8)">
              <polygon points="60,190 160,230 260,190 160,150" fill="#EFE9E0" stroke="#B9B2A6" stroke-width="1.4"/>
              <polygon points="60,190 60,70 160,30 160,150" fill="#F8F4EE" stroke="#B9B2A6" stroke-width="1.4"/>
              <polygon id="pv-wall-r" points="160,150 160,30 260,70 260,190" fill="#F3EEE6" stroke="#B9B2A6" stroke-width="1.4"/>
              <g stroke="#DAD3C7" stroke-width="0.7"><line x1="74" y1="64" x2="74" y2="184"/><line x1="89" y1="59" x2="89" y2="179"/><line x1="103" y1="53" x2="103" y2="173"/><line x1="117" y1="47" x2="117" y2="167"/><line x1="131" y1="41" x2="131" y2="161"/><line x1="146" y1="36" x2="146" y2="156"/><line x1="60" y1="88" x2="160" y2="48"/><line x1="60" y1="105" x2="160" y2="65"/><line x1="60" y1="122" x2="160" y2="82"/><line x1="60" y1="139" x2="160" y2="99"/><line x1="60" y1="156" x2="160" y2="116"/><line x1="60" y1="173" x2="160" y2="133"/><line x1="174" y1="36" x2="174" y2="156"/><line x1="189" y1="41" x2="189" y2="161"/><line x1="203" y1="47" x2="203" y2="167"/><line x1="217" y1="53" x2="217" y2="173"/><line x1="231" y1="59" x2="231" y2="179"/><line x1="246" y1="64" x2="246" y2="184"/><line x1="160" y1="48" x2="260" y2="88"/><line x1="160" y1="65" x2="260" y2="105"/><line x1="160" y1="82" x2="260" y2="122"/><line x1="160" y1="99" x2="260" y2="139"/><line x1="160" y1="116" x2="260" y2="156"/><line x1="160" y1="133" x2="260" y2="173"/></g>
              <g stroke="#DAD3C7" stroke-width="0.7"><line x1="85" y1="180" x2="185" y2="220"/><line x1="85" y1="200" x2="185" y2="160"/><line x1="110" y1="170" x2="210" y2="210"/><line x1="110" y1="210" x2="210" y2="170"/><line x1="135" y1="160" x2="235" y2="200"/><line x1="135" y1="220" x2="235" y2="180"/></g>
              <polygon points="60,70 160,30 160,36 60,76" fill="#EDE7DC" stroke="#B9B2A6" stroke-width="0.8"/>
              <polygon points="160,30 260,70 260,76 160,36" fill="#E8E1D5" stroke="#B9B2A6" stroke-width="0.8"/>
              <rect x="182" y="183" width="9" height="9" transform="rotate(22 186 187)" fill="#C9C2B4" stroke="#8F887B" stroke-width="0.8"/>
              <g id="pv-fixtures">
                <line x1="236" y1="62" x2="222" y2="70" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/>
                <circle cx="220" cy="72" r="7" fill="#1F1F1F"/>
                <g stroke="#B9B2A6" stroke-width="1"><line x1="216" y1="82" x2="214" y2="92"/><line x1="220" y1="83" x2="220" y2="93"/><line x1="224" y1="82" x2="226" y2="92"/></g>
                <line x1="196" y1="104" x2="196" y2="126" stroke="#1F1F1F" stroke-width="3" stroke-linecap="round"/>
                <circle cx="196" cy="130" r="3.4" fill="#1F1F1F"/>
              </g>
              <polygon id="pv-niche" points="90,103 120,91 120,121 90,133" fill="#FFFFFF" stroke="#C98D0A" stroke-width="1.5" visibility="hidden"/>
              <polygon id="pv-niche2" points="90,63 120,51 120,79 90,91" fill="#FFFFFF" stroke="#C98D0A" stroke-width="1.5" visibility="hidden"/>
              <g id="pv-bench" visibility="hidden"><polygon points="170,162 232,187 232,203 170,178" fill="#EFE9E0" stroke="#C98D0A" stroke-width="1.5"/><polygon points="170,162 232,187 232,193 170,168" fill="#F6B015" stroke="#C98D0A" stroke-width="1"/></g>
              <polygon id="pv-shelf" points="88,98 122,84 122,88 88,102" fill="#F6B015" stroke="#C98D0A" stroke-width="1" visibility="hidden"/>
              <g id="pv-curb"><polyline points="60,186 160,226 260,186" fill="none" stroke="#C9C2B4" stroke-width="5"/><polyline points="60,184 160,224 260,184" fill="none" stroke="#8F887B" stroke-width="1"/></g>
              <polygon id="pv-glass" points="160,230 260,190 260,70 160,110" fill="#7FB4D9" fill-opacity="0.18" stroke="#468FAF" stroke-width="1.2" visibility="hidden"/>
              <circle id="pv-rain" cx="120" cy="60" r="5" fill="#F6B015" visibility="hidden"/>
            </g>
            <line x1="20" y1="86" x2="20" y2="206" stroke="#6B7280" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>
            <text x="2" y="132" font-size="11" font-weight="700" fill="#1C2E44">Wall</text>
            <text x="2" y="145" font-size="11" font-weight="700" fill="#1C2E44">Height</text>
            <text id="pv-dh" x="2" y="160" font-size="11.5" font-weight="700" fill="#1C2E44">96 in</text>
            <line x1="96" y1="216" x2="182" y2="250" stroke="#6B7280" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>
            <text x="118" y="272" font-size="11" font-weight="700" fill="#1C2E44">Width</text>
            <text id="pv-dw" x="118" y="286" font-size="11.5" font-weight="700" fill="#1C2E44">60 in</text>
            <line x1="200" y1="248" x2="286" y2="214" stroke="#6B7280" stroke-width="1" marker-start="url(#arr)" marker-end="url(#arr)"/>
            <text x="292" y="238" font-size="11" font-weight="700" fill="#1C2E44">Depth</text>
            <text id="pv-dd" x="292" y="252" font-size="11.5" font-weight="700" fill="#1C2E44">36 in</text>
          </svg>
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
            <div class="range" id="design-range">$—</div>
            <p class="note">${BALLPARK.laborOnly} ${BALLPARK.disclaimerShort}</p>
            <button class="btn full" id="design-book-btn" type="button">Book My Free In-Home Estimate</button>
            <p class="form-status" id="design-book-status" hidden></p>
            <p class="form-note" style="color:var(--stone);">Your design comes with it — no re-explaining.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>`;

add('/design/', {
  title: 'Design It. Price It. — Instant Tile Ballpark | Buddy Tile',
  description:
    'Design your tile shower, bathroom floor, or kitchen backsplash and get an instant ballpark price for Vancouver WA & Portland OR. Visual, fast, no spam.',
  jsonLd: businessLd(),
  body: designBody,
});


add('/about/', {
  title: 'About Buddy Tile — a Buddy Built Company',
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
