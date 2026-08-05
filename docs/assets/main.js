// Lead form → Buddy Built CRM (division: Buddy Tile). Zero dependencies.

// ---- Human check: tiny math question bots that blind-POST can't answer ------
(function () {
  document.querySelectorAll('.human-check').forEach(function (box) {
    var a = 2 + Math.floor(Math.random() * 7);
    var b = 2 + Math.floor(Math.random() * 7);
    box.querySelector('.hc-q').textContent = a + ' + ' + b;
    box.dataset.answer = String(a + b);
  });
})();

function passesHumanCheck(form, statusEl) {
  var box = form.querySelector('.human-check');
  if (!box) return true;
  var given = (form.querySelector('input[name=humanCheck]').value || '').trim();
  if (given === box.dataset.answer) return true;
  if (statusEl) {
    statusEl.hidden = false;
    statusEl.style.color = '#C0392B';
    statusEl.textContent = 'That math answer doesn\'t look right — one more try!';
  }
  return false;
}

(function () {
  // Local previews talk to the dev platform; the live site talks to production.
  var API_BASE =
    window.BT_API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://buddybuilt.com');
  var TILE_DIVISION_ID = 1;

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    if (form.id === 'ballpark-gate-form') return; // the gate has its own handler
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type=submit]');
      if (!passesHumanCheck(form, status)) return;
      var f = new FormData(form);
      if (!f.get('phone') && !f.get('email')) {
        status.hidden = false;
        status.style.color = '#FFB4A2';
        status.textContent = 'Please add a phone number or an email so we can reach you about your estimate.';
        return;
      }
      var description = [f.get('projectType'), f.get('description')].filter(Boolean).join(' — ');
      // Ballpark form: attach the calculator selections + range
      if (form.dataset.ballpark && window.__ballparkSummary) {
        description = 'BALLPARK REQUEST — ' + window.__ballparkSummary;
      }

      btn.disabled = true;
      status.hidden = false;
      status.style.color = '#fff';
      status.textContent = 'Sending…';

      fetch(API_BASE + '/api/public/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'),
          phone: f.get('phone') || undefined,
          email: f.get('email') || undefined,
          city: (f.get('city') || '').split(',')[0] || undefined,
          description: description || undefined,
          divisionId: TILE_DIVISION_ID,
          website: f.get('website') || undefined,
          source: 'buddytile.com ' + (form.dataset.context || ''),
        }),
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok) {
            status.style.color = '#F6B015';
            status.innerHTML = "Got it! We'll reach out the same business day. <img src='/assets/img/buddy-tile-sm.png?v=3' alt='Buddy Tile' style='height:26px;vertical-align:-8px;margin-left:6px'>";
            form.reset();
          } else {
            throw new Error(res.d && res.d.error);
          }
        })
        .catch(function (err) {
          status.style.color = '#FFB4A2';
          status.innerHTML =
            ((err && err.message) || 'Something went wrong.') +
            ' Call <a href="tel:+13608996336" style="color:inherit;font-weight:700;">(360) 899-6336</a> or email <a href="mailto:info@buddytile.com" style="color:inherit;font-weight:700;">info@buddytile.com</a>.';
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
  });
})();


// ---- 60-second ballpark calculator ----------------------------------------
(function () {
  var form = document.getElementById('ballpark-form');
  var cfg = window.BT_BALLPARK;
  if (!form || !cfg) return;

  var money = function (cents) {
    return '$' + Math.round(cents / 100).toLocaleString('en-US');
  };

  function compute() {
    var f = new FormData(form);
    var projectKey = f.get('project');
    var project = cfg.projects.find(function (p) { return p.key === projectKey; });
    if (!project) return;

    // show/hide inputs for the chosen project
    form.querySelectorAll('label[data-for]').forEach(function (l) {
      l.hidden = l.dataset.for.split(' ').indexOf(projectKey) === -1;
    });

    var base = 0;
    var parts = [project.label];
    if (project.sizes) {
      var size = project.sizes.find(function (s) { return s.key === f.get('size'); }) || project.sizes[0];
      base = size.base;
      parts.push(size.label);
    } else {
      var sqft = Math.max(10, Math.min(1000, Number(f.get('sqft')) || 0));
      base = Math.max(project.minCents, sqft * project.perSqftCents);
      parts.push(sqft + ' SF');
    }

    if (f.get('grade') === 'premium') {
      base = Math.round(base * cfg.premiumTileMultiplier);
      parts.push('premium tile');
    }

    var extras = f.getAll('extra');
    extras.forEach(function (key) {
      var x = cfg.extras.find(function (e) { return e.key === key; });
      if (x) {
        base += x.cents;
        parts.push(x.label);
      }
    });

    var low = Math.round((base * cfg.rangeLow) / 10000) * 10000;
    var high = Math.round((base * cfg.rangeHigh) / 10000) * 10000;
    // Job minimum: tile work books at least two days (install + return to grout)
    if (cfg.jobMinCents) {
      low = Math.max(low, cfg.jobMinCents);
      high = Math.max(high, Math.round((cfg.jobMinCents * 1.15) / 10000) * 10000);
    }
    var rangeText = money(low) + ' – ' + money(high);
    document.getElementById('ballpark-range').textContent = rangeText + ' ballpark';
    window.__ballparkSummary = parts.join(', ') + ' → ' + rangeText + ' (labor only, finish materials excluded)';
  }

  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  compute();
})();


