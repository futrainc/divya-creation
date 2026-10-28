(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ── flying-butterfly loader: leaves once the page has loaded (min ~1.9s) ── */
  (function () {
    var L = $('#loader'); if (!L) { root.classList.add('ready'); return; }
    var bar = $('#ldBar'), t0 = performance.now(), min = reduce ? 250 : 3200, p = 0, done = false;
    document.body.style.overflow = 'hidden';
    (function tick() { if (done) return; p += (88 - p) * .025; bar.style.width = p.toFixed(1) + '%'; requestAnimationFrame(tick); })();
    function finish() {
      if (done) return; done = true;
      setTimeout(function () {
        bar.style.width = '100%'; $('#ldStage').classList.add('go'); L.classList.add('out');
        document.body.style.overflow = ''; root.classList.add('ready');
        setTimeout(function () { L.remove(); }, 2200);
      }, Math.max(0, min - (performance.now() - t0)));
    }
    if (document.readyState === 'complete') finish(); else addEventListener('load', finish);
    setTimeout(finish, 8000);
  })();

  /* ── scalloped clip path (workshop photos) ── */
  (function () {
    var d = ''; for (var i = 0; i <= 360; i += 2) { var a = i * Math.PI / 180, r = .465 + .028 * Math.cos(a * 14); d += (i ? 'L' : 'M') + (.5 + Math.cos(a) * r).toFixed(4) + ',' + (.5 + Math.sin(a) * r).toFixed(4); }
    $('#scallopPath').setAttribute('d', d + 'Z');
  })();

  /* ── theme ── */
  var hero = $('#hero'), lit = false;
  function setTheme(t, persist) {
    root.setAttribute('data-mode', t);
    $('meta[name=theme-color]').setAttribute('content', t === 'day' ? '#ebe6df' : '#150d0a');
    if (persist !== false) store.set('dc-theme', t);
  }
  $('#themeBtn').addEventListener('click', function () {
    if (root.getAttribute('data-mode') !== 'day') lightUp(); else snuff();
  });

  /* ── hero: split headline ── */
  (function () {
    var i = 0;
    $$('#heroTitle .ln').forEach(function (ln) {
      var out = '';
      (function walk(n) {
        n.childNodes.forEach(function (c) {
          if (c.nodeType === 3) { c.textContent.split('').forEach(function (ch) { out += ch === ' ' ? '<span class="sp"></span>' : '<span class="ch" style="--i:' + (i++) + '" aria-hidden="true">' + ch + '</span>'; }); }
          else if (c.nodeName === 'EM') { out += '<em>'; walk(c); out += '</em>'; }
        });
      })(ln);
      ln.innerHTML = out;
    });
  })();

  /* ── hero: the light ── */
  var H = { mx: 0, my: 0, tx: 0, ty: 0, r: 300, tr: 300, auto: !fine || reduce, t0: 0, idle: 0 };
  function heroBox() { return hero.getBoundingClientRect(); }
  function setHero() {
    hero.style.setProperty('--mx', H.mx.toFixed(1) + 'px');
    hero.style.setProperty('--my', H.my.toFixed(1) + 'px');
    hero.style.setProperty('--r', H.r.toFixed(1) + 'px');
  }
  (function () {
    var b = heroBox(); H.mx = H.tx = b.width / 2; H.my = H.ty = b.height * .42; setHero();
  })();
  hero.addEventListener('pointermove', function (e) {
    var b = heroBox(); H.tx = e.clientX - b.left; H.ty = e.clientY - b.top; H.auto = false; H.idle = 0;
    var nx = (e.clientX / innerWidth - .5), ny = (e.clientY / innerHeight - .5);
    hero.style.setProperty('--px', (nx * 40).toFixed(1)); hero.style.setProperty('--py', (ny * 40).toFixed(1));
  });
  hero.addEventListener('pointerleave', function () { if (fine) H.idle = 100; });
  var heroSeen = true;
  new IntersectionObserver(function (e) { heroSeen = e[0].isIntersecting; }).observe(hero);
  function heroLoop(t) {
    requestAnimationFrame(heroLoop);
    if (!heroSeen) return;
    var b = heroBox();
    if (H.auto || H.idle > 90) { // drift like a candle carried through a dark room
      var s = t / 1000; H.tx = b.width * (.5 + .34 * Math.sin(s * .55)); H.ty = b.height * (.45 + .26 * Math.sin(s * .83 + 1));
      if (H.idle > 90) H.idle = Math.min(H.idle + 1, 400);
    } else if (H.idle) H.idle++;
    H.mx += (H.tx - H.mx) * .09; H.my += (H.ty - H.my) * .09;
    if (!lit) H.tr = 300 + Math.sin(t / 380) * 8 + Math.sin(t / 130) * 4; // flicker
    H.r += (H.tr - H.r) * (lit ? .05 : .2);
    setHero();
  }
  requestAnimationFrame(heroLoop);

  function lightUp(instant) {
    if (lit) return; lit = true;
    var btn = $('#lightBtn'); btn.querySelector('.t').textContent = 'The flame is lit'; btn.setAttribute('aria-pressed', 'true'); btn.title = 'Click to blow it out';
    $('#hint').innerHTML = '<span class="dot"></span> The room is lit — scroll to explore';
    H.tr = Math.hypot(innerWidth, innerHeight) * 1.5;
    if (instant) { H.r = H.tr; }
    setTimeout(function () { hero.classList.add('lit'); }, instant ? 0 : 500);
    setTimeout(function () { setTheme('day'); }, instant ? 0 : 900);
  }
  function snuff() {
    if (!lit) { setTheme('night'); return; }
    lit = false; H.tr = 300; hero.classList.remove('lit'); setTheme('night');
    $('#lightBtn .t').textContent = 'Light the candle'; $('#lightBtn').setAttribute('aria-pressed', 'false'); $('#lightBtn').removeAttribute('title');
    $('#hint').innerHTML = '<span class="dot"></span> Move your light across the dark — treasures are hiding';
  }
  $('#lightBtn').addEventListener('click', function () { lit ? snuff() : lightUp(); });
  if (store.get('dc-theme') === 'day') { lightUp(true); setTheme('day', false); }
  else if (!fine || reduce) { $('#hint').innerHTML = '<span class="dot"></span> Watch the light wander — or light the candle'; }

  /* flame cursor */
  if (fine) {
    var fc = $('.flame-cursor'), cx = 0, cy = 0, fx = 0, fy = 0;
    addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; fc.classList.add('on'); });
    document.addEventListener('pointerleave', function () { fc.classList.remove('on'); });
    (function ff() { fx += (cx - fx) * .25; fy += (cy - fy) * .25; fc.style.transform = 'translate(' + (fx - 17).toFixed(1) + 'px,' + (fy - 44).toFixed(1) + 'px)'; requestAnimationFrame(ff); })();
  }

  /* embers */
  (function () {
    var c = $('#embers'), x = c.getContext('2d'), w, h, ps = [], seen = true, dpr = Math.min(devicePixelRatio || 1, 2);
    function size() { w = c.width = hero.clientWidth * dpr; h = c.height = hero.clientHeight * dpr; }
    size(); addEventListener('resize', size);
    function mk(init) { return { x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: (Math.random() * 1.8 + .4) * dpr, vy: (Math.random() * .6 + .2) * dpr, ph: Math.random() * 6, a: Math.random() * .7 + .2 }; }
    for (var i = 0; i < (reduce ? 0 : 70); i++) ps.push(mk(true));
    new IntersectionObserver(function (e) { seen = e[0].isIntersecting; }).observe(hero);
    (function f(t) {
      requestAnimationFrame(f); if (!seen || !ps.length) return;
      x.clearRect(0, 0, w, h);
      ps.forEach(function (p, i) {
        p.y -= p.vy; p.x += Math.sin(t / 900 + p.ph) * .5 * dpr; if (p.y < -10) ps[i] = mk(false);
        var al = p.a * (.5 + .5 * Math.sin(t / 300 + p.ph));
        var g = x.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, 'rgba(255,190,100,' + al + ')'); g.addColorStop(1, 'rgba(255,120,40,0)');
        x.fillStyle = g; x.beginPath(); x.arc(p.x, p.y, p.r * 5, 0, 6.3); x.fill();
      });
    })(0);
  })();

  /* ── nav ── */
  var nav = $('#nav'), burger = $('#burger'), links = $('#links');
  function onScroll() {
    var y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    nav.classList.toggle('stuck', y > 40);
    $('.progress i').style.width = (max > 0 ? y / max * 100 : 0) + '%';
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  burger.addEventListener('click', function () {
    var o = burger.getAttribute('aria-expanded') !== 'true'; burger.setAttribute('aria-expanded', o); links.classList.toggle('open', o);
    document.body.style.overflow = o ? 'hidden' : '';
  });
  $$('a', links).forEach(function (a) { a.addEventListener('click', function () { burger.setAttribute('aria-expanded', false); links.classList.remove('open'); document.body.style.overflow = ''; }); });
  var navIO = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) $$('#links a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('#links a').forEach(function (a) { var s = $(a.getAttribute('href')); if (s) navIO.observe(s); });

  /* ── reveal + counters ── */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
      $$('[data-count]', e.target).forEach(count);
    });
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(function (el, i) { el.style.setProperty('--d', ((i % 4) * .08) + 's'); io.observe(el); });
  function count(el) {
    var to = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now();
    (function f(t) { var k = clamp((t - t0) / 1600, 0, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))) + suf; if (k < 1) requestAnimationFrame(f); })(t0);
  }
  $$('.values li').forEach(function (li) {
    li.addEventListener('pointermove', function (e) { var r = li.getBoundingClientRect(); li.style.setProperty('--x', (e.clientX - r.left) + 'px'); li.style.setProperty('--y', (e.clientY - r.top) + 'px'); });
  });

  /* ── atlas: pinned horizontal scroll ── */
  (function () {
    var sec = $('#crafts'), track = $('#atlasTrack'), num = $('#atlasNum'), bar = $('#atlasBar'), mq = matchMedia('(min-width:981px)'), dist = 0, N = $$('.panel', track).length;
    function size() {
      if (!mq.matches) { sec.style.height = ''; track.style.transform = ''; return; }
      dist = (N - 1) * innerWidth; sec.style.height = (dist + innerHeight) + 'px'; upd();
    }
    function upd() {
      if (!mq.matches) return;
      var p = clamp(-sec.getBoundingClientRect().top / (sec.offsetHeight - innerHeight), 0, 1);
      track.style.transform = 'translate3d(' + (-p * dist).toFixed(1) + 'px,0,0)';
      bar.style.width = (p * 100) + '%';
      var n = Math.round(p * (N - 1)) + 1; num.textContent = ('0' + n).slice(-2);
    }
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', size); mq.addEventListener && mq.addEventListener('change', size);
    window.addEventListener('load', size); size();
  })();

  /* ── resin gallery ── */
  var CATS = [
    { k: 'all', t: 'All', n: 'Coasters, clocks, frames, floral preservations, keychains, name plates and tables — each one poured, set and finished by hand.' },
    { k: 'np', t: 'Name plates', n: 'Premium handcrafted resin name plates to elevate entryways and interior spaces — in any size, colour and finish, in English, Hindi or Marathi.' },
    { k: 'cl', t: 'Wall clocks', n: 'Premium handcrafted resin wall clocks — statement pieces for modern interiors, customizable in size, colours and finishes.' },
    { k: 'th', t: 'Pooja thalis', n: 'Elegant handcrafted resin pooja thalis with premium finishes and artistic detailing — for festive themes, return gifts and curated décor.' },
    { k: 'kc', t: 'Keychains', n: 'Personalized accessories crafted from epoxy resin, combining style with durability.' },
    { k: 'fr', t: 'Frames & keepsakes', n: 'Frames customized with names, photos, flowers or special elements — plus wedding varmala preserved forever in resin.' },
    { k: 'tb', t: 'Tables', n: 'Luxury handcrafted resin tables — statement furniture, fully customizable in size, colours and finishes.' },
    { k: 'tr', t: 'Trays & coasters', n: 'Elegant resin trays and coasters to enhance modern interiors and table styling — in any colour, pattern and finish.' },
    { k: 'mn', t: 'Mantra frames', n: 'Premium mantra frames that add a serene, spiritual aesthetic to modern interiors — from desk-size to grand panels.' },
    { k: 'hd', t: 'Desk pieces', n: 'Handcrafted resin card holders, pen stands and organisers to enhance desk aesthetics — lovely for offices and corporate gifting.' },
    { k: 'fx', t: '3D flowers & mirrors', n: 'Rich, textured 3D flower resin panels and luxury resin mirrors — statement décor, customizable in colour, composition and size.' }
  ];
  var ITEMS = [
    ['np-1', 'np', 'Shri Ram Niwas — gold on marble'], ['np-2', 'np', 'Oval plate with crushed stone'], ['np-3', 'np', 'Backlit entryway plate'], ['np-4', 'np', 'Radha Krishna round plate'], ['np-5', 'np', 'Sangita & Ramesh'], ['r-nameplate', 'np', 'Ocean-teal oval plate'],
    ['cl-1', 'cl', 'Geode statement clock'], ['cl-2', 'cl', 'Peach crushed-stone clock'], ['cl-3', 'cl', 'Black & gold clock'], ['cl-4', 'cl', 'Neutral marble clock'], ['cl-5', 'cl', 'Emerald ocean clock'], ['cl-6', 'cl', 'Couple’s keepsake clock'], ['r-clock', 'cl', 'Ivory & gold clock'], ['x-clock', 'cl', 'Rose-pink clock'],
    ['th-1', 'th', 'Blush floral pooja thali'], ['th-2', 'th', 'Teal Ganesha thali'], ['th-3', 'th', 'Pink Ganpati thali'], ['th-4', 'th', 'Lilac petal thali'], ['th-5', 'th', 'Pastel thali trio'], ['th-6', 'th', 'Rose-gold leaf thali'],
    ['k-evil', 'kc', 'Evil-eye keychains'], ['k-tassel', 'kc', 'Monogram tassel keychains'], ['k-letters', 'kc', 'Marbled letter keychains'], ['k-pink', 'kc', 'Floral initial keychains'], ['r-keys-letters', 'kc', 'Floral-preserved letters'],
    ['fr-1', 'fr', 'Good times photo plate'], ['fr-2', 'fr', 'Anniversary frame'], ['fr-3', 'fr', 'Pressed-flower photo frame'], ['fr-4', 'fr', 'Couple’s floral frame'], ['fr-5', 'fr', 'Family portrait frame'], ['r-invite', 'fr', 'Wedding invite, preserved'], ['r-floral', 'fr', 'Names in preserved florals'],
    ['vm-1', 'fr', 'Varmala box frame'], ['vm-2', 'fr', 'Varmala memory keepsake'], ['vm-3', 'fr', 'Rose-petal wedding frame'], ['vm-4', 'fr', 'Illuminated monogram letters'],
    ['tb-1', 'tb', 'Midnight & gold side table'], ['tb-2', 'tb', 'Olive-wood ocean table'], ['tb-3', 'tb', 'Live-edge white resin table'], ['tb-4', 'tb', 'Flower-preserved table'], ['tb-5', 'tb', 'Walnut river table'], ['r-table', 'tb', 'Teal river table'],
    ['tr-1', 'tr', 'Black & gold tiered set'], ['tr-2', 'tr', 'Ocean-wave tray & coasters'], ['tr-3', 'tr', 'Crimson tray & coasters'], ['tr-4', 'tr', 'Noir & gold tray'], ['r-coasters', 'tr', 'Midnight-blue coasters'], ['x-tray', 'tr', 'Ivory coaster tray'],
    ['mn-1', 'mn', 'Mahamrityunjaya mantra'], ['mn-2', 'mn', 'Gayatri mantra panel'], ['mn-3', 'mn', 'Navkar mantra triptych'], ['mn-4', 'mn', 'Krishna mantra plate'], ['mn-5', 'mn', 'Ganesh on an easel'], ['mn-om', 'mn', 'Om & lotus panel'], ['mn-round', 'mn', 'Grand Navkar mantra'],
    ['hd-1', 'hd', 'Pen stand & Ganesh tray'], ['hd-2', 'hd', 'Gold-flake brush holder'], ['hd-3', 'hd', 'Card & pen holders'], ['hd-4', 'hd', 'Napkin & toothpick holder'], ['hd-5', 'hd', 'Floral card holder'],
    ['fl-1', 'fx', '3D flower panel'], ['fl-2', 'fx', 'Fuchsia 3D bloom'], ['fl-3', 'fx', 'Resin lotus panel'], ['mr-1', 'fx', 'Crystal ring mirror'], ['mr-2', 'fx', 'Geode mirror'], ['mr-3', 'fx', 'Blue geode mirror']
  ].map(function (a) { return { src: 'img/' + a[0] + '.webp', c: a[1], t: a[2] }; });
  // interleave categories for variety in "All"
  (function () {
    var by = {}; ITEMS.forEach(function (i) { (by[i.c] = by[i.c] || []).push(i); });
    var out = [], more = true, n = 0; while (more) { more = false; Object.keys(by).forEach(function (k) { if (by[k][n]) { out.push(by[k][n]); more = true; } }); n++; }
    ITEMS.length = 0; Array.prototype.push.apply(ITEMS, out);
  })();
  var chips = $('#chips'), mas = $('#masonry'), note = $('#catNote'), view = [], cur = 0;
  CATS.forEach(function (c, i) {
    var b = document.createElement('button'); b.className = 'chip'; b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === 0); b.textContent = c.t;
    b.onclick = function () { $$('.chip').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); show(c); }; chips.appendChild(b);
  });
  function show(c) {
    note.textContent = c.n; view = ITEMS.filter(function (i) { return c.k === 'all' || i.c === c.k; });
    mas.innerHTML = '';
    view.forEach(function (it, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'm-item'; b.style.setProperty('--i', Math.min(i, 24));
      b.innerHTML = '<img src="' + it.src + '" alt="' + it.t + '" loading="lazy" decoding="async"><span>' + it.t + '</span>';
      b.onclick = function () { openLb(i); }; mas.appendChild(b);
    });
  }
  show(CATS[0]);

  /* lightbox */
  var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
  function setLb(i) { cur = (i + view.length) % view.length; lbImg.src = view[cur].src; lbImg.alt = view[cur].t; lbCap.textContent = view[cur].t; }
  function openLb(i) { setLb(i); lb.hidden = false; document.body.style.overflow = 'hidden'; $('#lbX').focus(); }
  function closeLb() { lb.hidden = true; document.body.style.overflow = ''; }
  $('#lbX').onclick = closeLb; $('#lbP').onclick = function () { setLb(cur - 1); }; $('#lbN').onclick = function () { setLb(cur + 1); };
  lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
  addEventListener('keydown', function (e) { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') setLb(cur - 1); if (e.key === 'ArrowRight') setLb(cur + 1); });

  /* ── partner tabs ── */
  var PT = [
    { t: 'Resin art', p: 'Coasters · Clocks · Frames · Floral preservations · Keychains · Nameplates · Tables', l: [
      ['Interior designers', 'Customized resin nameplates, tables and wall décor'], ['Wedding planners', 'Preserved floral frames and gifting'], ['Boutique & home-décor stores', 'Displaying resin décor pieces'],
      ['Gift shops & return-gift vendors', 'Resin coasters and keychains'], ['Architects', 'Resin tables and artistic installations'], ['Event decorators', 'Themed décor pieces']] },
    { t: 'Candles', p: 'Bouquets · Florals · Festive · Gift boxes', l: [
      ['Corporate gifting companies & HR managers', 'Bulk gifting orders'], ['Wedding & event planners', 'Return gifts or table décor'], ['Boutique owners & lifestyle stores', 'Retail display'],
      ['Café & spa owners', 'Ambiance candles'], ['Influencers & event stylists', 'Collaborations and shoot setups'], ['Kitty-party organisers', 'Festive gifting ideas']] },
    { t: 'Handcasting', p: 'Hands · Feet · Couples · Families', l: [
      ['Maternity & baby photographers', 'Hand and feet casting'], ['Event planners', 'Anniversaries, baby showers or couple gifts'], ['Hospitals & maternity clinics', 'Tie-ups or memory keepsakes'],
      ['Gift stores', 'Unique keepsake gifting options'], ['Families & couples', 'Through referrals from friends or neighbours']] },
    { t: 'Workshops', p: 'Texture Art · Mosaic Art · Lippan Art', l: [
      ['Schools & colleges', 'Art workshops or activity sessions'], ['Corporate HR & event teams', 'Employee engagement sessions'], ['Societies & clubhouses', 'Weekend workshops'],
      ['Kitty-party organisers', 'Creative theme sessions'], ['Art-café owners', 'Hosting creative pop-ups'], ['Moms’ groups & community pages', 'Creative sessions for kids or adults']] }
  ];
  var pt = $('#ptabs'), pp = $('#ppanel');
  PT.forEach(function (x, i) {
    var b = document.createElement('button'); b.className = 'ptab'; b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i === 0); b.textContent = x.t;
    b.onclick = function () { $$('.ptab').forEach(function (z) { z.setAttribute('aria-selected', z === b); }); fill(x); }; pt.appendChild(b);
  });
  function fill(x) {
    pp.innerHTML = '<p class="prods"><b>' + (x.t === 'Workshops' ? 'Topics' : 'Products') + '</b>' + x.p + '</p>' +
      x.l.map(function (r, i) { return '<div class="pill" style="--i:' + i + '"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>'; }).join('');
  }
  fill(PT[0]);

  /* ── enquiry → WhatsApp ── */
  $('#enquiry').addEventListener('submit', function (e) {
    e.preventDefault(); var f = e.target;
    var t = 'Hi Divya! I’m ' + f.n.value + '.\nI’m interested in: ' + f.c.value + (f.o.value ? '\nOccasion: ' + f.o.value : '') + (f.m.value ? '\n\n' + f.m.value : '');
    var a = $('#enqLink'); a.href = 'https://wa.me/919867305432?text=' + encodeURIComponent(t); a.hidden = false; a.focus();
  });

  /* ── boot widgets ── */
  Mandala.init(); Pour.init(); Mosaic.init(); Studio.init(); Reels.init();
})();
