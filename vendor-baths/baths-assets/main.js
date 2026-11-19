// Lead form → Buddy Built CRM (division: Buddy Baths). Zero dependencies.

// ---- Division lookup: resolve the Buddy Baths division id by slug ---------
// Dev and prod assign ids in creation order, so a hardcoded id would drift.
// GET /api/public/divisions once, cache the id, fall back to BT_DIVISION_ID.
var BT_DIVISION_SLUG = 'baths';
var BT_DIVISION_ID = window.BT_DIVISION_ID || null; // optional override
function btApiBase() {
  return (
    window.BT_API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://buddybuilt.com')
  );
}
var btDivisionsPromise = null;
var BT_DIVISION_IDS = {};
function btDivisions() {
  if (!btDivisionsPromise) {
    btDivisionsPromise = fetch(btApiBase() + '/api/public/divisions')
      .then(function (r) { return r.json(); })
      .then(function (list) {
        (list || []).forEach(function (d) { if (d && d.slug) BT_DIVISION_IDS[d.slug] = d.id; });
        if (BT_DIVISION_IDS[BT_DIVISION_SLUG]) BT_DIVISION_ID = BT_DIVISION_IDS[BT_DIVISION_SLUG];
        return BT_DIVISION_IDS;
      })
      .catch(function () { return BT_DIVISION_IDS; });
  }
  return btDivisionsPromise;
}
// Resolve a division id by slug (default: this site's). Every lead on this
// site goes to the baths division; the slug argument is here for future use.
function btDivisionId(slug) {
  slug = slug || BT_DIVISION_SLUG;
  if (slug === BT_DIVISION_SLUG && BT_DIVISION_ID) return Promise.resolve(BT_DIVISION_ID);
  return btDivisions().then(function (ids) { return ids[slug] || (slug === BT_DIVISION_SLUG ? BT_DIVISION_ID : null); });
}
btDivisionId();

// ---- Remember which path the visitor chose (one-day vs custom) ----------
(function () {
  try {
    var path = document.documentElement.getAttribute('data-path');
    if (path) { localStorage.setItem('bb_path', path); return; }
    var seen = localStorage.getItem('bb_path');
    if (!seen) return;
    var half = document.querySelector('.split[data-path="' + seen + '"]');
    if (half) half.classList.add('is-remembered');
  } catch (e) { /* storage blocked: no memory, no harm */ }
})();

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
    statusEl.textContent = 'That math answer doesn\'t look right, one more try!';
  }
  return false;
}