// ---- Ballpark gate: contact unlocks the tool; the lead always gets captured -
(function () {
  var gate = document.getElementById('ballpark-gate');
  var tool = document.getElementById('ballpark-tool');
  var bookCard = document.getElementById('ballpark-book');
  if (!gate || !tool) return;

  var API_BASE =
    window.BT_API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://buddybuilt.com');
  var submitted = false;
  var contact = null;
  try {
    contact = JSON.parse(localStorage.getItem('bt_contact') || 'null');
  } catch (e) { /* ignore */ }

  function unlock() {
    gate.hidden = true;
    tool.hidden = false;
    bookCard.hidden = false;
    var fn = document.getElementById('ballpark-firstname');
    if (fn && contact && contact.name) fn.textContent = contact.name.split(' ')[0];
  }

  function sendLead(kind, keepalive) {
    if (submitted || !contact) return Promise.resolve();
    submitted = true;
    var summary = window.__ballparkSummary || 'opened the tool, no configuration';
    return fetch(API_BASE + '/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: !!keepalive,
      body: JSON.stringify({
        name: contact.name,
        phone: contact.phone || undefined,
        email: contact.email || undefined,
        description: kind + ' — ' + summary,
        divisionId: 1,
        source: 'buddytile.com ballpark',
      }),
    }).catch(function () { submitted = false; });
  }

  // Returning visitor with saved contact skips the gate
  if (contact && contact.name && (contact.phone || contact.email)) unlock();

  var gateForm = document.getElementById('ballpark-gate-form');
  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(gateForm);
    var status = gateForm.querySelector('.form-status');
    if (f.get('website')) return; // honeypot
    if (!passesHumanCheck(gateForm, status)) return;
    if (!f.get('phone') && !f.get('email')) {
      status.hidden = false;
      status.style.color = '#FFB4A2';
      status.textContent = 'Please add a phone number or an email so we can reach you.';
      return;
    }

    contact = { name: f.get('name'), phone: f.get('phone'), email: f.get('email') };
    try { localStorage.setItem('bt_contact', JSON.stringify(contact)); } catch (e) { /* ignore */ }
    unlock();
  });

  // One-click booking with the full configuration attached
  var bookBtn = document.getElementById('ballpark-book-btn');
  bookBtn.addEventListener('click', function () {
    var status = document.getElementById('ballpark-book-status');
    status.hidden = false;
    status.style.color = 'var(--navy)';
    status.textContent = 'Booking…';
    sendLead('BALLPARK BOOKING REQUEST', false).then(function () {
      status.style.color = '#1E8449';
      status.innerHTML = "You're booked for a call! We'll reach out the same business day. <img src='/assets/img/buddy-tile-sm.png?v=3' alt='Buddy Tile' style='height:26px;vertical-align:-8px;margin-left:6px'>";
      bookBtn.disabled = true;
    });
  });

  // They gave contact but left without booking — capture the lead anyway
  window.addEventListener('pagehide', function () {
    if (contact && !submitted && !tool.hidden) sendLead('BALLPARK BROWSED (did not book)', true);
  });
})();


// ---- Header: big logo at the top of the page, compact once you scroll ------
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var apply = function () {
    header.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', apply, { passive: true });
  apply();
})();




