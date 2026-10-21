/* iLab shop behaviour (mockup). Data from shop-data.js stands in for the catalog API and Firestore; cart, user and orders live in localStorage.
   Wiring: cart → same localStorage model + server re-pricing; auth → Firebase; inquiries → POST /shop/api/inquiries; checkout → orders API. */
(function () {
  'use strict';
  const D = window.ILAB_SHOP; if (!D) return;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ROOT = document.body.dataset.root || '';
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = (n) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n);
  const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();
  const byId = new Map(D.products.map((p) => [p.id, p]));
  const bySlug = new Map(D.products.map((p) => [p.slug, p]));
  const brandById = new Map(D.brands.map((b) => [b.id, b]));
  const catById = new Map(D.categories.map((c) => [c.id, c]));
  const modelIndex = []; D.brands.forEach((b) => b.series.forEach((s) => s.models.forEach((m) => modelIndex.push({ ...m, brand: b.name, brandId: b.id, series: s.name }))));
  const modelById = new Map(modelIndex.map((m) => [m.id, m]));
  const store = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} } };
  const STATUS = { in_stock: 'In stock', out_of_stock: 'Out of stock', price_unavailable: 'Price unavailable' };
  const SERVICE_PAGE = { iphone: 'iphone-remonts.html', ipad: 'iphone-remonts.html', macbook: 'iphone-remonts.html', apple_watch: 'iphone-remonts.html', samsung: 'telefonu-remonts-samsung.html', xiaomi: 'telefonu-remonts-samsung.html', huawei: 'telefonu-remonts-samsung.html' };
  const STAGE = { iphone: 'finder_stage_iphone.webp', ipad: 'device_selector_ipad.webp', macbook: 'device_selector_macbook.webp', apple_watch: 'device_selector_iwatch.webp', samsung: 'device_selector_samsung.webp', xiaomi: 'device_selector_xiaomi.webp', huawei: 'device_selector_huawei.webp' };
  const productUrl = (p) => `${ROOT}shop/product.html?slug=${encodeURIComponent(p.slug)}`;
  const modelUrl = (m) => `${ROOT}shop/iphone-14.html${m.id === 'iphone_14' ? '' : '?model=' + encodeURIComponent(m.id)}`;
  function imgHTML(p, cls = '') {
    const src = p.img ? ROOT + p.img : p.imgRemote;
    if (!src) return `<div class="photo photo--placeholder ${cls}">No image</div>`;
    return `<div class="photo ${cls}"><img src="${esc(src)}" alt="${esc(p.name)}" loading="lazy" width="600" height="600" onerror="this.parentElement.className='photo photo--placeholder';this.parentElement.textContent='No image'"></div>`;
  }
  const priceLabel = (p) => (p.price == null ? 'Unavailable' : money(p.price));

  /* ---------------- Cart ---------------- */
  const CART_KEY = 'ilab_shop_cart';
  let cart = store.get(CART_KEY, []);
  const saveCart = () => { store.set(CART_KEY, cart); renderCount(); };
  const lineIssue = (p, qty) => (!p ? 'Product no longer available' : p.price == null ? 'Price unavailable' : p.stock <= 0 ? 'Out of stock' : qty > p.stock ? `Only ${p.stock} available` : '');
  const cartValid = () => cart.length > 0 && cart.every((l) => !lineIssue(byId.get(l.id), l.qty));
  const cartTotal = () => cart.reduce((s, l) => { const p = byId.get(l.id); return p && p.price != null ? s + p.price * l.qty : s; }, 0);
  function renderCount() { const n = cart.reduce((s, l) => s + l.qty, 0); $$('[data-cart-count]').forEach((el) => (el.textContent = n ? ` · ${n}` : '')); }
  function addToCart(id, qty = 1) {
    const p = byId.get(id); if (!p || p.price == null || p.stock <= 0) return;
    const line = cart.find((l) => l.id === id);
    if (line) line.qty = Math.min(99, p.stock, line.qty + qty); else cart.push({ id, qty: Math.min(99, p.stock, qty) });
    saveCart(); window.ILAB_UI && window.ILAB_UI.open('cart');
  }
  function renderCart() {
    const lines = $('[data-cart-lines]'); if (!lines) return;
    const status = $('[data-cart-status]'); status && (status.textContent = 'Refreshing cart…');
    setTimeout(() => {
      status && (status.textContent = cart.length ? `${cart.length} ${cart.length === 1 ? 'line' : 'lines'} · prices re-checked` : '');
      $('[data-cart-empty]').hidden = cart.length > 0; $('[data-cart-foot]').hidden = cart.length === 0;
      lines.innerHTML = cart.map((l) => { const p = byId.get(l.id); const issue = lineIssue(p, l.qty); const total = p && p.price != null ? money(p.price * l.qty) : '—';
        return `<div class="cart-line" data-line="${esc(l.id)}">${p ? imgHTML(p) : '<div class="photo photo--placeholder">No image</div>'}<div><a class="cart-line__name link--quiet" href="${p ? productUrl(p) : '#'}">${esc(p ? p.name : l.id)}</a><p class="tech">SKU ${esc(p ? p.sku : '')}<span class="sep">·</span>${p ? priceLabel(p) : ''}</p></div>
        <div class="cart-line__row"><span class="qty"><button type="button" data-qty-dec aria-label="Decrease quantity">−</button><input type="number" min="1" max="${p ? Math.min(99, p.stock) : 1}" value="${l.qty}" aria-label="Quantity" data-qty-input><button type="button" data-qty-inc aria-label="Increase quantity">+</button></span><button class="btn-text" type="button" data-remove>Remove</button><span class="num">${total}</span></div>${issue ? `<p class="cart-line__note">${esc(issue)}</p>` : ''}</div>`; }).join('');
      $('[data-cart-total]').textContent = money(cartTotal());
      const co = $('[data-cart-checkout]'); co.classList.toggle('is-disabled', !cartValid()); co.setAttribute('aria-disabled', String(!cartValid())); co.textContent = cartValid() ? 'Proceed to checkout' : 'Fix unavailable items';
    }, 350);
  }
  document.addEventListener('click', (e) => {
    const add = e.target.closest('[data-add-to-cart]');
    if (add && !add.disabled) { const q = add.closest('.buy, .pcard')?.querySelector('[data-qty]'); addToCart(add.dataset.addToCart, q ? parseInt(q.value, 10) || 1 : 1); return; }
    const line = e.target.closest('[data-line]'); if (!line) return;
    const l = cart.find((x) => x.id === line.dataset.line); const p = byId.get(l.id);
    if (e.target.closest('[data-remove]')) cart = cart.filter((x) => x !== l);
    else if (e.target.closest('[data-qty-inc]')) l.qty = Math.min(99, p ? p.stock : 99, l.qty + 1);
    else if (e.target.closest('[data-qty-dec]')) l.qty = Math.max(1, l.qty - 1);
    else return;
    saveCart(); renderCart();
  });
  document.addEventListener('change', (e) => { const i = e.target.closest('[data-line] [data-qty-input]'); if (!i) return; const l = cart.find((x) => x.id === i.closest('[data-line]').dataset.line); l.qty = Math.max(1, Math.min(99, parseInt(i.value, 10) || 1)); saveCart(); renderCart(); });
  document.addEventListener('click', (e) => { const co = e.target.closest('[data-cart-checkout]'); if (co && co.getAttribute('aria-disabled') === 'true') e.preventDefault(); }, true);
  renderCount();

  /* ---------------- Mock account ---------------- */
  const USER_KEY = 'ilab_shop_user';
  const user = () => store.get(USER_KEY, null);
  function renderAccountBtn() { const u = user(); $$('[data-account-btn]').forEach((b) => { b.textContent = u ? 'My account' : 'Login'; if (u) { b.setAttribute('data-href', ROOT + 'shop/account.html'); b.removeAttribute('data-open'); } else { b.setAttribute('data-open', 'login'); } }); }
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-account-btn][data-href]'); if (b) location.href = b.dataset.href; });
  renderAccountBtn();
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  function formOk(form, extra) {
    let ok = true;
    $$('.field', form).forEach((f) => { const i = f.querySelector('input, textarea'); if (!i || i.closest('[hidden]')) return; let v = true;
      if (i.required && !i.value.trim()) v = false; if (v && i.type === 'email' && i.value && !validEmail(i.value)) v = false; if (v && i.minLength > 0 && i.value && i.value.length < i.minLength) v = false;
      if (v && extra) v = extra(i, f); f.classList.toggle('is-invalid', !v); if (!v) ok = false; });
    if (!ok) form.querySelector('.is-invalid input, .is-invalid textarea')?.focus();
    return ok;
  }
  function sending(form, on) { const b = form.querySelector('[type="submit"]'); if (!b) return; b.disabled = on; b.textContent = on ? b.dataset.sending : b.dataset.label; }
  const loginForm = $('form[data-login]');
  loginForm && loginForm.addEventListener('submit', (e) => { e.preventDefault(); if (!formOk(loginForm)) return; sending(loginForm, true); loginForm.classList.remove('is-error');
    setTimeout(() => { sending(loginForm, false); const email = loginForm.email.value.trim();
      if (loginForm.password.value === 'wrong') { loginForm.classList.add('is-error'); return; }
      store.set(USER_KEY, { name: email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), email, phone: '', wholesale: 'none' });
      renderAccountBtn(); window.ILAB_UI.close(); afterLogin(); }, 700); });
  $('[data-forgot]')?.addEventListener('click', () => { const s = loginForm.querySelector('.form__status'); s.textContent = 'We will add password reset in the wired version; contact info@ilab.lv meanwhile.'; loginForm.classList.add('is-error'); });
  const regForm = $('form[data-register]');
  if (regForm) {
    const wholesale = $('[data-wholesale]', regForm), company = $('[data-company]', regForm), cf = $('[data-company-fields]', regForm);
    const syncCompany = () => { cf.hidden = !(company.value.trim() || wholesale.checked); $('#rg-reg').required = wholesale.checked; company.required = wholesale.checked; };
    wholesale.addEventListener('change', syncCompany); company.addEventListener('input', syncCompany);
    regForm.addEventListener('submit', (e) => { e.preventDefault(); if (!formOk(regForm, (i) => (i.name === 'confirmPassword' ? i.value === regForm.password.value : true))) return; sending(regForm, true);
      setTimeout(() => { sending(regForm, false);
        if (wholesale.checked) { $('[data-register-title]').textContent = 'Wholesale account requested'; $('[data-register-text]').textContent = 'Your wholesale account is awaiting approval. You can sign in after it has been approved.'; regForm.classList.add('is-success'); return; }
        store.set(USER_KEY, { name: regForm.name.value.trim(), email: regForm.email.value.trim(), phone: regForm.phone.value.trim(), company: company.value.trim(), wholesale: 'none' });
        regForm.classList.add('is-success'); renderAccountBtn(); setTimeout(() => { window.ILAB_UI.close(); afterLogin(); }, 900); }, 800); });
  }
  let afterLoginCb = null; function afterLogin() { if (afterLoginCb) { const f = afterLoginCb; afterLoginCb = null; f(); } }
  $$('[data-logout]').forEach((b) => b.addEventListener('click', () => { localStorage.removeItem(USER_KEY); location.href = ROOT + 'shop/index.html'; }));

  /* ---------------- Inquiry ---------------- */
  const iq = $('form[data-inquiry]');
  document.addEventListener('ilab:drawer', (e) => {
    const { name, trigger } = e.detail; if (name === 'cart') renderCart(); if (name === 'login') $$('[data-tab="login"]').forEach((t) => t.click());
    if (name !== 'inquiry' || !iq) return;
    const src = trigger?.dataset.source || 'brand'; const p = trigger?.dataset.product ? byId.get(trigger.dataset.product) : null;
    const ctx = $('[data-inquiry-context]'); const rows = [];
    if (p) rows.push(['Product', p.name], ['SKU', String(p.sku)], ['Compatible models', p.models.join(', ')]);
    if (trigger?.dataset.model) rows.push(['Device', trigger.dataset.model]); if (trigger?.dataset.brand) rows.push(['Brand', trigger.dataset.brand]);
    ctx.innerHTML = rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join(''); ctx.hidden = !rows.length;
    $('[data-inquiry-field="model"]').hidden = src === 'product' || src === 'model'; $('[data-inquiry-field="part"]').hidden = src === 'product';
    $('#iq-model').required = !(src === 'product' || src === 'model'); $('#iq-part').required = src !== 'product';
    $('[data-inquiry-title]').textContent = src === 'product' ? 'Request availability' : 'Part inquiry';
    $('[data-inquiry-intro]').textContent = src === 'product' ? 'We’ll check availability for this product and contact you.' : 'Tell us which device and part you’re looking for and we’ll check availability.';
    if (src === 'search') $('#iq-model').value = $('#shop-search')?.value || '';
    const u = user(); if (u) { $('#iq-name').value ||= u.name; $('#iq-email').value ||= u.email; $('#iq-phone').value ||= u.phone || ''; }
    iq.classList.remove('is-success', 'is-error'); iq.dataset.source = src; iq.dataset.productId = p ? p.id : '';
    const btn = iq.querySelector('[type="submit"]'); btn.dataset.label = src === 'product' ? 'Send request' : 'Send inquiry'; btn.textContent = btn.dataset.label;
  });
  iq && iq.addEventListener('submit', (e) => { e.preventDefault(); if (iq.website.value) return;
    if (!formOk(iq, (i) => (i.name === 'phone' && !iq.email.value.trim() && !iq.phone.value.trim() ? false : true))) return;
    sending(iq, true); setTimeout(() => { sending(iq, false); const product = iq.dataset.source === 'product';
      $('[data-inquiry-success-title]').textContent = product ? 'Request sent' : 'Inquiry sent';
      $('[data-inquiry-success-text]').textContent = product ? 'We’ll check availability for this product and contact you using the details you provided.' : 'Thanks — we’ll check availability and contact you using the details you provided.';
      iq.classList.add('is-success'); }, 700); });

  /* ---------------- Search panel ---------------- */
  const sp = $('[data-search]');
  if (sp) {
    const input = sp.querySelector('input'); const results = $('[data-search-results]'), count = $('[data-search-count]'), more = $('[data-search-more]'), modelsEl = $('[data-search-models]'), inq = $('[data-search-inquiry]');
    let hits = [], shownS = 0; const PAGE_S = 30;
    const draw = (append) => { const next = hits.slice(shownS, shownS + PAGE_S); shownS += next.length;
      const html = next.map((p) => `<div class="srow">${imgHTML(p)}<div><p class="tech">${esc(p.type)}<span class="sep">·</span>SKU ${esc(p.sku)}</p><p class="srow__name"><a href="${productUrl(p)}">${esc(p.name)}</a></p><p class="srow__meta">${esc(p.models.slice(0, 3).join(', '))}${p.models.length > 3 ? ` +${p.models.length - 3} more` : ''}</p></div><div class="srow__right"><span class="price">${priceLabel(p)}</span><span class="tech">${esc(STATUS[p.status] || '')}</span>${p.price != null && p.stock > 0 ? `<button class="btn btn-primary btn--sm" type="button" data-add-to-cart="${esc(p.id)}">Add to cart</button>` : `<button class="btn-text" type="button" data-open="inquiry" data-source="product" data-product="${esc(p.id)}">Request availability</button>`}</div></div>`).join('');
      if (append) results.insertAdjacentHTML('beforeend', html); else results.innerHTML = html; more.hidden = shownS >= hits.length; };
    const run = () => { const q = norm(input.value); sp.classList.toggle('has-value', !!q); shownS = 0;
      if (!q) { hits = []; results.innerHTML = ''; count.textContent = 'Search by product name, SKU or device model.'; modelsEl.innerHTML = '<p class="muted small">Type a model name, e.g. iPhone 13 Pro.</p>'; more.hidden = true; inq.hidden = true; return; }
      const models = modelIndex.filter((m) => norm(m.name + ' ' + m.series + ' ' + m.brand).includes(q)).slice(0, 8);
      modelsEl.innerHTML = models.length ? models.map((m) => `<a href="${modelUrl(m)}"><b>${esc(m.name)}</b><br><span class="tech">${esc(m.series)}<span class="sep">·</span>${esc(m.brand)}</span></a>`).join('') : '<p class="muted small">No matching models.</p>';
      const terms = q.split(' ');
      hits = D.products.filter((p) => { const hay = norm(`${p.name} ${p.sku} ${p.models.join(' ')} ${p.type}`); return terms.every((t) => hay.includes(t)); });
      count.textContent = `${hits.length} ${hits.length === 1 ? 'result' : 'results'}`; draw(false);
      inq.hidden = hits.length > 0; if (!hits.length) results.innerHTML = '<p class="state-text">No matching parts found. Can’t find the part you need? Send us the model and part you’re looking for.</p>'; };
    input.addEventListener('input', run); $('[data-search-clear]')?.addEventListener('click', () => { input.value = ''; run(); input.focus(); });
    more.addEventListener('click', () => draw(true));
    document.addEventListener('ilab:drawer', (e) => { if (e.detail.name === 'search') setTimeout(() => input.focus(), 450); });
  }

  /* ---------------- Product card ---------------- */
  function cardHTML(p, { typeButton = false } = {}) {
    const pill = typeButton ? `<button class="tech pcard__type" type="button" data-type-pill="${esc(p.typeId)}">${esc(p.type)}</button>` : `<span class="tech pcard__type">${esc(p.type)}</span>`;
    let actions = '';
    if (p.price != null && p.stock > 0) actions = `<button class="btn btn-primary" type="button" data-add-to-cart="${esc(p.id)}">Add to cart</button>`;
    else if (p.price != null) actions = `<span class="small faint">Out of stock</span><button class="btn btn-secondary" type="button" data-open="inquiry" data-source="product" data-product="${esc(p.id)}">Request availability</button>`;
    else actions = `<button class="btn btn-primary" type="button" disabled title="Price unavailable">Add to cart</button><button class="btn-text" type="button" data-open="inquiry" data-source="product" data-product="${esc(p.id)}">Request availability</button>`;
    return `<article class="pcard">${imgHTML(p)}${pill}<h3 class="pcard__name"><a href="${productUrl(p)}">${esc(p.name)}</a></h3><p class="tech">SKU ${esc(p.sku)}</p><p class="pcard__price"><span class="faint">Retail</span><span class="price">${priceLabel(p)}</span></p><div class="pcard__actions">${actions}</div><details><summary>Compatible with (${p.models.length})</summary><ul>${p.models.map((m) => `<li>${esc(m)}</li>`).join('') || '<li>No compatible models listed.</li>'}</ul></details></article>`;
  }
  function revealRows(el) { if (window.ILAB_MOTION && window.ILAB_MOTION.revealRows && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.setAttribute('data-rows', ''); window.ILAB_MOTION.revealRows(el); } }

  /* ---------------- Finder + catalog (home) ---------------- */
  const finder = $('[data-finder-shop]'); const catalog = $('[data-catalog]');
  const state = { brand: catalog?.dataset.brand || 'iphone', model: '', type: '' };
  function filtered() { return D.products.filter((p) => (!state.brand || p.brandId === state.brand) && (!state.model || p.modelIds.includes(state.model)) && (!state.type || p.typeId === state.type)); }
  let shown = 0; const PAGE = 48;
  function renderCatalog(reset = true) {
    if (!catalog) return; const list = filtered(); const grid = $('[data-catalog-grid]', catalog);
    const brand = brandById.get(state.brand), model = modelById.get(state.model), cat = catById.get(state.type);
    $('[data-catalog-title]', catalog).textContent = model ? `${model.name} parts` : cat ? cat.name : brand ? `${brand.name} parts` : 'Products';
    if (reset) { shown = 0; grid.innerHTML = ''; }
    const next = list.slice(shown, shown + PAGE); shown += next.length;
    const tmp = document.createElement('div'); tmp.innerHTML = next.map((p) => cardHTML(p, { typeButton: true })).join(''); Array.from(tmp.children).forEach((c) => grid.appendChild(c));
    $('[data-catalog-count]', catalog).textContent = list.length ? `${Math.min(shown, list.length)} of ${list.length} compatible products loaded` : '';
    $('[data-catalog-empty]', catalog).hidden = list.length > 0; $('[data-catalog-more]', catalog).hidden = shown >= list.length; $('[data-catalog-end]', catalog).hidden = !(list.length && shown >= list.length);
    if (next.length) revealRows(grid);
  }
  $('[data-catalog-more]')?.addEventListener('click', (e) => { e.target.textContent = 'Loading…'; setTimeout(() => { e.target.textContent = 'Load more'; renderCatalog(false); }, 400); });
  document.addEventListener('click', (e) => { const pill = e.target.closest('[data-type-pill]'); if (!pill) return; state.type = pill.dataset.typePill; syncFinder(); renderCatalog(); pushUrl(); $('[data-type-tiles]')?.scrollIntoView({ block: 'nearest' }); });
  function pushUrl() { if (!finder) return; const u = new URL(location.href); ['device', 'model', 'type'].forEach((k) => u.searchParams.delete(k)); if (state.brand) u.searchParams.set('device', state.brand); if (state.model) u.searchParams.set('model', state.model); if (state.type) u.searchParams.set('type', state.type); history.pushState(state, '', u); }
  function combo(root, items, onPick, placeholder) {
    const input = root.querySelector('input'), list = root.querySelector('.combo__list'); let opts = [], active = -1;
    const close = () => { root.classList.remove('is-open'); input.setAttribute('aria-expanded', 'false'); };
    const openList = (q = '') => { const nq = norm(q); opts = items().filter((o) => !nq || norm(o.label + ' ' + (o.sub || '')).includes(nq));
      list.innerHTML = opts.length ? opts.map((o, i) => `<li class="combo__opt" role="option" aria-selected="${i === active}" data-i="${i}"><span>${esc(o.label)}</span>${o.sub ? `<span class="tech">${esc(o.sub)}</span>` : ''}</li>`).join('') : '<li class="combo__empty">No matching options.</li>';
      root.classList.add('is-open'); input.setAttribute('aria-expanded', 'true'); };
    input.addEventListener('focus', () => { input.select(); openList(''); }); input.addEventListener('input', () => { active = -1; openList(input.value); });
    input.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!root.classList.contains('is-open')) openList(input.value); active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % Math.max(1, opts.length); openList(input.value); list.children[active]?.scrollIntoView({ block: 'nearest' }); }
      else if (e.key === 'Enter') { e.preventDefault(); const o = opts[active >= 0 ? active : 0]; if (o) { input.value = o.label; close(); onPick(o); } }
      else if (e.key === 'Escape') { close(); } });
    list.addEventListener('mousedown', (e) => { const li = e.target.closest('[data-i]'); if (!li) return; e.preventDefault(); const o = opts[+li.dataset.i]; input.value = o.label; close(); onPick(o); });
    input.addEventListener('blur', () => setTimeout(close, 120));
    return { set: (label) => (input.value = label || ''), placeholder: (t) => (input.placeholder = t) };
  }
  let deviceCombo, modelCombo;
  function renderTiles() {
    const tiles = $('[data-type-tiles]'); if (!tiles) return;
    const base = D.products.filter((p) => (!state.brand || p.brandId === state.brand) && (!state.model || p.modelIds.includes(state.model)));
    tiles.innerHTML = D.categories.map((c) => { const n = base.filter((p) => p.typeId === c.id).length; const sel = state.type === c.id;
      return `<button class="tile" type="button" data-type="${esc(c.id)}" aria-pressed="${sel}" ${n ? '' : 'disabled'}><div class="photo"><img src="${ROOT}${esc(c.thumb)}" alt="" loading="lazy" width="300" height="300"></div><b>${esc(c.name)}</b><span class="tile__state">${sel ? 'Selected' : n ? `View parts · ${n}` : 'Unavailable'}</span></button>`; }).join('');
    $('[data-clear-type]').hidden = !state.type;
  }
  function syncFinder() { if (!finder) return; renderTiles(); const st = $('[data-finder-stage]'); if (st) st.src = `${ROOT}assets/img/shop/${STAGE[state.brand] || STAGE.iphone}`; deviceCombo?.set(brandById.get(state.brand)?.name || ''); modelCombo?.set(modelById.get(state.model)?.name || ''); }
  if (finder) {
    deviceCombo = combo($('[data-combo="device"]'), () => D.brands.map((b) => ({ label: b.name, id: b.id, sub: `${b.modelCount} models` })), (o) => { state.brand = o.id; state.model = ''; state.type = ''; syncFinder(); renderCatalog(); pushUrl(); });
    modelCombo = combo($('[data-combo="model"]'), () => [{ label: 'All models', id: '' }].concat(modelIndex.filter((m) => m.brandId === state.brand).map((m) => ({ label: m.name, id: m.id, sub: m.series }))), (o) => { state.model = o.id; state.type = ''; syncFinder(); renderCatalog(); pushUrl(); $('[data-type-tiles]').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
    $('[data-type-tiles]').addEventListener('click', (e) => { const t = e.target.closest('[data-type]'); if (!t || t.disabled) return; state.type = state.type === t.dataset.type ? '' : t.dataset.type; syncFinder(); renderCatalog(); pushUrl(); });
    $('[data-clear-type]').addEventListener('click', () => { state.type = ''; syncFinder(); renderCatalog(); pushUrl(); });
    const readUrl = () => { const u = new URL(location.href); if (u.searchParams.get('device') && brandById.has(u.searchParams.get('device'))) state.brand = u.searchParams.get('device'); state.model = modelById.has(u.searchParams.get('model')) ? u.searchParams.get('model') : ''; state.type = catById.has(u.searchParams.get('type')) ? u.searchParams.get('type') : ''; };
    readUrl(); window.addEventListener('popstate', () => { readUrl(); syncFinder(); renderCatalog(); });
    syncFinder();
  }
  renderCatalog();

  /* ---------------- Model page ---------------- */
  const mp = $('[data-model-products]');
  if (mp) {
    const q = new URL(location.href).searchParams.get('model'); const modelId = q && modelById.has(q) ? q : mp.dataset.modelProducts; const m = modelById.get(modelId);
    if (m && q) { const h = $('.page-hero h1'); if (h) h.innerHTML = `<span>${esc(m.name)}</span>`; $$('.crumbs li:last-child').forEach((c) => (c.textContent = m.name)); $$('[data-model-meta]').forEach((el) => (el.textContent = `${m.brand} · ${m.series}`)); document.title = `${m.name} | iLab Shop`; }
    const all = D.products.filter((p) => p.modelIds.includes(modelId)); let type = '';
    const chips = $('[data-type-chips]', mp), grid = $('[data-model-grid]', mp);
    const render = () => { const list = all.filter((p) => !type || p.typeId === type); const types = D.categories.filter((c) => all.some((p) => p.typeId === c.id));
      chips.innerHTML = [`<button class="chip" type="button" data-chip="" aria-pressed="${!type}">All<span class="tech">${all.length}</span></button>`].concat(types.map((c) => `<button class="chip" type="button" data-chip="${esc(c.id)}" aria-pressed="${type === c.id}">${esc(c.name)}<span class="tech">${all.filter((p) => p.typeId === c.id).length}</span></button>`)).join('');
      $('[data-model-count]', mp).textContent = `${list.length} ${list.length === 1 ? 'product' : 'products'}`; grid.innerHTML = list.map((p) => cardHTML(p)).join(''); $('[data-model-empty]', mp).hidden = list.length > 0; if (list.length) revealRows(grid); };
    chips.addEventListener('click', (e) => { const c = e.target.closest('[data-chip]'); if (!c) return; type = c.dataset.chip; render(); });
    render(); $$('[data-model-count-hero]').forEach((el) => (el.textContent = all.length));
  }

  /* ---------------- Brand page model search ---------------- */
  const ms = $('[data-model-search]');
  if (ms) { const input = ms.querySelector('input'); const groups = $('[data-model-groups]');
    const run = () => { const q = norm(input.value); ms.classList.toggle('has-value', !!q); let any = false;
      $$('[data-model-group]', groups).forEach((g) => { let n = 0; $$('[data-model-item]', g).forEach((it) => { const hit = !q || norm(it.textContent + ' ' + g.querySelector('h3, .h3')?.textContent).includes(q); it.hidden = !hit; if (hit) n++; }); g.hidden = !n; if (n) any = true; });
      const empty = $('[data-model-search-empty]'); if (empty) { empty.hidden = any; empty.textContent = `No models found for “${input.value}”.`; } };
    input.addEventListener('input', run); $('[data-model-search-clear]')?.addEventListener('click', () => { input.value = ''; run(); input.focus(); }); }

  /* ---------------- Product page ---------------- */
  const pp = $('[data-product-page]');
  if (pp) {
    const slug = new URL(location.href).searchParams.get('slug') || pp.dataset.productPage; const p = bySlug.get(slug) || D.products[0];
    document.title = `${p.name} | iLab Shop`;
    const crumb = $('[data-product-crumb]'); if (crumb) { const b = brandById.get(p.brandId); crumb.innerHTML = `<li><a href="${ROOT}shop/index.html">Shop</a></li><li><a href="${ROOT}shop/iphone.html"${b && b.id !== 'iphone' ? ` data-template-of="/shop/${b.slug}"` : ''}>${esc(b ? b.name : p.brand)}</a></li><li>${esc(p.name)}</li>`; }
    $('[data-product-type]').textContent = `${p.type}${p.colour ? ' · ' + p.colour : ''}`; $('[data-product-title]').innerHTML = `<span>${esc(p.name)}</span>`; $('[data-product-sku]').textContent = `SKU ${p.sku}`;
    $('[data-product-price]').textContent = priceLabel(p); $('[data-product-availability]').textContent = STATUS[p.status] || '';
    const buy = $('[data-product-buy]');
    if (p.price != null && p.stock > 0) buy.innerHTML = `<label class="visually-hidden" for="pq">Quantity</label><span class="qty"><button type="button" data-q="-1" aria-label="Decrease quantity">−</button><input id="pq" type="number" value="1" min="1" max="${Math.min(99, p.stock)}" data-qty><button type="button" data-q="1" aria-label="Increase quantity">+</button></span><button class="btn btn-primary" type="button" data-add-to-cart="${esc(p.id)}">Add to cart</button><span class="tech">${p.stock} available</span>`;
    else if (p.price != null) buy.innerHTML = `<button class="btn btn-primary" type="button" data-open="inquiry" data-source="product" data-product="${esc(p.id)}">Request availability</button>`;
    else buy.innerHTML = `<p class="muted">This part is listed without a retail price. Ask us and we’ll confirm availability and price.</p><button class="btn btn-primary" type="button" data-open="inquiry" data-source="product" data-product="${esc(p.id)}">Request availability</button>`;
    buy.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (!b) return; const i = buy.querySelector('[data-qty]'); i.value = Math.max(1, Math.min(+i.max, (+i.value || 1) + +b.dataset.q)); });
    $('[data-product-desc]').textContent = p.desc || '';
    $$('[data-source="product"]', pp.parentElement).forEach((b) => (b.dataset.product = p.id));
    const rep = $('[data-product-repair]'); if (rep) { const b = brandById.get(p.brandId); rep.innerHTML = `<p class="h3">Need professional repair?</p><p>We can repair compatible devices at iLab.</p><p class="actions"><a class="btn btn-secondary" href="${ROOT}${SERVICE_PAGE[p.brandId] || 'index.html'}"${b && b.id !== 'iphone' ? ` data-template-of="${esc(b.repair?.paths?.lv || '/')}"` : ''}>${esc(b ? b.name : 'Device')} repair</a></p>`; }
    const compat = $('[data-product-compat]'); const groups = {}; p.modelIds.forEach((id, i) => { const m = modelById.get(id); const key = m ? `${m.brand}|${m.series}` : `${p.brand}|`; (groups[key] ||= []).push(m ? `<a class="link link--quiet" href="${modelUrl(m)}">${esc(m.name)}</a>` : esc(p.models[i])); });
    compat.innerHTML = Object.entries(groups).map(([k, items]) => { const [b, s] = k.split('|'); return `<h4>${esc(b)}${s ? ' · ' + esc(s) : ''}</h4><p class="pill-list">${items.join('')}</p>`; }).join('') || '<p class="muted">No compatible models listed.</p>';
    const g = $('[data-product-gallery]'); const imgs = [p.img ? ROOT + p.img : null, p.imgRemote].filter(Boolean); let idx = 0;
    const drawGallery = () => { if (!imgs.length) { g.innerHTML = '<div class="gallery__main"><span class="gallery__empty">No image</span></div>'; return; }
      g.innerHTML = `<div class="gallery__main"><img src="${esc(imgs[idx])}" alt="${esc(p.name)} image ${idx + 1} of ${imgs.length}" width="600" height="600" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'gallery__empty',textContent:'No image'}))">${imgs.length > 1 ? `<button class="gallery__nav gallery__nav--prev" type="button" data-g="-1" aria-label="Previous image"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button><button class="gallery__nav gallery__nav--next" type="button" data-g="1" aria-label="Next image"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>` : ''}</div>${imgs.length > 1 ? `<div class="gallery__dots">${imgs.map((_, i) => `<button type="button" data-gi="${i}" aria-current="${i === idx}" aria-label="Show image ${i + 1} of ${imgs.length}"></button>`).join('')}</div>` : ''}`; };
    g.addEventListener('click', (e) => { const n = e.target.closest('[data-g]'); const d = e.target.closest('[data-gi]'); if (n) idx = (idx + +n.dataset.g + imgs.length) % imgs.length; else if (d) idx = +d.dataset.gi; else return; drawGallery(); });
    let tx = 0; g.addEventListener('touchstart', (e) => (tx = e.touches[0].clientX), { passive: true }); g.addEventListener('touchend', (e) => { const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40 && imgs.length > 1) { idx = (idx + (dx < 0 ? 1 : -1) + imgs.length) % imgs.length; drawGallery(); } });
    drawGallery();
  }

  /* ---------------- Checkout ---------------- */
  const co = $('form[data-checkout]');
  if (co) {
    const fee = () => ({ pickup: 0, courier: 5, omniva: 2.93 }[co.fulfillment?.value] ?? 0);
    const setState = (s) => $$('[data-checkout-state]', co).forEach((p) => (p.hidden = p.dataset.checkoutState !== s));
    const forced = new URL(location.href).searchParams.get('state');
    const decide = () => forced || (!user() ? 'auth' : !cart.length ? 'empty' : 'form');
    const summary = () => { $('[data-summary-lines]').innerHTML = cart.map((l) => { const p = byId.get(l.id); return `<p class="summary__line"><span>${esc(p ? p.name : l.id)} × ${l.qty}</span><span class="num">${p && p.price != null ? money(p.price * l.qty) : '—'}</span></p>`; }).join('') || '<p class="summary__line"><span>No items</span><span>—</span></p>';
      $('[data-summary-subtotal]').textContent = money(cartTotal()); $('[data-summary-delivery]').textContent = fee() ? money(fee()) : 'Free'; $('[data-summary-total]').textContent = money(cartTotal() + fee()); $('[data-summary-warn]').hidden = cartValid() || !cart.length; };
    const syncFulfil = () => { const v = co.fulfillment?.value; $$('[data-fulfil-fields]', co).forEach((f) => (f.hidden = f.dataset.fulfilFields !== v)); const bill = co.querySelector('[data-use-billing]'); const addr = co.querySelector('[data-delivery-address]'); if (bill && addr) addr.hidden = bill.checked; summary(); };
    co.addEventListener('change', syncFulfil);
    const prefill = () => { const u = user(); if (u) ['name', 'email', 'phone', 'companyName'].forEach((k) => { const i = co.querySelector(`[name="${k}"]`); if (i && !i.value) i.value = u[k === 'companyName' ? 'company' : k] || ''; }); };
    prefill();
    if (decide() === 'auth') { afterLoginCb = () => { prefill(); setState(decide()); syncFulfil(); }; setTimeout(() => window.ILAB_UI.open('login'), 400); }
    setState(decide()); syncFulfil();
    if (forced === 'done') { $('[data-order-ref]').textContent = 'Order #2026-000123 has been placed.'; $('[data-order-invoice]').textContent = 'Invoice ILAB-2026-000123'; }
    co.addEventListener('submit', (e) => { e.preventDefault(); if (!formOk(co)) { co.classList.add('is-error'); return; } if (!cartValid()) { co.classList.add('is-error'); co.querySelector('.form__status').textContent = 'Review the cart before placing the order.'; return; }
      co.classList.remove('is-error'); sending(co, true);
      setTimeout(() => { const orders = store.get('ilab_shop_orders', []); const n = 123 + orders.length; const ref = `2026-${String(n).padStart(6, '0')}`;
        orders.push({ ref, invoice: `ILAB-${ref}`, date: new Date().toISOString().slice(0, 10), total: cartTotal() + fee(), fulfillment: co.fulfillment.value, payment: co.payment.value, lines: cart.map((l) => ({ id: l.id, qty: l.qty })), status: co.payment.value === 'bank' ? 'Awaiting payment' : 'Confirmed' });
        store.set('ilab_shop_orders', orders); cart = []; saveCart();
        $('[data-order-ref]').textContent = `Order #${ref} has been placed.`; $('[data-order-invoice]').textContent = `Invoice ILAB-${ref}`; setState('done'); window.scrollTo(0, 0); sending(co, false); }, 900); });
  }

  /* ---------------- Account ---------------- */
  const acc = $('[data-account]');
  if (acc) { const u = user(); const gate = $('[data-account-gate]'); if (!u) { gate && (gate.hidden = false); $$('[data-account-section]', acc).forEach((s) => (s.hidden = true)); setTimeout(() => window.ILAB_UI.open('login'), 400); afterLoginCb = () => location.reload(); }
    else { $$('[data-account-name]').forEach((el) => (el.textContent = `${u.name} · ${u.email}`)); const orders = store.get('ilab_shop_orders', []); const list = $('[data-account-orders]');
      list.innerHTML = orders.slice().reverse().map((o) => `<div><b>Order #${esc(o.ref)}</b><span class="status"><i class="status__dot${o.status === 'Confirmed' ? ' is-open' : ''}"></i>${esc(o.status)}</span><span class="small muted">${esc(o.date)} · ${esc(o.fulfillment)} · ${o.payment === 'bank' ? 'bank transfer' : 'cash on pickup'} · ${money(o.total)}</span><span class="small"><a class="link" href="#" data-invoice>View invoice ${esc(o.invoice)}</a> · <a class="link" href="#" data-invoice>Download</a></span></div>`).join('');
      $('[data-account-orders-empty]').hidden = orders.length > 0;
      const pf = $('[data-account-profile]'); if (pf) { ['name', 'phone', 'companyName'].forEach((k) => { const i = pf.querySelector(`[name="${k}"]`); if (i) i.value = u[k === 'companyName' ? 'company' : k] || ''; }); pf.addEventListener('submit', (e) => { e.preventDefault(); const nu = { ...u, name: pf.name.value.trim(), phone: pf.phone.value.trim(), company: pf.companyName.value.trim() }; store.set(USER_KEY, nu); pf.classList.add('is-success'); setTimeout(() => pf.classList.remove('is-success'), 2500); }); }
      $$('[data-account-wholesale]').forEach((el) => (el.textContent = u.wholesale === 'approved' ? 'Approved partner' : u.wholesale === 'pending' ? 'Awaiting approval' : 'Retail account')); } }
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-invoice]'); if (a) { e.preventDefault(); alert('Invoice PDF is generated by the order service in the wired version.'); } });
})();