// ---- Site constants for the shared lead + booking code ----------------------
var BT_BOOK = {
  site: 'buddybaths.com',
  phone: '(360) 899-6336',
  tel: '+13608996336',
  email: 'info@buddybaths.com',
  okColor: '#38798A',
  okHtml: "Got it! We'll reach out the same business day.",
  // Local previews talk to the dev platform; the live site talks to production.
  apiBase: btApiBase,
  divisionId: function () { return btDivisionId(); },
};
// ---- Lead + booking submit (shared across the Buddy brand sites, 2026-11-05) ----
// Plain lead → POST /api/public/leads. With a visit time picked in the booking
// block → POST /api/public/book: one call creates the lead, puts the visit on
// an estimator's calendar, emails the homeowner, and alerts the team.
(function () {
  var API_BASE = BT_BOOK.apiBase();
  var WARN = '#FFB4A2';
  var contactLine =
    ' Call <a href="tel:' + BT_BOOK.tel + '" style="color:inherit;font-weight:700;">' + BT_BOOK.phone + '</a> or email <a href="mailto:' +
    BT_BOOK.email + '" style="color:inherit;font-weight:700;">' + BT_BOOK.email + '</a>.';

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    if (form.id === 'ballpark-gate-form' || form.id === 'design-gate-form') return; // gates have their own handlers
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type=submit]');
      var say = function (color, html) { status.hidden = false; status.style.color = color; status.innerHTML = html; };
      if (!passesHumanCheck(form, status)) return;
      var f = new FormData(form);
      var startAt = (f.get('startAt') || '').trim();
      var email = (f.get('email') || f.get('bookEmail') || '').trim();
      var phone = (f.get('phone') || '').trim();
      if (!phone && !email) {
        say(WARN, 'Please add a phone number or an email so we can reach you about your estimate.');
        return;
      }
      var city = (f.get('city') || f.get('bookCity') || '').split(',')[0].trim();
      var address = (f.get('addressLine1') || '').trim();
      var zip = (f.get('zip') || '').replace(/[^0-9]/g, '').slice(0, 5);
      if (startAt) {
        if (!phone) { say(WARN, 'A phone number is required to book a visit.'); return; }
        if (!address || !city) { say(WARN, 'Please add the home address and city for the visit.'); return; }
      }
      var description = [f.get('projectType'), f.get('description')].filter(Boolean).join(', ');
      // Ballpark form: attach the calculator selections + range
      if (form.dataset.ballpark && window.__ballparkSummary) {
        description = 'BALLPARK REQUEST, ' + window.__ballparkSummary;
      }

      btn.disabled = true;
      say('#fff', startAt ? 'Booking your visit…' : 'Sending…');

      var payload = {
        name: f.get('name'),
        phone: phone || undefined,
        email: email || undefined,
        city: city || undefined,
        addressLine1: address || undefined,
        zip: zip || undefined,
        state: zip ? (zip.indexOf('97') === 0 ? 'OR' : 'WA') : undefined,
        description: description || undefined,
        website: f.get('website') || undefined,
        source: BT_BOOK.site + ' ' + (form.dataset.context || ''),
        startAt: startAt || undefined,
      };

      BT_BOOK.divisionId()
        .then(function (divisionId) {
          payload.divisionId = divisionId || undefined;
          return fetch(API_BASE + (startAt ? '/api/public/book' : '/api/public/leads'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          var d = res.d || {};
          if (res.ok && startAt) {
            say(
              BT_BOOK.okColor,
              "You're booked for <b>" + d.when + '</b>' + (d.estimator && d.estimator.firstName ? ' with ' + d.estimator.firstName : '') + '.' +
                (d.confirmationSent ? ' A confirmation is on its way to your inbox.' : " We'll call to confirm the details.")
            );
            form.reset();
            if (window.btBookingDone) window.btBookingDone(form, d);
          } else if (res.ok) {
            say(BT_BOOK.okColor, BT_BOOK.okHtml);
            form.reset();
          } else if (d.code === 'SLOT_TAKEN' && !d.leadSaved) {
            say(WARN, 'That time was just taken. Pick another one below.');
            if (window.btBookingRefresh) window.btBookingRefresh(form);
          } else if (d.leadSaved) {
            say(BT_BOOK.okColor, "We saved your request but couldn't hold that time. We'll call you to pick one together.");
            form.reset();
            if (window.btBookingDone) window.btBookingDone(form, null);
          } else {
            throw new Error(d.error);
          }
        })
        .catch(function (err) {
          say(WARN, ((err && err.message) || 'Something went wrong.') + contactLine);
        })
        .finally(function () {
          btn.disabled = false;
        });
    });
  });
})();

