/* iLab mockup UI behaviour. No framework. Each block maps to one React hook/component when wired. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const lang = document.body.dataset.lang || 'lv';

  /* ---------- Branch opening hours (source of truth also in data.js) ---------- */
  const HOURS = {
    domina: { mon: ['10:00', '21:00'], tue: ['10:00', '21:00'], wed: ['10:00', '21:00'], thu: ['10:00', '21:00'], fri: ['10:00', '21:00'], sat: ['10:00', '21:00'], sun: ['10:00', '21:00'] },
    spice:  { mon: ['10:00', '21:00'], tue: ['10:00', '21:00'], wed: ['10:00', '21:00'], thu: ['10:00', '21:00'], fri: ['10:00', '21:00'], sat: ['10:00', '21:00'], sun: ['10:00', '20:00'] },
  };
  const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  function rigaNow() {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Riga', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value;
    const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[get('weekday')];
    return { day: wd, minutes: parseInt(get('hour'), 10) * 60 + parseInt(get('minute'), 10) };
  }
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  function branchStatus(id) {
    const now = rigaNow();
    const today = HOURS[id][DAYS[now.day]];
    if (now.minutes >= toMin(today[0]) && now.minutes < toMin(today[1])) return { open: true, until: today[1] };
    if (now.minutes < toMin(today[0])) return { open: false, opens: today[0], tomorrow: false };
    const next = HOURS[id][DAYS[(now.day + 1) % 7]];
    return { open: false, opens: next[0], tomorrow: true };
  }
  function renderStatus() {
    $$('[data-status]').forEach((el) => {
      const id = el.dataset.status;
      if (!HOURS[id]) return;
      const s = branchStatus(id);
      el.textContent = s.open ? `${el.dataset.openUntil} ${s.until}` : `${el.dataset.closed} ${s.tomorrow ? el.dataset.tomorrow + ' ' : ''}${s.opens}`;
      $$(`[data-status-dot="${id}"]`).forEach((d) => d.classList.toggle('is-open', s.open));
    });
  }
  renderStatus();
  setInterval(renderStatus, 60000);

  /* ---------- Homepage branch selector and map pins ---------- */
  const locationSwitcher = $('[data-location-switcher]');
  if (locationSwitcher) {
    const chooseLocation = (branch) => {
      if (!['domina', 'spice'].includes(branch)) return;
      $$('[data-location-select]').forEach((control) => {
        const selected = control.dataset.locationSelect === branch;
        control.classList.toggle('is-selected', selected);
        control.setAttribute('aria-pressed', String(selected));
      });
      $$('[data-location-panel]', locationSwitcher).forEach((panel) => {
        panel.hidden = panel.dataset.locationPanel !== branch;
      });
    };
    $$('[data-location-select]').forEach((control) => {
      control.addEventListener('click', () => chooseLocation(control.dataset.locationSelect));
    });
  }

  /* ---------- Header: current page, hide on scroll down ---------- */
  const header = $('[data-header]');
  const page = document.body.dataset.page;
  if (page) $$(`.nav__link[data-page="${page}"]`).forEach((a) => a.setAttribute('aria-current', 'page'));
  // header stays visible at all times (position: sticky); no hide-on-scroll

  /* ---------- Drawers ---------- */
  const scrim = $('.scrim');
  let openDrawer = null;
  let lastFocus = null;
  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function open(name, opts = {}) {
    const el = $(`[data-drawer="${name}"]`);
    if (!el) return;
    if (openDrawer === el) { close(); return; } // same trigger again (e.g. the burger) toggles it closed
    if (openDrawer && openDrawer !== el) close(true);
    lastFocus = lastFocus || document.activeElement;
    openDrawer = el;
    if (name === 'contact' && opts.branch) selectTab(el, opts.branch);
    if (name === 'booking') prefill(el, opts);
    el.classList.add('is-open');
    scrim.classList.add('is-open');
    document.body.classList.add('drawer-open');
    document.body.classList.toggle('menu-open', name === 'menu');
    document.body.style.overflow = 'hidden';
    header && header.classList.remove('is-hidden');
    $$('[data-open="menu"]').forEach((b) => b.setAttribute('aria-expanded', String(name === 'menu')));
    if (window.ILAB_MOTION) window.ILAB_MOTION.drawerOpen(el);
    else el.style.transform = 'none';
    document.dispatchEvent(new CustomEvent('ilab:drawer', { detail: { name, el, trigger: opts.trigger || null } }));
    setTimeout(() => el.focus({ preventScroll: true }), 50);
  }
  function close(silent) {
    if (!openDrawer) return;
    const el = openDrawer;
    openDrawer = null;
    scrim.classList.remove('is-open');
    document.body.classList.remove('drawer-open', 'menu-open');
    document.body.style.overflow = '';
    $$('[data-open="menu"]').forEach((b) => b.setAttribute('aria-expanded', 'false'));
    const done = () => el.classList.remove('is-open');
    if (window.ILAB_MOTION) window.ILAB_MOTION.drawerClose(el, done);
    else { el.style.transform = ''; done(); }
    if (!silent && lastFocus) { lastFocus.focus(); lastFocus = null; }
  }
  function prefill(el, opts) {
    const dev = el.querySelector('[data-prefill="device"]');
    const fault = el.querySelector('[data-prefill="fault"]');
    if (opts.device && dev) dev.value = opts.device;
    if (opts.service && fault && !fault.value) fault.value = opts.service;
    if (opts.branch) { const r = el.querySelector(`input[name="location"][value="${opts.branch}"]`); if (r) r.checked = true; }
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open]');
    if (t) {
      e.preventDefault();
      open(t.dataset.open, { branch: t.dataset.branch, device: t.dataset.device, service: t.dataset.service, trigger: t });
      return;
    }
    if (e.target.closest('[data-close]')) { e.preventDefault(); close(); }
  });
  document.addEventListener('keydown', (e) => {
    if (!openDrawer) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {
      const items = $$(FOCUSABLE, openDrawer).filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.ILAB_UI = { open, close };
  // QA switch: ?open=booking|contact|locator|menu opens that drawer on load
  const qaOpen = new URLSearchParams(location.search).get('open');
  if (qaOpen) setTimeout(() => open(qaOpen), 300);

  /* ---------- Tabs ---------- */
  function selectTab(root, key) {
    $$('[data-tab]', root).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === key)));
    $$('[data-panel]', root).forEach((p) => p.classList.toggle('is-active', p.dataset.panel === key));
    root.dispatchEvent(new CustomEvent('tabchange', { detail: key }));
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    selectTab(b.closest('[data-tabs]'), b.dataset.tab);
    const url = b.dataset.tabUrl;
    if (url !== undefined) history.replaceState(null, '', `?brand=${b.dataset.tab}`);
  });
  $$('[data-tabs][data-tabs-from-query]').forEach((root) => {
    const q = new URLSearchParams(location.search).get('brand');
    if (q && root.querySelector(`[data-tab="${q}"]`)) selectTab(root, q);
  });

  /* ---------- Mobile menu sub-lists ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-toggle]');
    if (!b) return;
    const li = b.parentElement;
    const on = li.classList.toggle('is-open');
    b.setAttribute('aria-expanded', String(on));
  });

  /* ---------- Model finder (client-side filter) ---------- */
  $$('[data-finder]').forEach((wrap) => {
    const input = wrap.querySelector('input');
    const clear = wrap.querySelector('[data-finder-clear]');
    const scope = $(wrap.dataset.finder) || wrap.parentElement;
    const norm = (s) => s.toLowerCase().replace(/\s+/g, ' ').trim();
    function run() {
      const q = norm(input.value);
      wrap.classList.toggle('has-value', q.length > 0);
      let any = false;
      $$('[data-finder-group]', scope).forEach((g) => {
        let shown = 0;
        $$('[data-finder-item]', g).forEach((it) => {
          const hit = !q || norm(it.textContent).includes(q);
          it.hidden = !hit;
          if (hit) shown++;
        });
        g.hidden = shown === 0;
        if (q && shown) g.open = true;
        if (shown) any = true;
      });
      scope.classList.toggle('is-empty', !any);
    }
    input.addEventListener('input', run);
    clear && clear.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
  });

  /* ---------- Price tables fed by window.ILAB_DATA (stands in for Firestore modelServices) ---------- */
  const D = window.ILAB_DATA || {};
  const T = lang === 'ru'
    ? { service: 'Услуга', time: 'Срок', price: 'Цена', book: 'Записаться', loading: 'Загружаем цены…', error: 'Не удалось загрузить цены. Позвоните или напишите - уточним.', none: 'Цены для этой модели уточняйте по телефону.' }
    : { service: 'Pakalpojums', time: 'Laiks', price: 'Cena', book: 'Pieraksties', loading: 'Ielādē cenas…', error: 'Neizdevās ielādēt cenas. Zvani vai raksti - precizēsim.', none: 'Šim modelim cenu precizēsim pēc diagnostikas.' };
  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  const fmtPrice = (p) => String(p).replace(/^(no\s+)?€\s*(\d+)/, (_, no, n) => `${no || ''}${n} €`);
  function tableHTML(rows, modelName) {
    if (!rows || !rows.length) return `<p class="spec-state">${T.none}</p>`;
    const hasTime = rows.some((r) => r.time);
    const body = rows.map((r) => {
      const name = (D.services && D.services[r.service] && D.services[r.service].name) || r.service;
      return `<tr><td class="is-name">${esc(name)}</td>${hasTime ? `<td class="is-time">${esc(r.time || '')}</td>` : ''}<td class="is-num"><span class="price">${esc(fmtPrice(r.price))}</span></td><td class="is-book"><button class="btn-text is-strong" type="button" data-open="booking" data-device="${esc(modelName || '')}" data-service="${esc(name)}">${T.book}</button></td></tr>`;
    }).join('');
    return `<table class="spec"><thead><tr><th>${T.service}</th>${hasTime ? `<th>${T.time}</th>` : ''}<th class="is-num">${T.price}</th><th></th></tr></thead><tbody data-rows>${body}</tbody></table>`;
  }
  function renderTable(el, modelId, modelName) {
    el.setAttribute('aria-live', 'polite'); el.setAttribute('aria-busy', 'true');
    el.innerHTML = `<p class="spec-state">${T.loading}</p>`;
    const fail = new URLSearchParams(location.search).get('prices') === 'fail';
    const filter = (el.closest('[data-price-filter]') || {}).dataset?.priceFilter; // comma-separated serviceIds (service pages)
    setTimeout(() => {
      if (fail) { el.innerHTML = `<p class="spec-state is-error">${T.error}</p>`; el.setAttribute('aria-busy', 'false'); return; }
      let rows = (D.prices && D.prices[modelId]) || [];
      if (filter) { const keep = filter.split(','); rows = rows.filter((r) => keep.includes(r.service)); }
      el.innerHTML = tableHTML(rows, modelName);
      el.setAttribute('aria-busy', 'false');
      if (window.ILAB_MOTION) window.ILAB_MOTION.revealRows(el);
    }, 450);
  }
  $$('[data-price-table]').forEach((el) => renderTable(el, el.dataset.priceTable, el.dataset.modelName));

  /* Price browser: brand tabs -> series accordions -> model buttons -> table (cenas page, service pages) */
  $$('[data-price-browser]').forEach((root) => {
    const brands = D.brands || {};
    const tabs = root.querySelector('[data-browser-tabs]');
    const list = root.querySelector('[data-browser-list]');
    const out = root.querySelector('[data-browser-table]');
    const title = root.querySelector('[data-browser-title]');
    const only = root.dataset.priceBrowser; // optional single brand key
    const keys = only ? [only] : Object.keys(brands);
    if (!keys.length || !list || !out) return;
    function showBrand(key) {
      const b = brands[key];
      if (!b) return;
      $$('[data-tab]', tabs || root).forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === key)));
      list.innerHTML = b.series.map((s, i) => `<details class="acc" ${i === 0 ? 'open' : ''}><summary>${esc(s.name)}<span class="count">${s.models.length}</span><i class="plus"></i></summary><div class="acc__body"><ul class="models">${s.models.map((m) => `<li><button class="btn-text" type="button" data-model="${esc(m.id)}" data-model-name="${esc(m.name)}">${esc(m.name)}${m.year ? `<span class="is-year">${m.year}</span>` : ''}</button></li>`).join('')}</ul></div></details>`).join('');
      const first = b.series[0] && b.series[0].models[0];
      if (first) showModel(first.id, first.name);
    }
    function showModel(id, name) {
      $$('[data-model]', list).forEach((m) => m.classList.toggle('is-strong', m.dataset.model === id));
      if (title) title.textContent = name;
      renderTable(out, id, name);
    }
    if (tabs) tabs.innerHTML = keys.map((k, i) => `<button class="tab" role="tab" type="button" data-tab="${esc(k)}" aria-selected="${i === 0}">${esc(brands[k].label)}</button>`).join('');
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab]');
      if (t) { e.stopPropagation(); showBrand(t.dataset.tab); history.replaceState(null, '', `?brand=${t.dataset.tab}`); return; }
      const m = e.target.closest('[data-model]');
      if (m) showModel(m.dataset.model, m.dataset.modelName);
    }, true);
    const q = new URLSearchParams(location.search).get('brand');
    showBrand(q && brands[q] ? q : keys[0]);
  });

  /* ---------- Booking form ---------- */
  $$('[data-booking]').forEach((form) => {
    const date = form.querySelector('[data-min-tomorrow]');
    if (date) {
      const d = new Date(); d.setDate(d.getDate() + 1);
      const iso = d.toISOString().slice(0, 10);
      date.min = iso; if (!date.value) date.value = iso;
    }
    const submit = form.querySelector('[type="submit"]');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let ok = true;
      $$('.field', form).forEach((f) => {
        const input = f.querySelector('input, textarea');
        if (!input || !input.required) return;
        let valid = input.value.trim().length > 0;
        if (valid && input.type === 'tel') valid = /^\+?\d[\d\s]{7,}$/.test(input.value.trim());
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) { form.querySelector('.is-invalid input, .is-invalid textarea')?.focus(); return; }
      if (form.querySelector('[name="website"]').value) return; // honeypot
      form.classList.remove('is-error');
      submit.disabled = true; submit.textContent = submit.dataset.sending;
      // wiring: replace the timeout with fetch(form.action, { method: 'POST', body: new FormData(form) })
      const fail = new URLSearchParams(location.search).get('booking') === 'fail';
      setTimeout(() => {
        submit.disabled = false; submit.textContent = submit.dataset.label;
        if (fail) { form.classList.add('is-error'); return; }
        form.classList.add('is-success');
        form.querySelector('.form__success').scrollIntoView({ block: 'nearest' });
      }, 900);
    });
    $$('input, textarea', form).forEach((i) => i.addEventListener('input', () => i.closest('.field')?.classList.remove('is-invalid')));
  });

  /* ---------- Cookie consent (gates GTM/GA4 and the OpenAI pixel) ---------- */
  const banner = $('[data-cookie]');
  const consent = document.cookie.match(/(?:^|; )ilab_cookie_consent=(accepted|rejected)/);
  function loadAnalytics() {
    // wiring: inject GTM-K8C3GNKB here (which loads GA4 G-4524HG60TX) and the OpenAI pixel; nothing loads before consent.
    console.info('[ilab] analytics would load now (consent accepted)');
  }
  if (consent) { if (consent[1] === 'accepted') loadAnalytics(); }
  else if (banner) banner.classList.add('is-visible');
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-consent]');
    if (!b) return;
    const v = b.dataset.consent;
    document.cookie = `ilab_cookie_consent=${v}; Max-Age=31536000; Path=/; SameSite=Lax`;
    window.dispatchEvent(new CustomEvent('ilab-cookie-consent-change', { detail: v }));
    banner.classList.remove('is-visible');
    if (v === 'accepted') loadAnalytics();
  });


  /* ---------- Static Google reviews from data (wiring: same data object in the Next.js app) ---------- */
  $$('[data-reviews]').forEach((el) => {
    const list = ((D.reviews || {})[lang] || (D.reviews || {}).lv || []).filter((r) => r.branch === el.dataset.reviews).slice(0, 4);
    const more = lang === 'ru' ? 'Больше' : 'Vairāk', less = lang === 'ru' ? 'Свернуть' : 'Mazāk';
    const google = lang === 'ru' ? 'Google · 5 из 5' : 'Google · 5 no 5';
    const star = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z"/></svg>';
    const clean = (t) => t.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{1F3FB}-\u{1F3FF}]/gu, '').replace(/\s+…/g, '…').trim();
    el.innerHTML = list.map((r) => { const text = clean(r.text); return `<article class="review"><p class="review__text">“${esc(text)}”</p><div class="review__meta"><b>${esc(r.author)}</b><span class="stars" role="img" aria-label="${google}">${star.repeat(5)}</span>${r.ago ? `<span class="tech">${esc(r.ago)}</span>` : ''}${text.length > 220 ? `<button class="btn-text" type="button" data-expand data-more="${more}" data-less="${less}">${more}</button>` : ''}</div></article>`; }).join('');
  });

  /* ---------- Reviews expand ---------- */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-expand]');
    if (!b) return;
    const r = b.closest('.review');
    r.classList.toggle('is-expanded');
    b.textContent = r.classList.contains('is-expanded') ? b.dataset.less : b.dataset.more;
  });
})();