// ---- Design Your Shower ----------------------------------------------------
(function () {
  var grid = document.getElementById('ds-features');
  if (!grid || !window.BT_DESIGNER) return;
  var D = window.BT_DESIGNER;
  var state = { w: 60, d: 36, h: 96, walls: 3, layout: 'straight', floor: 'standard', feats: {} };

  D.features.forEach(function (f) {
    var el = document.createElement('div');
    el.className = 'feature-card';
    el.dataset.key = f.key;
    el.innerHTML = '<img src="' + f.img + '" alt="" /><div class="fl">' + f.label + '</div><div class="fp">+$' + Math.round(f.cents / 100).toLocaleString() + '</div>';
    el.addEventListener('click', function () {
      state.feats[f.key] = !state.feats[f.key];
      if (state.feats[f.key] && f.excludes) state.feats[f.excludes] = false;
      render();
    });
    grid.appendChild(el);
  });

  function chips(id, attr, cb) {
    var box = document.getElementById(id);
    box.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        box.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
        cb(b.dataset[attr]);
        render();
      });
    });
  }
  chips('ds-h', 'h', function (v) { state.h = Number(v); });
  chips('ds-layout', 'k', function (v) { state.layout = v; });
  chips('ds-floor', 'k', function (v) { state.floor = v; });
  ['ds-w', 'ds-d'].forEach(function (id) {
    document.getElementById(id).addEventListener('input', render);
  });
  document.getElementById('ds-walls').addEventListener('change', render);

  function priceCents() {
    var wFt = state.w / 12, dFt = state.d / 12, hFt = state.h / 12;
    var wallSqft = (state.walls === 3 ? wFt + 2 * dFt : wFt + dFt) * hFt;
    var floorSqft = wFt * dFt;
    var total = D.rates.fixedCents + wallSqft * D.rates.wallCents + floorSqft * D.rates.floorCents;
    D.features.forEach(function (f) { if (state.feats[f.key]) total += f.cents; });
    if (state.layout === 'herringbone' || state.layout === 'vertical') total += D.patternUpgradeCents;
    if (state.floor === 'mosaic') total += D.mosaicFloorCents;
    return { total: total, wallSqft: wallSqft, floorSqft: floorSqft };
  }

  function render() {
    state.w = Number(document.getElementById('ds-w').value) || 60;
    state.d = Number(document.getElementById('ds-d').value) || 36;
    state.walls = Number(document.getElementById('ds-walls').value);
    grid.querySelectorAll('.feature-card').forEach(function (el) {
      el.classList.toggle('on', !!state.feats[el.dataset.key]);
    });
    var p = priceCents();
    document.getElementById('ds-areas').innerHTML =
      'Wall area <b>' + p.wallSqft.toFixed(0) + ' sq ft</b> · Floor <b>' + p.floorSqft.toFixed(0) +
      ' sq ft</b> · Total tile <b>' + (p.wallSqft + p.floorSqft).toFixed(0) + ' sq ft</b>';
    // preview
    var vis = function (id, on) { var e = document.getElementById(id); if (e) e.setAttribute('visibility', on ? 'visible' : 'hidden'); };
    vis('pv-niche', state.feats.niche || state.feats.niche2);
    vis('pv-niche2', state.feats.niche2);
    vis('pv-bench', state.feats.bench);
    vis('pv-shelf', state.feats.shelf);
    vis('pv-glass', state.feats.glass);
    vis('pv-rain', state.feats.rain);
    var curb = document.getElementById('pv-curb');
    if (curb) curb.setAttribute('visibility', state.feats.curbless ? 'hidden' : 'visible');
    document.getElementById('pv-dw').textContent = state.w + '"';
    document.getElementById('pv-dd').textContent = state.d + '"';
    document.getElementById('pv-dh').textContent = state.h + '"';
    // price + summary
    var lo = Math.round(p.total * 0.9 / 100), hi = Math.round(p.total * 1.15 / 100);
    document.getElementById('design-range').textContent = '$' + lo.toLocaleString() + ' – $' + hi.toLocaleString();
    var picked = D.features.filter(function (f) { return state.feats[f.key]; }).map(function (f) { return f.label; });
    window.__designSummary =
      state.w + '\"W x ' + state.d + '\"D x ' + state.h + '\"H, ' + state.walls + ' walls, ' +
      (p.wallSqft + p.floorSqft).toFixed(0) + ' sqft tile — layout: ' + state.layout + ', floor: ' + state.floor +
      (picked.length ? ' — features: ' + picked.join(', ') : ' — no add-on features') +
      ' → $' + lo.toLocaleString() + '–$' + hi.toLocaleString() + ' (labor only)';
  }
  render();

  // Gate + booking (mirrors the ballpark flow)
  var gate = document.getElementById('design-gate');
  var result = document.getElementById('design-result');
  var contact = null;
  var gateForm = document.getElementById('design-gate-form');
  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = gateForm.querySelector('.form-status');
    if (!passesHumanCheck(gateForm, status)) return;
    var f = new FormData(gateForm);
    contact = { name: f.get('name'), email: f.get('email'), phone: f.get('phone') || undefined };
    fetch(API_BASE + '/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contact.name, email: contact.email, phone: contact.phone,
        description: 'SHOWER DESIGN (opened tool) — ' + (window.__designSummary || ''),
        divisionId: TILE_DIVISION_ID, website: f.get('website') || undefined,
        source: 'buddytile.com design',
      }),
    }).catch(function () {});
    gate.hidden = true;
    result.hidden = false;
    render();
  });
  document.getElementById('design-book-btn').addEventListener('click', function () {
    var status = document.getElementById('design-book-status');
    status.hidden = false;
    status.style.color = 'var(--navy)';
    status.textContent = 'Booking…';
    fetch(API_BASE + '/api/public/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contact ? contact.name : 'Design tool visitor',
        email: contact ? contact.email : undefined,
        phone: contact ? contact.phone : undefined,
        description: 'SHOWER DESIGN — BOOK ESTIMATE — ' + (window.__designSummary || ''),
        divisionId: TILE_DIVISION_ID,
        source: 'buddytile.com design-book',
      }),
    }).then(function (r) {
      status.textContent = r.ok
        ? "You're booked for a call — we'll reach out the same business day!"
        : 'Something went wrong — call us at ' + (document.querySelector('.phone-link') || {}).textContent;
    }).catch(function () { status.textContent = 'Something went wrong — please call us.'; });
  });
})();