// ---- Booking block: day strip + time chips inside any lead form -------------
// Open times come from GET /api/public/availability (Pacific, no names).
// Picking a time reveals the address fields and flips the button to "Book".
(function () {
  var blocks = document.querySelectorAll('.book');
  if (!blocks.length) return;
  var API_BASE = BT_BOOK.apiBase();
  var DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var availPromise = null;
  function load(force) {
    if (!availPromise || force) {
      availPromise = BT_BOOK.divisionId()
        .then(function (id) {
          return fetch(API_BASE + '/api/public/availability' + (id ? '?divisionId=' + id : ''), { cache: 'no-store' }).then(function (r) { return r.json(); });
        })
        .catch(function () { return { enabled: false, reason: 'We could not load the calendar' }; });
    }
    return availPromise;
  }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }

  function init(block) {
    var form = block.closest('form');
    if (!form) return;
    var submit = form.querySelector('button[type=submit]');
    var submitText = submit ? submit.textContent : '';
    var toggle = block.querySelector('.book-toggle');
    var panel = block.querySelector('.book-panel');
    var days = block.querySelector('.book-days');
    var times = block.querySelector('.book-times');
    var note = block.querySelector('.book-note');
    var pick = block.querySelector('.book-pick');
    var addr = block.querySelector('.book-addr');
    var hidden = block.querySelector('input[name=startAt]');
    var skip = block.querySelector('.book-skip');
    var state = { data: null, day: null, start: null };

    toggle.addEventListener('click', open);
    skip.addEventListener('click', function () {
      clear();
      panel.hidden = true;
      toggle.hidden = false;
      block.classList.remove('is-open');
    });
    if (block.hasAttribute('data-open')) open();

    function open() {
      block.classList.add('is-open');
      panel.hidden = false;
      toggle.hidden = true;
      if (!state.data) render(false);
    }
    function render(force) {
      note.hidden = false;
      note.textContent = 'Checking open times…';
      days.innerHTML = '';
      times.innerHTML = '';
      load(force).then(function (d) {
        state.data = d;
        if (!d.enabled) {
          note.textContent = (d.reason || 'Online booking is not available right now') + '. Send the form and we will call you to schedule.';
          return;
        }
        var withSlots = d.days.filter(function (x) { return x.slots.length; });
        if (!withSlots.length) {
          note.textContent = 'No open times in the next ' + (d.horizonDays || 21) + ' days. Send the form and we will find one together.';
          return;
        }
        note.hidden = true;
        var first = null;
        d.days.forEach(function (day) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'book-day' + (day.slots.length ? '' : ' off');
          b.disabled = !day.slots.length;
          var ymd = day.date.split('-');
          b.innerHTML = '<span>' + DOW[day.weekday] + '</span><b>' + Number(ymd[2]) + '</b><small>' + MON[Number(ymd[1]) - 1] + '</small>';
          b.setAttribute('aria-label', day.label + (day.slots.length ? ', ' + day.slots.length + ' open times' : ', full'));
          b.addEventListener('click', function () { selectDay(day, b); });
          days.appendChild(b);
          if (!first && day.slots.length) first = { day: day, el: b };
        });
        if (first) selectDay(first.day, first.el);
      });
    }
    function selectDay(day, el) {
      state.day = day;
      each(days.children, function (c) { c.classList.toggle('on', c === el); });
      times.innerHTML = '';
      day.slots.forEach(function (s) {
        var t = document.createElement('button');
        t.type = 'button';
        t.className = 'book-time' + (s.start === state.start ? ' on' : '');
        t.textContent = s.time;
        t.addEventListener('click', function () { selectTime(s, t, day); });
        times.appendChild(t);
      });
      if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
    function selectTime(s, el, day) {
      state.start = s.start;
      hidden.value = s.start;
      each(times.children, function (c) { c.classList.toggle('on', c === el); });
      pick.hidden = false;
      pick.querySelector('b').textContent = day.label + ' at ' + s.time;
      addr.hidden = false;
      each(addr.querySelectorAll('[data-req]'), function (i) { i.required = true; });
      if (submit) submit.textContent = 'Book My Free Estimate';
      var a = addr.querySelector('input[name=addressLine1]');
      if (a && !a.value) a.focus();
    }
    function clear() {
      state.start = null;
      hidden.value = '';
      pick.hidden = true;
      addr.hidden = true;
      each(addr.querySelectorAll('[data-req]'), function (i) { i.required = false; });
      each(times.children, function (c) { c.classList.remove('on'); });
      if (submit) submit.textContent = submitText;
    }
    block._refresh = function () { clear(); render(true); };
    block._done = function (d) {
      clear();
      panel.hidden = true;
      toggle.hidden = true;
      var done = block.querySelector('.book-done');
      if (done) {
        done.hidden = false;
        done.innerHTML = d && d.when ? 'Visit booked: <b>' + d.when + '</b>' : 'Request received, we will call you to schedule.';
      }
      availPromise = null; // the slot is gone, other forms on the page refetch
    };
  }
  each(blocks, init);

  window.btBookingRefresh = function (form) { var b = form.querySelector('.book'); if (b && b._refresh) b._refresh(); };
  window.btBookingDone = function (form, d) { var b = form.querySelector('.book'); if (b && b._done) b._done(d); };
})();


