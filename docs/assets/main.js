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
            status.textContent = "Got it! We'll reach out the same business day. 🐶";
            form.reset();
          } else {
            throw new Error(res.d && res.d.error);
          }
        })
        .catch(function (err) {
          status.style.color = '#FFB4A2';
          status.innerHTML =
            ((err && err.message) || 'Something went wrong.') +
            ' Call <a href="tel:+13608996336" style="color:inherit;font-weight:700;">(360) 899-6336</a> or email <a href="mailto:hello@buddytile.com" style="color:inherit;font-weight:700;">hello@buddytile.com</a>.';
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
      status.textContent = "You're booked for a call! We'll reach out the same business day. 🐶";
      bookBtn.disabled = true;
    });
  });

  // They gave contact but left without booking — capture the lead anyway
  window.addEventListener('pagehide', function () {
    if (contact && !submitted && !tool.hidden) sendLead('BALLPARK BROWSED (did not book)', true);
  });
})();
