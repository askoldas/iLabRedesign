/* iLab motion. GSAP 3 + ScrollTrigger. One idea: a thin signal line that scans and reveals.
   Wiring: in Next.js wrap this in useGSAP with gsap.context scoped to the page root; call ILAB_MOTION.* from components. */
(function () {
  'use strict';
  // ?motion=off renders the final state without animation (review screenshots, QA)
  if (!window.gsap || !window.ScrollTrigger || /[?&]motion=off/.test(location.search)) { document.documentElement.classList.add('no-motion'); return; }
  gsap.registerPlugin(ScrollTrigger);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scan = document.querySelector('.scan');
  const shutter = document.querySelector('.shutter');
  const header = document.querySelector('.site-header');
  const EASE = 'expo.out';

  const api = {};
  window.ILAB_MOTION = api;

  /* ---------- Reduced motion: show everything, animate nothing ---------- */
  if (reduce) {
    gsap.set('[data-scan], [data-scan="x"]', { clearProps: 'clipPath' });
    gsap.set('[data-rise] > *', { clearProps: 'transform' });
    gsap.set('[data-stagger] > *', { opacity: 1 });
    header && gsap.set(header, { opacity: 1 });
    $$('[data-count]').forEach((el) => (el.textContent = el.dataset.count));
    api.drawerOpen = (el) => gsap.fromTo(el, { x: 0, opacity: 0 }, { opacity: 1, duration: 0.15, clearProps: 'transform' });
    api.drawerClose = (el, done) => gsap.to(el, { opacity: 0, duration: 0.15, onComplete: () => { gsap.set(el, { clearProps: 'all' }); done(); } });
    api.revealRows = () => {};
    return;
  }

  /* ---------- Entrance: the line travels down once, releasing what it passes ---------- */
  function entrance() {
    const vh = window.innerHeight;
    const tl = gsap.timeline({ defaults: { ease: EASE } });
    gsap.set(scan, { opacity: 1, y: 0 });
    tl.to(scan, { y: vh, duration: 0.9, ease: 'power2.inOut' }, 0);
    tl.to(scan, { opacity: 0, duration: 0.2 }, 0.85);

    // in-viewport data-scan (vertical unmask) timed to the line's position
    $$('[data-scan]:not([data-scan="x"])').forEach((el) => {
      const top = el.getBoundingClientRect().top;
      if (top > vh) return; // below the fold: handled by scroll reveal
      const at = Math.max(0, Math.min(0.9, (top / vh) * 0.9));
      gsap.set(el, { clipPath: 'inset(0% 0% 100% 0%)' });
      el.dataset.scanDone = '1';
      tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 }, at);
    });
    // headline lines rise
    $$('[data-rise]').forEach((wrap) => {
      const top = wrap.getBoundingClientRect().top;
      const at = Math.max(0.05, Math.min(0.9, (top / vh) * 0.9));
      tl.to(wrap.children, { yPercent: 0, y: 0, duration: 0.9, stagger: 0.08 }, at);
    });
    // staggered lists
    $$('[data-stagger]').forEach((wrap) => {
      const top = wrap.getBoundingClientRect().top;
      if (top > vh) { gsap.set(wrap.children, { opacity: 1 }); return; }
      const at = Math.max(0.1, Math.min(0.9, (top / vh) * 0.9));
      wrap.dataset.staggerDone = '1';
      tl.to(wrap.children, { opacity: 1, duration: 0.5, stagger: 0.05 }, at);
    });
    header && tl.to(header, { opacity: 1, duration: 0.4 }, 0.7);
    return tl;
  }

  /* ---------- Scroll reveals ---------- */
  function scrollReveals() {
    // vertical unmask for data-scan below the fold
    $$('[data-scan]:not([data-scan="x"])').forEach((el) => {
      if (el.dataset.scanDone) return;
      gsap.set(el, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE, scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    });
    // horizontal wipe with a riding line for images/panels
    $$('[data-scan="x"]').forEach((el) => {
      gsap.set(el, { clipPath: 'inset(0% 100% 0% 0%)' });
      const line = document.createElement('i');
      line.className = 'scan-x';
      el.style.position = el.style.position || 'relative';
      el.appendChild(line);
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
      tl.set(line, { opacity: 1 })
        .to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.9, ease: EASE }, 0)
        .to(line, { left: '100%', duration: 0.9, ease: EASE }, 0)
        .to(line, { opacity: 0, duration: 0.2 }, 0.75);
    });
    // staggered lists not handled by entrance
    $$('[data-stagger]').forEach((wrap) => {
      if (wrap.dataset.staggerDone) return;
      gsap.to(wrap.children, { opacity: 1, duration: 0.5, stagger: 0.04, ease: EASE, scrollTrigger: { trigger: wrap, start: 'top 85%', once: true } });
    });
    // rows rendered at load
    $$('[data-rows]').forEach(api.revealRows);
    // counters (real numbers only)
    $$('[data-count]').forEach((el) => {
      const end = parseFloat(el.dataset.count);
      const dec = (el.dataset.count.split('.')[1] || '').length;
      const o = { v: 0 };
      el.textContent = (0).toFixed(dec);
      gsap.to(o, { v: end, duration: 1.2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => (el.textContent = o.v.toFixed(dec)) });
    });
  }

  api.revealRows = function (root) {
    const rows = root.matches('[data-rows]') ? Array.from(root.children) : $$('[data-rows] > *', root);
    if (!rows.length) return;
    gsap.set(rows, { opacity: 0 });
    gsap.to(rows, { opacity: 1, duration: 0.45, stagger: 0.04, ease: EASE, scrollTrigger: { trigger: rows[0], start: 'top 95%', once: true } });
  };

  /* ---------- Process track: the signal segment walks the steps ---------- */
  function processTrack() {
    $$('[data-process]').forEach((proc) => {
      const seg = proc.querySelector('.process__seg');
      const track = proc.querySelector('.process__track');
      const steps = $$('.process__step', proc);
      if (!seg || !track || !steps.length) return;
      const mm = gsap.matchMedia();
      const setActive = (p) => {
        const i = Math.min(steps.length - 1, Math.floor(p * steps.length));
        steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
      };
      setActive(0);
      mm.add('(min-width: 1024px)', () => {
        const st = ScrollTrigger.create({
          trigger: proc, start: 'top 20%', end: '+=720', pin: true, scrub: 0.6,
          onUpdate: (self) => {
            gsap.set(seg, { y: (track.offsetHeight - 48) * self.progress });
            setActive(self.progress);
          },
        });
        return () => st.kill();
      });
      mm.add('(max-width: 1023px)', () => {
        const st = ScrollTrigger.create({
          trigger: proc, start: 'top 70%', end: 'bottom 50%', scrub: 0.6,
          onUpdate: (self) => {
            gsap.set(seg, { y: (track.offsetHeight - 48) * self.progress });
            setActive(self.progress);
          },
        });
        return () => st.kill();
      });
    });
  }

  /* ---------- Rails: clickable section index (left) and scroll ruler (right) ---------- */
  function scrollToY(y) {
    const o = { y: window.scrollY };
    const root = document.documentElement;
    root.style.scrollBehavior = 'auto'; // CSS smooth scrolling would restart on every frame
    gsap.to(o, { y, duration: 0.8, ease: 'power2.inOut', overwrite: true, onUpdate: () => window.scrollTo(0, o.y), onComplete: () => { root.style.scrollBehavior = ''; } });
  }
  api.scrollToY = scrollToY;
  function rails() {
    document.querySelectorAll('[data-rail-ticks]').forEach((t) => { for (let i = 0; i < 41; i++) { const tick = document.createElement('i'); tick.style.top = `${(i / 40) * 100}%`; t.appendChild(tick); } });
    const marker = document.querySelector('[data-rail-marker]');
    const left = document.querySelector('[data-rail-sections]');
    const sections = $$('main > section');
    const pad = (n) => String(n).padStart(2, '0');
    const headerH = () => (document.querySelector('.site-header')?.offsetHeight || 72);
    // left rail: one button per section along the tick track
    const btns = [];
    if (left && sections.length > 1) {
      const track = left.querySelector('[data-rail-ticks]');
      const label = left.dataset.sectionLabel || 'Section';
      sections.forEach((sec, i) => {
        const head = sec.querySelector('h1, h2, .h2, .display-1, .display-2');
        const title = (head ? Array.from(head.childNodes).map((n) => n.textContent).join(' ') : sec.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'rail__sect';
        b.style.top = `${(i / (sections.length - 1)) * 100}%`;
        b.innerHTML = `${pad(i + 1)}<span class="rail__tip">${title ? title.replace(/</g, '&lt;') : ''}</span>`;
        b.setAttribute('aria-label', `${label} ${i + 1}${title ? ': ' + title : ''}`);
        b.addEventListener('click', () => scrollToY(sec.getBoundingClientRect().top + window.scrollY - headerH() + 1));
        track.appendChild(b); btns.push(b);
      });
    }
    sections.forEach((sec, i) => ScrollTrigger.create({ trigger: sec, start: `top ${headerH() + 1}px`, end: `bottom ${headerH() + 1}px`, onToggle: (self) => {
      if (!self.isActive) return;
      btns.forEach((b, k) => b.classList.toggle('is-cur', k === i));
    } }));
    // right rail: marker follows scroll progress; clicking the ruler scrolls there
    if (marker) {
      const track = marker.parentElement.querySelector('[data-rail-ticks]');
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => gsap.set(marker, { y: (track.offsetHeight - 48) * self.progress }) });
      track.addEventListener('click', (e) => {
        const r = track.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        scrollToY(p * (document.documentElement.scrollHeight - window.innerHeight));
      });
    }
  }

  /* ---------- Text on scroll: headings rise from a clipped line; paragraphs, list items and facts light up word by word ---------- */
  function textOnScroll() {
    const isHome = document.body.dataset.page === 'home';
    const SKIP = '[data-rise], .hero, .tech, .crumbs, .branch-head, .rating-head, .review__meta, .spec, .models, .pill-list, .branch__links, .actions, .hero__proof, .strip, .cookie, .drawer, .form, .toc, .nav, .rail, .footer__col, .site-footer, .map, .quickfacts, .status, .finder';
    const skip = (el) => el.closest(SKIP) || el.closest('details:not([open])');
    // headings
    (isHome ? [] : $$('main h2, main h3, main .h2, main .h3')).forEach((h) => {
      if (skip(h) || h.dataset.riseDone || h.querySelector('a, button')) return;
      h.dataset.riseDone = '1';
      const inner = document.createElement('span');
      while (h.firstChild) inner.appendChild(h.firstChild);
      h.appendChild(inner); h.classList.add('clip-rise');
      gsap.from(inner, { yPercent: 110, duration: 0.9, ease: EASE, scrollTrigger: { trigger: h, start: 'top 90%', once: true } });
    });
    // running text
    let budget = 2500; // words per page; beyond this, blocks fade instead of words
    (isHome ? $$('.home-reviews .review__text') : $$('main p, main li, main dd, main .fact, main summary')).forEach((p) => {
      if (skip(p) || p.dataset.wordsDone || p.querySelector('p, li, table, img')) return;
      p.dataset.wordsDone = '1';
      const count = p.textContent.trim().split(/\s+/).length;
      const inHero = !!p.closest('.page-hero');
      const st = inHero ? { trigger: p, start: 'top 95%', end: 'top 60%', scrub: 0.4 } : { trigger: p, start: 'top 92%', end: 'top 55%', scrub: 0.6 };
      if (count > 70 || budget - count < 0) {
        gsap.fromTo(p, { opacity: 0.3 }, { opacity: 1, ease: 'none', scrollTrigger: st });
        return;
      }
      budget -= count;
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      const nodes = []; let n; while ((n = walker.nextNode())) nodes.push(n);
      nodes.forEach((t) => {
        if (!t.textContent.trim() || t.parentElement.closest('.plus, svg')) return;
        const frag = document.createDocumentFragment();
        t.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'word'; w.textContent = part; frag.appendChild(w);
        });
        t.parentNode.replaceChild(frag, t);
      });
      const words = $$('.word', p);
      if (!words.length) return;
      gsap.fromTo(words, { opacity: 0.22 }, { opacity: 1, ease: 'none', stagger: 0.04, scrollTrigger: st });
    });
  }

  /* ---------- Homepage signature: the bench image stays physical while the copy clears ---------- */
  function homeSignature() {
    if (document.body.dataset.page !== 'home') return;
    const hero = document.querySelector('.hero');
    const image = hero && hero.querySelector('.hero__visual img');
    if (hero && image) {
      gsap.to(image, { scale: 1.07, yPercent: 4, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.6 } });
    }
    const statement = document.querySelector('.precision-intro__statement');
    if (statement) {
      gsap.from(statement.children, { yPercent: 45, opacity: 0.18, duration: 1, stagger: 0.09, ease: EASE, scrollTrigger: { trigger: statement, start: 'top 82%', once: true } });
    }
  }

  /* ---------- Reviews: the reading focus travels through the ledger ---------- */
  function reviewFocus() {
    if (document.body.dataset.page !== 'home') return;
    $$('.reviews__branch [data-reviews]').forEach((list) => {
      const reviews = $$('.review', list);
      if (!reviews.length) return;
      list.classList.add('has-review-focus');
      let current = 0;
      const focus = (index, direction) => {
        if (index === current) return;
        const previous = current;
        current = index;
        reviews.forEach((review, i) => {
          const active = i === index;
          review.classList.toggle('is-review-focus', active);
          const words = $$('.word', review);
          if (words.length && (active || i === previous)) gsap.to(words, {
            opacity: active ? 1 : 0.2,
            duration: 0.42,
            stagger: { each: 0.018, from: direction < 0 ? 'end' : 'start' },
            ease: 'power2.out',
            overwrite: true,
          });
        });
      };
      reviews.forEach((review, i) => review.classList.toggle('is-review-focus', i === 0));
      ScrollTrigger.create({
        trigger: list,
        start: 'top 68%',
        end: 'bottom 42%',
        scrub: 0.4,
        onUpdate: (self) => focus(Math.min(reviews.length - 1, Math.floor(self.progress * reviews.length)), self.direction),
      });
    });

    const columns = $$('.reviews__branch [data-reviews]').map((list) => $$('.review', list));
    const syncHeights = () => {
      columns.flat().forEach((review) => (review.style.minHeight = ''));
      if (window.innerWidth < 1024 || columns.length < 2) return;
      const count = Math.max(...columns.map((column) => column.length));
      for (let row = 0; row < count; row++) {
        const peers = columns.map((column) => column[row]).filter(Boolean);
        const height = Math.max(...peers.map((review) => review.getBoundingClientRect().height));
        peers.forEach((review) => (review.style.minHeight = `${Math.ceil(height)}px`));
      }
    };
    let resizeFrame;
    const scheduleSync = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { syncHeights(); ScrollTrigger.refresh(); });
    };
    scheduleSync();
    window.addEventListener('resize', scheduleSync, { passive: true });
    document.addEventListener('click', (event) => {
      if (event.target.closest('.home-reviews [data-expand]')) setTimeout(scheduleSync, 360);
    });
  }

  /* ---------- Accordions: animate <details> height instead of snapping; a click mid-animation reverses ---------- */
  function accordions() {
    document.addEventListener('click', (e) => {
      const summary = e.target.closest('details.acc > summary');
      if (!summary) return;
      const details = summary.parentElement;
      const body = details.querySelector('.acc__body');
      if (!body) return;
      e.preventDefault();
      gsap.killTweensOf(body);
      body.style.overflow = 'hidden';
      const opening = !details.open || details.dataset.closing === '1';
      if (opening) {
        delete details.dataset.closing;
        details.open = true;
        gsap.to(body, { height: 'auto', opacity: 1, duration: 0.5, ease: EASE, onComplete: () => { gsap.set(body, { clearProps: 'height,opacity,overflow' }); ScrollTrigger.refresh(); } });
      } else {
        details.dataset.closing = '1';
        gsap.to(body, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => {
          details.open = false; delete details.dataset.closing; gsap.set(body, { clearProps: 'height,opacity,overflow' });
        } });
      }
    });
    // the finder opens groups by setting .open directly; nothing to do there
  }

  /* ---------- Drawers ---------- */
  api.drawerOpen = function (el) {
    const line = el.querySelector('.drawer__scan');
    gsap.killTweensOf(el);
    gsap.fromTo(el, { x: 0, xPercent: 100 }, { xPercent: 0, duration: 0.4, ease: EASE });
    if (line) gsap.fromTo(line, { x: 0, opacity: 1 }, { x: el.offsetWidth, opacity: 0, duration: 0.6, ease: 'power2.inOut', delay: 0.15 });
  };
  api.drawerClose = function (el, done) {
    gsap.to(el, { xPercent: 100, duration: 0.3, ease: 'power2.in', onComplete: () => { gsap.set(el, { clearProps: 'transform' }); done(); } });
  };

  /* ---------- Page transition: the line sweeps down, paper follows, then navigate ---------- */
  function transitions() {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || a.hasAttribute('data-no-transition') || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/.test(href)) return;
      if (a.closest('[data-open]')) return;
      e.preventDefault();
      if (window.ILAB_UI) window.ILAB_UI.close(true);
      const vh = window.innerHeight;
      gsap.set(scan, { opacity: 1, y: 0 });
      gsap.set(shutter, { clipPath: 'inset(0% 0% 100% 0%)' });
      gsap.timeline({ onComplete: () => (window.location.href = href) })
        .to(scan, { y: vh, duration: 0.45, ease: 'power2.inOut' }, 0)
        .to(shutter, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.45, ease: 'power2.inOut' }, 0.02);
    });
    window.addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(shutter, { clipPath: 'inset(0% 0% 100% 0%)' }); gsap.set(scan, { opacity: 0 }); } });
  }

  /* ---------- Boot ---------- */
  function boot() {
    entrance();
    scrollReveals();
    processTrack();
    homeSignature();
    textOnScroll();
    reviewFocus();
    rails();
    accordions();
    transitions();
    ScrollTrigger.refresh();
  }
  requestAnimationFrame(boot);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
