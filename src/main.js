// Lead form → Buddy Built CRM (division: Buddy Tile). Zero dependencies.
(function () {
  // Local previews talk to the dev platform; the live site talks to production.
  var API_BASE =
    window.BT_API_BASE ||
    (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
      ? 'http://localhost:5001'
      : 'https://buddybuilt.com');
  var TILE_DIVISION_ID = 1;

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');
      var btn = form.querySelector('button[type=submit]');
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
          status.textContent = (err && err.message) || 'Something went wrong — call us instead!';
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
    window.__ballparkSummary = parts.join(', ') + ' → ' + rangeText;
  }

  form.addEventListener('input', compute);
  form.addEventListener('change', compute);
  compute();
})();
