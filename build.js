#!/usr/bin/env node
/**
 * Buddy Tile static site generator — zero dependencies.
 * `node build.js` writes the whole site (HTML, sitemap, robots, assets) to site/.
 */
const fs = require('fs');
const path = require('path');
const { SITE, SERVICES, CITIES, STEPS, TRUST, BALLPARK } = require('./src/data');

const OUT = path.join(__dirname, 'site');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------- shared chrome ----------------------------------------------------

const header = `
<header class="site-header">
  <div class="container">
    <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff;">
      <img class="badge" src="/assets/img/buddy-tile-sm.png" alt="Buddy Tile — a Buddy Built company" />
      <span class="brand-block">
        <span class="name">BUDDY TILE</span><br />
        <span class="sub">a BUDDY BUILT company</span>
      </span>
    </a>
    <nav class="site-nav">
      <a class="hide-m" href="/#services">Services</a>
      <a class="hide-m" href="/#service-area">Service Area</a>
      <a class="hide-m" href="/ballpark/">Ballpark Price</a>
      <a class="hide-m" href="/about/">About</a>
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
        <img src="/assets/img/buddy-tile.png" alt="Buddy Tile badge" loading="lazy" />
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
          <li><a href="https://buddybuilt.com" rel="noopener">The Buddy Built family</a></li>
        </ul>
      </div>
    </div>
    <div class="legal">
      <p>${SITE.legalLine}</p>
      <p>© ${new Date().getFullYear()} Buddy Built LLC · ${SITE.tagline} · <a href="https://buddybuilt.com">buddybuilt.com</a></p>
    </div>
  </div>
</footer>
<script src="/assets/ballpark-config.js"></script>
<script src="/assets/main.js" defer></script>`;

const page = ({ url, title, description, jsonLd, body }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="canonical" href="${SITE.domain}${url}" />
  <link rel="icon" href="/assets/img/buddy-tile-sm.png" />
  <link rel="stylesheet" href="/assets/styles.css" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:image" content="${SITE.domain}/assets/img/buddy-tile.png" />
  <meta property="og:url" content="${SITE.domain}${url}" />
  <meta property="og:type" content="website" />
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
${header}
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
  image: `${SITE.domain}/assets/img/buddy-tile.png`,
  slogan: SITE.tagline,
  parentOrganization: { '@type': 'Organization', name: 'Buddy Built LLC', url: 'https://buddybuilt.com' },
  areaServed: CITIES.map((c) => ({ '@type': 'City', name: `${c.name}, ${c.state}` })),
  priceRange: '$$',
  ...extra,
});

// ---------- pages ------------------------------------------------------------

