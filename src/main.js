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


// ---- Design & Price (merged designer + ballpark) ---------------------------
(function () {
  var grid = document.getElementById('ds-features');
  if (!grid || !window.BT_DESIGNER || !window.BT_BALLPARK) return;
  var D = window.BT_DESIGNER;
  var BP = window.BT_BALLPARK;
  var state = { type: 'shower', w: 60, d: 36, h: 96, walls: 3, sqft: 60, grade: 'standard', layout: 'straight', floor: 'standard', feats: {}, extras: {} };

  // Shower feature cards — art only, no per-item prices (one number at the end)
  D.features.forEach(function (f) {
    var el = document.createElement('div');
    el.className = 'feature-card';
    el.dataset.key = f.key;
    el.innerHTML = '<img src="' + f.img + '" alt="" /><div class="fl">' + f.label + '</div>';
    el.addEventListener('click', function () {
      state.feats[f.key] = !state.feats[f.key];
      if (state.feats[f.key] && f.excludes) state.feats[f.excludes] = false;
      render();
    });
    grid.appendChild(el);
  });

  // Flat-project extras (floor/backsplash): demo + heated, art cards, no prices
  var flat = document.getElementById('ds-flat-extras');
  [{ key: 'demo', label: 'Demo & Haul Away', img: '/assets/img/catalog/curb.svg' },
   { key: 'heated', label: 'Heated Floor', img: '/assets/img/catalog/heated.svg' }].forEach(function (x) {
    var el = document.createElement('div');
    el.className = 'feature-card';
    el.dataset.extra = x.key;
    el.innerHTML = '<img src="' + x.img + '" alt="" /><div class="fl">' + x.label + '</div>';
    el.addEventListener('click', function () { state.extras[x.key] = !state.extras[x.key]; render(); });
    flat.appendChild(el);
  });

  function chips(id, attr, cb) {
    var box = document.getElementById(id);
    if (!box) return;
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
  ['ds-w', 'ds-d', 'ds-sqft'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
  });
  document.getElementById('ds-walls').addEventListener('change', render);

  // Project type + grade cards
  document.querySelectorAll('#ds-type .project-card').forEach(function (el) {
    el.addEventListener('click', function () {
      state.type = el.dataset.type;
      document.querySelectorAll('#ds-type .project-card').forEach(function (x) { x.classList.remove('on'); });
      el.classList.add('on');
      // sensible sqft defaults + quick-size chips per type
      var sizes = state.type === 'floor' ? [40, 60, 90] : [20, 30, 45];
      var sbox = document.getElementById('ds-sizes');
      sbox.innerHTML = '';
      sizes.forEach(function (n, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = '~' + n + ' sq ft';
        if (i === 1) b.classList.add('on');
        b.addEventListener('click', function () {
          sbox.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
          b.classList.add('on');
          document.getElementById('ds-sqft').value = n;
          render();
        });
        sbox.appendChild(b);
      });
      if (state.type !== 'shower') document.getElementById('ds-sqft').value = sizes[1];
      render();
    });
  });
  document.querySelectorAll('.project-card.grade').forEach(function (el) {
    el.addEventListener('click', function () {
      state.grade = el.dataset.grade;
      document.querySelectorAll('.project-card.grade').forEach(function (x) { x.classList.remove('on'); });
      el.classList.add('on');
      render();
    });
  });

  function priceCents() {
    if (state.type === 'shower') {
      var wFt = state.w / 12, dFt = state.d / 12, hFt = state.h / 12;
      var wallSqft = (state.walls === 3 ? wFt + 2 * dFt : wFt + dFt) * hFt;
      var floorSqft = wFt * dFt;
      var total = D.rates.fixedCents + wallSqft * D.rates.wallCents + floorSqft * D.rates.floorCents;
      D.features.forEach(function (f) { if (state.feats[f.key]) total += f.cents; });
      if (state.layout === 'herringbone' || state.layout === 'vertical') total += D.patternUpgradeCents;
      if (state.floor === 'mosaic') total += D.mosaicFloorCents;
      return { total: total, wallSqft: wallSqft, floorSqft: floorSqft };
    }
    var proj = BP.projects.filter(function (p) { return p.key === state.type; })[0];
    var t = Math.max(proj.minCents, state.sqft * proj.perSqftCents);
    if (state.grade === 'premium') t *= BP.premiumTileMultiplier;
    if (state.type === 'backsplash' && (state.layout === 'herringbone' || state.layout === 'vertical')) t += D.patternUpgradeCents;
    var ex = { demo: 63000, heated: 96600 };
    Object.keys(state.extras).forEach(function (k) { if (state.extras[k]) t += ex[k] || 0; });
    return { total: Math.max(t, BP.jobMinCents) };
  }

  function render() {
    state.w = Number(document.getElementById('ds-w').value) || 60;
    state.d = Number(document.getElementById('ds-d').value) || 36;
    state.walls = Number(document.getElementById('ds-walls').value);
    state.sqft = Number(document.getElementById('ds-sqft').value) || 60;
    var isShower = state.type === 'shower';

    // section + preview visibility by project type
    document.querySelectorAll('[data-show]').forEach(function (el) {
      el.hidden = el.dataset.show.split(' ').indexOf(state.type) === -1;
    });
    document.getElementById('ds-preview-svg').style.display = isShower ? 'block' : 'none';
    var img = document.getElementById('ds-preview-img');
    img.hidden = isShower;
    img.src = state.type === 'floor' ? '/assets/img/bathroom-tile-remodel-vancouver-wa.jpg' : '/assets/img/kitchen-tile-backsplash-installation.jpg';

    grid.querySelectorAll('.feature-card').forEach(function (el) {
      el.classList.toggle('on', !!state.feats[el.dataset.key]);
    });
    flat.querySelectorAll('.feature-card').forEach(function (el) {
      el.classList.toggle('on', !!state.extras[el.dataset.extra]);
    });

    var p = priceCents();
    if (isShower) {
      document.getElementById('ds-areas').innerHTML =
        'Wall area <b>' + p.wallSqft.toFixed(0) + ' sq ft</b> · Floor <b>' + p.floorSqft.toFixed(0) +
        ' sq ft</b> · Total tile <b>' + (p.wallSqft + p.floorSqft).toFixed(0) + ' sq ft</b>';
      var vis = function (id, on) { var e = document.getElementById(id); if (e) e.setAttribute('visibility', on ? 'visible' : 'hidden'); };
      vis('pv-niche', state.feats.niche || state.feats.niche2);
      vis('pv-niche2', state.feats.niche2);
      vis('pv-bench', state.feats.bench);
      vis('pv-shelf', state.feats.shelf);
      vis('pv-glass', state.feats.glass);
      vis('pv-rain', state.feats.rain);
      var curb = document.getElementById('pv-curb');
      if (curb) curb.setAttribute('visibility', state.feats.curbless ? 'hidden' : 'visible');
      document.getElementById('pv-dw').textContent = state.w + ' in';
      document.getElementById('pv-dd').textContent = state.d + ' in';
      document.getElementById('pv-dh').textContent = state.h + ' in';
    }

    var lo = Math.round(p.total * 0.9 / 100), hi = Math.round(p.total * 1.15 / 100);
    document.getElementById('design-range').textContent = '$' + lo.toLocaleString() + ' – $' + hi.toLocaleString();
    var picked = D.features.filter(function (f) { return state.feats[f.key]; }).map(function (f) { return f.label; });
    var extrasPicked = Object.keys(state.extras).filter(function (k) { return state.extras[k]; });
    window.__designSummary = isShower
      ? 'Tile shower ' + state.w + '\"W x ' + state.d + '\"D x ' + state.h + '\"H, ' + state.walls + ' walls, ' +
        (p.wallSqft + p.floorSqft).toFixed(0) + ' sqft — layout: ' + state.layout + ', floor: ' + state.floor +
        (picked.length ? ' — features: ' + picked.join(', ') : '') +
        ' → $' + lo.toLocaleString() + '–$' + hi.toLocaleString() + ' (labor only)'
      : (state.type === 'floor' ? 'Bathroom floor tile ~' : 'Kitchen backsplash ~') + state.sqft + ' sqft, ' +
        state.grade + ' install' + (state.type === 'backsplash' ? ', layout: ' + state.layout : '') +
        (extrasPicked.length ? ' + ' + extrasPicked.join(', ') : '') +
        ' → $' + lo.toLocaleString() + '–$' + hi.toLocaleString() + ' (labor only)';
  }
  render();

  // Gate + booking
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
        description: 'DESIGN TOOL (opened price) — ' + (window.__designSummary || ''),
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
        description: 'DESIGN TOOL — BOOK ESTIMATE — ' + (window.__designSummary || ''),
        divisionId: TILE_DIVISION_ID,
        source: 'buddytile.com design-book',
      }),
    }).then(function (r) {
      status.textContent = r.ok
        ? "You're booked for a call — we'll reach out the same business day!"
        : 'Something went wrong — please call us.';
    }).catch(function () { status.textContent = 'Something went wrong — please call us.'; });
  });
})();