// ---- Design & Price: project + size -> one ballpark number ---------------
// Deliberately simple: no feature/upgrade configuration in public (that list
// belongs to the free estimate, not to competitors' quote-matching).
(function () {
  var typeBox = document.getElementById('ds-type');
  if (!typeBox || !window.BT_DESIGNER || !window.BT_BALLPARK) return;
  var D = window.BT_DESIGNER;
  var BP = window.BT_BALLPARK;
  var API_BASE =
    window.BT_API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://buddybuilt.com');
  var TILE_DIVISION_ID = BT_DIVISION_ID; // resolved from the platform by slug, see top of file
  var state = { type: 'shower', w: 60, d: 36, h: 96, walls: 3, sqft: 60, scope: 'tile', rsize: 'standard' };

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
  ['ds-w', 'ds-d', 'ds-sqft'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', render);
  });
  document.getElementById('ds-walls').addEventListener('change', render);
  document.querySelectorAll('#ds-scope .project-card').forEach(function (el) {
    el.addEventListener('click', function () {
      state.scope = el.dataset.scope;
      document.querySelectorAll('#ds-scope .project-card').forEach(function (x) { x.classList.remove('on'); });
      el.classList.add('on');
      render();
    });
  });
  document.querySelectorAll('#ds-rsize .project-card').forEach(function (el) {
    el.addEventListener('click', function () {
      state.rsize = el.dataset.rsize;
      document.querySelectorAll('#ds-rsize .project-card').forEach(function (x) { x.classList.remove('on'); });
      el.classList.add('on');
      render();
    });
  });

  document.querySelectorAll('#ds-type .project-card').forEach(function (el) {
    el.addEventListener('click', function () {
      state.type = el.dataset.type;
      document.querySelectorAll('#ds-type .project-card').forEach(function (x) { x.classList.remove('on'); });
      el.classList.add('on');
      var sizes = state.type === 'floor' ? [40, 60, 90] : [20, 30, 45];
      var sbox = document.getElementById('ds-sizes');
      if (state.type === 'remodel') { render(); return; }
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

  function priceCents() {
    if (state.type === 'remodel') {
      return { total: D.remodel.baseCents * D.remodel.sizes[state.rsize] };
    }
    if (state.type === 'shower') {
      var wFt = state.w / 12, dFt = state.d / 12, hFt = state.h / 12;
      var wallSqft = (state.walls === 3 ? wFt + 2 * dFt : wFt + dFt) * hFt;
      var floorSqft = wFt * dFt;
      // tile-only: no demo/dump/valve fixed scope; complex: full fixed + bump
      var fixed = state.scope === 'complex' ? D.rates.fixedCents : D.tileOnlyFixedCents;
      var t = fixed + wallSqft * D.rates.wallCents + floorSqft * D.rates.floorCents;
      if (state.scope === 'complex') t *= D.complexMultiplier;
      return { total: t, wallSqft: wallSqft, floorSqft: floorSqft };
    }
    var proj = BP.projects.filter(function (p) { return p.key === state.type; })[0];
    return { total: Math.max(BP.jobMinCents, Math.max(proj.minCents, state.sqft * proj.perSqftCents)) };
  }

  // floor: complex adds demo/dump/plumbing scope
  var scoped = function (t) {
    return state.type === 'floor' && state.scope === 'complex'
      ? (t + 63000) * D.complexMultiplier
      : t;
  };

  function render() {
    state.w = Number(document.getElementById('ds-w').value) || 60;
    state.d = Number(document.getElementById('ds-d').value) || 36;
    state.walls = Number(document.getElementById('ds-walls').value);
    state.sqft = Number(document.getElementById('ds-sqft').value) || 60;
    var isShower = state.type === 'shower';

    document.querySelectorAll('[data-show]').forEach(function (el) {
      el.hidden = el.dataset.show.split(' ').indexOf(state.type) === -1;
    });
    var svg = document.getElementById('ds-preview-shower');
    if (svg) svg.style.display = isShower ? 'block' : 'none';
    var img = document.getElementById('ds-preview-img');
    img.hidden = isShower;
    img.src = state.type === 'floor' ? '/baths-assets/img/bathroom-tile-remodel-vancouver-wa.jpg'
      : state.type === 'remodel' ? '/baths-assets/img/marble-tile-shower-glass-door.jpg'
      : '/baths-assets/img/kitchen-tile-backsplash-installation.jpg';

    var p = priceCents();
    p.total = scoped(p.total);
    if (isShower) {
      document.getElementById('ds-areas').innerHTML =
        'Wall area <b>' + p.wallSqft.toFixed(0) + ' sq ft</b> · Floor <b>' + p.floorSqft.toFixed(0) +
        ' sq ft</b> · Total tile <b>' + (p.wallSqft + p.floorSqft).toFixed(0) + ' sq ft</b>';
      document.getElementById('pv-dw').textContent = state.w + ' in';
      document.getElementById('pv-dd').textContent = state.d + ' in';
      document.getElementById('pv-dh').textContent = state.h + ' in';
    }

    var lo = Math.round(p.total * D.rangeLo / 100), hi = Math.round(p.total * D.rangeHi / 100);
    document.getElementById('design-range').textContent = '$' + lo.toLocaleString() + ' - $' + hi.toLocaleString();
    var scopeNote = (state.type === 'shower' || state.type === 'floor')
      ? (state.scope === 'complex' ? ', scope: more than tile' : ', scope: tile only') : '';
    window.__designSummary = (isShower
      ? 'Tile shower ' + state.w + '\"W x ' + state.d + '\"D x ' + state.h + '\"H, ' + state.walls + ' walls, ' + (p.wallSqft + p.floorSqft).toFixed(0) + ' sqft'
      : state.type === 'remodel' ? 'Full bathroom remodel (' + state.rsize + ')'
      : (state.type === 'floor' ? 'Bathroom floor tile ~' : 'Kitchen backsplash ~') + state.sqft + ' sqft') +
      scopeNote + ' → $' + lo.toLocaleString() + '-$' + hi.toLocaleString() + ' (core build, labor only)';
  }
  render();

  // Gate + booking
  var gate = document.getElementById('design-gate');
  var result = document.getElementById('design-result');
  var contact = null;
  // Email verification: the visitor proves the address with a 6-digit
  // code before the number shows and before they become a lead.
  var verify = document.getElementById('design-verify');
  var verifyForm = document.getElementById('design-verify-form');
  var verifyEmailEl = document.getElementById('design-verify-email');
  var gateForm = document.getElementById('design-gate-form');
  var honeypot = undefined;

  function showStatus(form, msg, ok) {
    var status = form.querySelector('.form-status');
    status.hidden = !msg;
    status.style.color = ok ? 'var(--navy)' : '#C0392B';
    status.textContent = msg || '';
  }
  function setBusy(form, busy) {
    var btn = form.querySelector('button[type=submit]');
    if (btn) { btn.disabled = busy; }
  }
  function postJson(path, payload) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) throw new Error(data.error || 'Something went wrong, please try again.');
        return data;
      });
    });
  }
  function sendCode() {
    setBusy(gateForm, true);
    setBusy(verifyForm, true);
    return postJson('/api/public/verify/start', {
      email: contact.email, divisionId: TILE_DIVISION_ID, website: honeypot,
    }).then(function () {
      verifyEmailEl.textContent = contact.email;
      gate.hidden = true;
      verify.hidden = false;
      showStatus(gateForm, '', true);
      showStatus(verifyForm, '', true);
      var codeBox = verifyForm.querySelector('input[name=code]');
      codeBox.value = '';
      codeBox.focus();
    }).catch(function (err) {
      showStatus(gate.hidden ? verifyForm : gateForm, err.message, false);
    }).then(function () {
      setBusy(gateForm, false);
      setBusy(verifyForm, false);
    });
  }

  gateForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = gateForm.querySelector('.form-status');
    if (!passesHumanCheck(gateForm, status)) return;
    var f = new FormData(gateForm);
    honeypot = f.get('website') || undefined;
    contact = { name: f.get('name'), email: String(f.get('email') || '').trim(), phone: f.get('phone') || undefined };
    showStatus(gateForm, 'Sending your code…', true);
    sendCode();
  });

  verifyForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = (verifyForm.querySelector('input[name=code]').value || '').replace(/\D/g, '');
    if (code.length !== 6) { showStatus(verifyForm, 'Enter the 6-digit code from your email.', false); return; }
    setBusy(verifyForm, true);
    showStatus(verifyForm, 'Checking…', true);
    postJson('/api/public/verify/check', { email: contact.email, code: code }).then(function (data) {
      contact.verificationToken = data.token;
      return postJson('/api/public/leads', {
        name: contact.name, email: contact.email, phone: contact.phone,
        description: 'BALLPARK TOOL, ' + (window.__designSummary || ''),
        divisionId: TILE_DIVISION_ID, website: honeypot,
        source: 'buddybaths.com design',
        verificationToken: contact.verificationToken,
      });
    }).then(function () {
      verify.hidden = true;
      result.hidden = false;
      render();
    }).catch(function (err) {
      showStatus(verifyForm, err.message, false);
    }).then(function () { setBusy(verifyForm, false); });
  });

  document.getElementById('design-verify-resend').addEventListener('click', function (e) {
    e.preventDefault();
    showStatus(verifyForm, 'Sending a new code…', true);
    sendCode().then(function () {
      if (!verify.hidden) showStatus(verifyForm, 'New code sent, check your inbox.', true);
    });
  });
  document.getElementById('design-verify-edit').addEventListener('click', function (e) {
    e.preventDefault();
    verify.hidden = true;
    gate.hidden = false;
    showStatus(gateForm, '', true);
    gateForm.querySelector('input[name=email]').focus();
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
        name: contact ? contact.name : 'Ballpark visitor',
        email: contact ? contact.email : undefined,
        phone: contact ? contact.phone : undefined,
        description: 'BALLPARK TOOL, BOOK ESTIMATE, ' + (window.__designSummary || ''),
        divisionId: TILE_DIVISION_ID,
        source: 'buddybaths.com design-book',
        verificationToken: contact ? contact.verificationToken : undefined,
      }),
    }).then(function (r) {
      status.textContent = r.ok
        ? "You're booked for a call, we'll reach out the same business day!"
        : 'Something went wrong, please call us.';
    }).catch(function () { status.textContent = 'Something went wrong, please call us.'; });
  });
})();