const homeBody = `
<div class="hero">
  <div class="bg" style="background-image:url('/assets/img/hero-shower.jpg')"></div>
  <div class="container hero-grid">
    <div>
      <h1>THE TILE SHOWER YOU<br/>KEEP PUTTING OFF?</h1>
      <hr class="gold-bar" />
      <p class="lead">We build it in days, not months. Custom tile showers, bathroom floors, and backsplashes across Vancouver WA and Portland OR — same-day estimates, approved from your phone.</p>
      <div class="chips">
        <span>Family Owned</span><span>Licensed &amp; Bonded</span><span>No card fees</span><span>Craftsmanship guaranteed</span>
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
      <p class="hero-card-alt">Just want a rough number first? <a href="/ballpark/">Try the 60-second ballpark tool →</a></p>
    </div>
  </div>
</div>

<section id="services">
  <div class="container">
    <h2>WHAT WE BUILD</h2>
    <hr class="gold-bar" />
    <div class="grid cols-3">
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

<section id="service-area">
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

<section class="alt">
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
      <img class="rounded-img" src="/assets/img/work-full-bath.jpg" alt="Tile bathroom remodel in ${esc(c.name)}, ${c.state}" />
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
fs.writeFileSync(path.join(OUT, 'assets/ballpark-config.js'), `window.BT_BALLPARK = ${JSON.stringify(BALLPARK)};`);

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

const ballparkBody = `
<div class="container breadcrumbs"><a href="/">Home</a> / Ballpark Price</div>
<section style="padding-top:26px;">
  <div class="container two-col" style="align-items:stretch;">
    <div>
      <h1>60-SECOND BALLPARK PRICE</h1>
      <hr class="gold-bar" />
      <p class="lead">Get a rough installation estimate in 60 seconds.<br /><span style="font-size:16px;color:var(--stone);">Finish materials (tile, grout, fixtures) aren't included — they depend on your selections. Your exact price comes with a free in-home estimate.</span></p>
      <div id="ballpark-gate" class="hero-card gate-card">
        <h3>WHERE SHOULD WE SEND YOUR ESTIMATE?</h3>
        <p class="hero-card-sub">Takes 10 seconds — we'll text or email it to you.</p>
        <form class="lead-form hero-lead" id="ballpark-gate-form">
          <input name="name" placeholder="Your name *" required maxlength="120" class="full" />
          <input name="phone" type="tel" placeholder="Phone" maxlength="30" />
          <input name="email" type="email" placeholder="Email" maxlength="200" />
          <input class="hp" type="text" name="website" tabindex="-1" autocomplete="off" />
          <div class="human-check full">
        <label>Quick human check: what is <span class="hc-q">…</span>?
          <input name="humanCheck" inputmode="numeric" autocomplete="off" placeholder="?" required />
        </label>
      </div>
          <button class="btn full" type="submit">Get My Estimate</button>
          <p class="form-status" hidden></p>
          <p class="form-note" style="color:var(--stone);">Phone or email — one is enough.</p>
        </form>
      </div>
      <div id="ballpark-tool" hidden>
      <form id="ballpark-form" class="ballpark-form">
        <label>What are we building?
          <select name="project">${BALLPARK.projects.map((p) => `<option value="${p.key}">${p.label}</option>`).join('')}</select>
        </label>
        <label data-for="shower">Shower size
          <select name="size">${BALLPARK.projects[0].sizes.map((s) => `<option value="${s.key}">${s.label}</option>`).join('')}</select>
        </label>
        <label data-for="floor backsplash" hidden>Approximate square feet
          <input type="number" name="sqft" min="10" max="1000" value="60" />
        </label>
        <label>Installation complexity <span class="label-note">(your tile — we just install it)</span>
          <select name="grade">
            <option value="standard">Standard install — porcelain / ceramic</option>
            <option value="premium">Complex install — large format, stone, mosaic patterns</option>
          </select>
        </label>
        <fieldset>
          <legend>Add-ons</legend>
          ${BALLPARK.extras.map((x) => `<label class="check"><input type="checkbox" name="extra" value="${x.key}" /> ${x.label}</label>`).join('')}
        </fieldset>
      </form>
      <div class="ballpark-result" id="ballpark-result">
        <div class="labor-badge">INSTALLATION ONLY</div>
        <div class="range" id="ballpark-range">$—</div>
        <p class="note"><strong>${BALLPARK.laborOnly}</strong> ${BALLPARK.disclaimerShort}</p>
      </div>
      </div>
    </div>
    <div>
      <div class="hero-card" id="ballpark-book" style="position:sticky;top:90px;" hidden>
        <h3>MAKE IT A REAL NUMBER</h3>
        <p class="hero-card-sub">Like the range, <span id="ballpark-firstname">friend</span>? Get your exact written price — free, same day.</p>
        <button class="btn full" id="ballpark-book-btn" type="button">Book My Free Estimate</button>
        <p class="form-status" id="ballpark-book-status" hidden></p>
        <p class="form-note" style="color:var(--stone);">Your ballpark details come with it — no re-explaining.</p>
      </div>
    </div>
  </div>
</section>`;

add('/ballpark/', {
  title: 'Ballpark Tile Price Calculator | Showers, Floors, Backsplashes | Buddy Tile',
  description:
    'Get a 60-second ballpark price range for a tile shower, bathroom floor, or backsplash in Vancouver WA / Portland OR. Free in-home estimates turn it into a real number.',
  jsonLd: businessLd(),
  body: ballparkBody,
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

console.log(`Built ${urls.length} pages → site/`);
