/* Instagram reel rail — real posts come from data/instagram.json; studio stills are shown until it has entries. */
(function () {
  var FALLBACK = [
    ['tr-2', 'Ocean-wave tray & coasters', 'Resin pour'], ['c-bouquet', 'Candle bouquets', 'Candle craft'],
    ['np-4', 'Radha Krishna name plate', 'Resin art'], ['th-3', 'Ganpati pooja thali', 'Festive'],
    ['h-frame', 'Handcast keepsake', 'Handcasting'], ['m-mandala', 'Mosaic mandala', 'Mosaic'],
    ['x-glass', 'Wine-glass candle', 'Candle craft'], ['cl-5', 'Emerald ocean clock', 'Resin art'],
    ['f-modak-puja', 'Festive modak candles', 'Festive'], ['x-event', 'Workshop day', 'Workshops']
  ];
  var posts = [], player = false, rail, cards = [], profile = 'https://www.instagram.com/divyascreationn/';
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ago(iso) {
    var t = Date.parse(String(iso || '').replace(/([+-]\d\d)(\d\d)$/, '$1:$2')); if (!t) return '';
    var d = Math.floor((Date.now() - t) / 864e5);
    return d < 1 ? 'Today' : d === 1 ? 'Yesterday' : d < 14 ? d + ' days ago' : d < 60 ? Math.round(d / 7) + ' weeks ago' : new Date(t).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }
  function code(u) { var m = /instagram\.com\/(?:[\w.]+\/)?(reel|reels|p|tv)\/([\w-]+)/i.exec(u || ''); return m ? { kind: m[1].toLowerCase() === 'p' ? 'p' : m[1].toLowerCase() === 'tv' ? 'tv' : 'reel', id: m[2] } : null; }
  function card(p) {
    var a = document.createElement('a'); a.className = 'reel'; a.href = p.url || profile; a.target = '_blank'; a.rel = 'noopener'; a.draggable = false;
    a.setAttribute('aria-label', (p.cap || 'Reel') + (player && code(p.url) ? ' — play' : ' — watch on Instagram'));
    if (!p.thumb) a.classList.add('noimg', 'v' + ((p.n || 0) % 4));
    a.innerHTML = (p.thumb ? '<img src="' + esc(p.thumb) + '" alt="" loading="lazy" draggable="false" referrerpolicy="no-referrer">' : '<svg class="poster" viewBox="0 0 240 210" aria-hidden="true"><use href="#butterfly"/></svg>') + '<span class="tag">' + esc(p.tag || 'Reel') + '</span><span class="pbtn"><i></i></span><div class="cap"><b>' + esc(p.cap || '') + '</b><span>' + (p.date ? esc(ago(p.date)) + ' · ' : '') + (player && code(p.url) ? 'Play reel ▶' : 'Watch on Instagram ↗') + '</span></div>';
    return a;
  }
  function fx() {
    var r = rail.getBoundingClientRect(), mid = r.left + r.width / 2;
    cards.forEach(function (c) {
      var b = c.getBoundingClientRect(), d = (b.left + b.width / 2 - mid) / b.width, ad = Math.min(Math.abs(d), 3);
      c.style.setProperty('--ry', (-d * 16).toFixed(1) + 'deg'); c.style.setProperty('--sc', (1 - ad * .07).toFixed(3)); c.style.setProperty('--op', (1 - ad * .16).toFixed(2));
    });
  }
  function step(dir) { var w = cards[0] ? cards[0].offsetWidth + 22 : 300; rail.scrollBy({ left: dir * w, behavior: 'smooth' }); }
  function fromFeed(f) {
    var items = (f && (f.posts || f.data || f.items)) || (Array.isArray(f) ? f : []);
    var vids = items.filter(function (m) { return /video|reel/i.test(m.mediaType || m.media_type || '') || m.isReel; });
    var pick = (vids.length ? vids : items).slice(0, 12);
    return pick.map(function (m, i) {
      var sz = m.sizes || {}, thumb = m.thumbnailUrl || m.thumbnail_url || (sz.medium && sz.medium.mediaUrl) || (sz.small && sz.small.mediaUrl) || (/video/i.test(m.mediaType || '') ? '' : m.mediaUrl) || '';
      var cap = String(m.prunedCaption || m.caption || '').split('\n').map(function (s) { return s.trim(); }).filter(Boolean)[0] || '';
      cap = cap.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s{2,}/g, ' ').trim();
      if (cap.length > 64) cap = cap.slice(0, 61).trimEnd() + '…';
      return { url: m.permalink || m.url, thumb: thumb, cap: cap || 'New on Instagram', tag: /video|reel/i.test(m.mediaType || '') ? 'Reel' : 'Post', date: m.timestamp || m.date, n: i + 1 };
    }).filter(function (p) { return p.url; });
  }
  function parseTxt(t) {
    var out = []; String(t).split(/\r?\n/).forEach(function (l) {
      l = l.trim(); if (!l || l[0] === '#') return;
      var parts = l.split('|'), url = parts[0].trim(); if (!code(url)) return;
      var n = out.length + 1; out.push({ url: url, cap: (parts[1] || '').trim() || 'Reel ' + (n < 10 ? '0' + n : n), tag: 'Reel', n: n });
    }); return out.slice(0, 12);
  }
  function build(list, real, updated) {
    posts = list; rail.innerHTML = ''; cards = list.map(function (p) { var c = card(p); rail.appendChild(c); return c; });
    document.getElementById('reelNote').textContent = real ? 'Latest videos from @divyascreationn' + (updated ? ' · synced ' + new Date(updated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '') + '.' : 'Studio stills shown here — every frame opens the reels on Instagram.';
    var mid = cards[Math.floor(cards.length / 3)]; if (mid) rail.scrollLeft = mid.offsetLeft - (rail.clientWidth - mid.offsetWidth) / 2;
    fx();
  }
  function init() {
    rail = document.getElementById('reelRail'); if (!rail) return;
    initTheater();
    var fb = FALLBACK.map(function (f) { return { thumb: 'img/' + f[0] + '.webp', cap: f[1], tag: f[2] }; });
    build(fb, false);
    function load(u, asJson) { return fetch(u, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw 0; return asJson ? r.json() : r.text(); }).catch(function () { return null; }); }
    Promise.all([load('data/instagram.json', true), load('data/reels.txt', false)]).then(function (res) {
      var j = res[0] || {}, txt = res[1] || '';
      player = j.player === true;
      if (j.profile) { profile = j.profile; document.getElementById('igFollow').href = j.profile; }
      var manual = parseTxt(txt);
      if (j.posts && j.posts.length) { build(j.posts.map(function (p) { return { url: p.url, thumb: p.thumb, cap: p.caption, tag: p.type || 'Reel', date: p.date }; }), true, j.updated); return; }
      var fallback = function () {
        if (manual.length) { build(manual, true); document.getElementById('reelNote').textContent = player ? 'Tap a reel to play it here — straight from @divyascreationn.' : 'Tap a reel to watch it on Instagram.'; }
        else build(fb, false);
      };
      if (j.feed) {
        fetch(j.feed).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (f) {
          var live = fromFeed(f);
          if (live.length) { build(live, true); document.getElementById('reelNote').textContent = 'Latest from @divyascreationn — updates automatically.'; } else fallback();
        }).catch(fallback);
      } else fallback();
    });
    var ticking = false; rail.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { fx(); ticking = false; }); } }, { passive: true });
    addEventListener('resize', fx);
    document.getElementById('reelPrev').onclick = function () { step(-1); }; document.getElementById('reelNext').onclick = function () { step(1); };
    rail.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
    // mouse drag to scroll (links still click when not dragged)
    var down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    addEventListener('pointermove', function (e) { if (!down) return; var d = e.clientX - sx; if (Math.abs(d) > 5) { moved = true; rail.classList.add('drag'); } rail.scrollLeft = sl - d; });
    addEventListener('pointerup', function () { if (!down) return; down = false; setTimeout(function () { rail.classList.remove('drag'); }, 0); });
    rail.addEventListener('click', function (e) {
      if (moved) { e.preventDefault(); moved = false; return; }
      var c = e.target.closest && e.target.closest('.reel'); if (!c) return;
      var i = cards.indexOf(c); if (player && i > -1 && code(posts[i].url)) { e.preventDefault(); openTheater(i); }
    }, true);
    // gentle auto-drift while idle and visible
    var seen = false, idle = true, t0 = 0;
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; }).observe(rail);
    ['pointerenter', 'focusin', 'touchstart'].forEach(function (n) { rail.addEventListener(n, function () { idle = false; }); });
    ['pointerleave', 'focusout'].forEach(function (n) { rail.addEventListener(n, function () { idle = true; }); });
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) setInterval(function () { if (seen && idle && !down) { if (rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4) rail.scrollTo({ left: 0, behavior: 'smooth' }); else step(1); } }, 3200);
  }
  /* ── Instagram embed theater (player loads only after a tap) ── */
  var th, frame, cur = 0, failTimer, lastFocus;
  function playable(i, dir) { var n = posts.length; for (var k = 0; k < n; k++) { i = (i + dir + n) % n; if (code(posts[i].url)) return i; } return cur; }
  function show(i) {
    cur = i; var p = posts[i], c = code(p.url);
    document.getElementById('thCap').textContent = p.cap || 'Reel';
    document.getElementById('thOpen').href = p.url;
    document.getElementById('thFail').hidden = true; document.getElementById('thLoad').style.display = '';
    clearTimeout(failTimer);
    frame.onload = function () { clearTimeout(failTimer); document.getElementById('thLoad').style.display = 'none'; };
    failTimer = setTimeout(function () { document.getElementById('thFail').hidden = false; document.getElementById('thLoad').style.display = 'none'; }, 7000);
    frame.src = 'https://www.instagram.com/' + c.kind + '/' + c.id + '/embed/';
    var multi = posts.filter(function (x) { return code(x.url); }).length > 1;
    document.getElementById('thP').hidden = document.getElementById('thN').hidden = !multi;
  }
  function openTheater(i) {
    lastFocus = document.activeElement; th.hidden = false; document.body.style.overflow = 'hidden'; show(i); document.getElementById('thX').focus();
  }
  function closeTheater() {
    th.hidden = true; clearTimeout(failTimer); frame.onload = null; frame.src = 'about:blank'; document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function initTheater() {
    th = document.getElementById('theater'); frame = document.getElementById('thFrame'); if (!th) return;
    document.getElementById('thX').onclick = closeTheater;
    document.getElementById('thP').onclick = function () { show(playable(cur, -1)); };
    document.getElementById('thN').onclick = function () { show(playable(cur, 1)); };
    th.addEventListener('click', function (e) { if (e.target === th) closeTheater(); });
    addEventListener('keydown', function (e) {
      if (th.hidden) return;
      if (e.key === 'Escape') closeTheater(); else if (e.key === 'ArrowLeft') show(playable(cur, -1)); else if (e.key === 'ArrowRight') show(playable(cur, 1));
    });
  }
  window.Reels = { init: init };
})();