// ---- /pay/: invoice lookup, we email the secure payment link ---------------
(function () {
  var form = document.getElementById('pay-lookup');
  if (!form) return;
  var API_BASE =
    window.BT_API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://buddybuilt.com');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('button[type=submit]');
    var f = new FormData(form);
    btn.disabled = true;
    status.hidden = false;
    status.style.color = 'var(--navy)';
    status.textContent = 'Checking…';
    fetch(API_BASE + '/api/public/pay-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ number: f.get('number'), email: f.get('email') }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        status.style.color = d.ok ? '#1B7F3B' : '#C0392B';
        status.textContent = d.message || d.error || 'Something went wrong. Give us a call!';
      })
      .catch(function () {
        status.style.color = '#C0392B';
        status.textContent = 'Could not reach the server. Call (360) 899-6336 and we will take care of it.';
      })
      .finally(function () {
        btn.disabled = false;
      });
  });
})();

// ---- Header logo: oversized at the top of the page, tucks in on scroll ----
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;
  var ticking = false;
  var update = function () {
    header.classList.toggle('scrolled', window.scrollY > 10);
    ticking = false;
  };
  window.addEventListener(
    'scroll',
    function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  update();
})();

// ---- Premium homepage: estimate modal, before/after slider, reveals -------
(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll: staggered by --i, never re-hidden, and a safety net
  // so nothing can stay invisible if the observer misses.
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  function showAll() { reveals.forEach(function (el) { el.classList.add('in'); }); }
  if (!reveals.length || reduce || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', function () {
      setTimeout(function () {
        reveals.forEach(function (el) {
          if (!el.classList.contains('in') && el.getBoundingClientRect().top < window.innerHeight) el.classList.add('in');
        });
      }, 1500);
    });
  }

  // Hero parallax: the room drifts at a quarter of scroll speed (desktop only)
  var heroBg = document.querySelector('.home-hero .bg');
  if (heroBg && !reduce && window.innerWidth > 900) {
    heroBg.classList.add('parallax');
    var ticking = false;
    function drift() {
      var y = window.scrollY || window.pageYOffset;
      var h = heroBg.parentNode.offsetHeight || 1;
      if (y <= h) heroBg.style.setProperty('--py', Math.round(y * 0.25) + 'px');
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(drift); } }, { passive: true });
    drift();
  }
  var modal = document.getElementById('estimate-modal');
  if (modal) {
    var lastFocus = null;
    function openModal(e) {
      if (e) e.preventDefault();
      lastFocus = document.activeElement;
      modal.hidden = false;
      document.body.classList.add('modal-open');
      var first = modal.querySelector('input[name=name]');
      if (first) { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }
    }
    function closeModal() {
      modal.hidden = true;
      document.body.classList.remove('modal-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll('[data-open-estimate]').forEach(function (a) { a.addEventListener('click', openModal); });
    modal.querySelectorAll('[data-close-estimate]').forEach(function (b) { b.addEventListener('click', closeModal); });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  }

  // "Explore all services" expands the full list in place instead of leaving
  var toggle = document.querySelector('[data-services-toggle]');
  var all = document.getElementById('all-services');
  if (toggle && all) {
    toggle.addEventListener('click', function (e) {
      e.preventDefault();
      all.hidden = !all.hidden;
      toggle.textContent = all.hidden ? toggle.dataset.label || toggle.textContent : 'Hide services';
      if (!toggle.dataset.label) toggle.dataset.label = 'Explore All Services →';
    });
  }

  document.querySelectorAll('[data-ba]').forEach(function (ba) {
    var range = ba.querySelector('input[type=range]');
    var before = ba.querySelector('.ba-before');
    var handle = ba.querySelector('.ba-handle');
    var beforeImg = before && before.querySelector('img');
    function size() { if (beforeImg) beforeImg.style.width = ba.clientWidth + 'px'; }
    function set(v) { before.style.width = v + '%'; handle.style.left = v + '%'; }
    if (range) range.addEventListener('input', function () { set(range.value); });
    window.addEventListener('resize', size);
    size();
    set(range ? range.value : 50);
  });

})();

// ---- Service-area map: label-free basemap behind the city card ------------
(function () {
  var el = document.getElementById('service-map');
  var data = window.BT_SERVICE_AREA;
  if (!el || !data) return;
  var LEAFLET = 'https://unpkg.com/leaflet@1.9.4/dist/';
  var started = false;
  function loadLeaflet() {
    if (window.L) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = LEAFLET + 'leaflet.css';
      document.head.appendChild(css);
      var js = document.createElement('script');
      js.src = LEAFLET + 'leaflet.js';
      js.onload = resolve;
      js.onerror = reject;
      document.head.appendChild(js);
    });
  }
  function build() {
    var L = window.L;
    var map = L.map(el, {
      zoomControl: false, scrollWheelZoom: false, doubleClickZoom: false, dragging: false,
      touchZoom: false, boxZoom: false, keyboard: false,
      // Whole-number zooms only: fractional zoom scales the 256px tiles and
      // leaves hairline seams between them.
      zoomSnap: 1,
      attributionControl: false,
    });
    // Esri's tile terms require a credit; keep it, but only the credit.
    L.control.attribution({ prefix: false, position: 'bottomright' }).addAttribution('Tiles &copy; Esri').addTo(map);
    // Esri's light gray base has no labels (labels live in a separate reference layer)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 16,
    }).addTo(map);
    var markers = {};
    var pins = {};
    var bounds = [];
    function add(key, lat, lng, town, html) {
      var pinEl = document.createElement('div');
      pinEl.className = 'bt-pin';
      var m = L.marker([lat, lng], { icon: L.divIcon({ className: '', html: pinEl, iconSize: [18, 18], iconAnchor: [9, 9] }), zIndexOffset: town ? 0 : 100 })
        .addTo(map)
        .bindPopup(html, { offset: [0, -8] });
      markers[key] = m;
      pins[key] = pinEl;
      bounds.push([lat, lng]);
    }
    data.towns.forEach(function (t) {
      add('town:' + t.name, t.lat, t.lng, true, '<div class="bt-pop"><strong>' + t.name + ', ' + t.state + '</strong><span>Tile showers, floors, and backsplashes</span></div>');
    });
    data.cities.forEach(function (c) {
      add(c.slug, c.lat, c.lng, false, '<div class="bt-pop"><strong>' + c.name + ', ' + c.state + '</strong><span>' + c.hoods.join(' · ') + '</span><a href="' + c.url + '">Tile work in ' + c.name + ' →</a></div>');
    });
    // Keep the pins clear of the floating card on wide screens
    function fit(animate) {
      var card = document.querySelector('.area-card');
      var mr = el.getBoundingClientRect();
      var cr = card ? card.getBoundingClientRect() : null;
      // Only pad for the card when it sits beside the map (desktop), not below it
      var cy = cr ? (cr.top + cr.bottom) / 2 : 0;
      var beside = cr && cy > mr.top && cy < mr.bottom && cr.left > mr.left + mr.width * 0.3;
      var right = beside ? mr.right - cr.left + 40 : 40;
      map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [right, beside ? 40 : 90], maxZoom: 11, animate: !!animate });
    }
    fit(false);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { map.invalidateSize(); fit(false); }, 150); });
    var activeKey = null;
    function activate(key) {
      if (activeKey && pins[activeKey]) pins[activeKey].classList.remove('active');
      document.querySelectorAll('.city-btn.active').forEach(function (b) { b.classList.remove('active'); });
      activeKey = key;
      if (!markers[key]) return;
      pins[key].classList.add('active');
      var btn = document.querySelector(key.indexOf('town:') === 0 ? '.city-btn[data-town="' + key.slice(5) + '"]' : '.city-btn[data-city="' + key + '"]');
      if (btn) btn.classList.add('active');
      markers[key].openPopup();
    }
    document.querySelectorAll('.city-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.dataset.city || 'town:' + b.dataset.town;
        activate(key);
      });
    });
    Object.keys(markers).forEach(function (key) { markers[key].on('click', function () { activate(key); }); });
    map.on('popupclose', function () { if (activeKey) { if (pins[activeKey]) pins[activeKey].classList.remove('active'); document.querySelectorAll('.city-btn.active').forEach(function (b) { b.classList.remove('active'); }); activeKey = null; } });
  }
  function start() {
    if (started) return;
    started = true;
    loadLeaflet().then(build).catch(function () {
      el.innerHTML = '';
    });
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
    }, { rootMargin: '400px 0px' });
    io.observe(el);
  } else {
    start();
  }
})();

// ---- Materials page: View more opens the rest of a category ----------------
document.addEventListener('click', function (e) {
  var btn = e.target.closest && e.target.closest('[data-mat-more]');
  if (!btn) return;
  btn.closest('.mat-sec').querySelectorAll('.mat-card[hidden]').forEach(function (el) { el.hidden = false; });
  btn.parentNode.remove();
});

// ---- Design options: One-day shower | Custom tile switch -------------------
(function () {
  var tabs = document.querySelectorAll('[data-design-pane]');
  if (!tabs.length) return;
  function show(name) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.designPane === name)); });
    document.querySelectorAll('.design-pane').forEach(function (p) { p.hidden = p.dataset.pane !== name; });
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { show(t.dataset.designPane); }); });
  // #custom (or a tile category anchor) opens custom; otherwise the path they last chose
  var h = location.hash.slice(1), saved = null;
  try { saved = localStorage.getItem('bb_path'); } catch (e) {}
  if (h === 'custom' || (h && document.querySelector('.design-pane[data-pane="custom"] #' + CSS.escape(h)))) show('custom');
  else if (saved === 'custom') show('custom');
})();
