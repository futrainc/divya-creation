/* Interactive mosaic: a photo cut into jittered triangular tesserae that scatter from the pointer and spring home. */
(function () {
  var SRC = [
    { k: 'm-dove', alt: 'Dove mosaic' }, { k: 'm-yin', alt: 'Yin-yang mosaic' },
    { k: 'm-mandala', alt: 'Mandala mosaic' }, { k: 'm-tulip', alt: 'Tulip mosaic' }
  ];
  var cv, ctx, S, tiles = [], base, cache = {}, mx = -999, my = -999, inside = false, seen = false, running = false, cur = 0, R = 95;
  var COLS = 13;

  function loadImg(k, cb) {
    if (cache[k]) return cb(cache[k]);
    var im = new Image(); im.onload = function () { cache[k] = im; cb(im); }; im.src = 'img/' + k + '.webp';
  }
  function makeBase(im) {
    base = document.createElement('canvas'); base.width = base.height = S;
    var b = base.getContext('2d'), s = Math.min(im.width, im.height);
    b.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, S, S);
  }
  function build() {
    tiles = []; var g = S / COLS, pts = [];
    for (var y = 0; y <= COLS; y++) { pts[y] = []; for (var x = 0; x <= COLS; x++) {
      var edge = x === 0 || y === 0 || x === COLS || y === COLS;
      pts[y][x] = [x * g + (edge ? 0 : (Math.random() - .5) * g * .55), y * g + (edge ? 0 : (Math.random() - .5) * g * .55)];
    } }
    for (var j = 0; j < COLS; j++) for (var i = 0; i < COLS; i++) {
      var a = pts[j][i], b = pts[j][i + 1], c = pts[j + 1][i + 1], d = pts[j + 1][i];
      var flip = Math.random() < .5;
      [flip ? [a, b, d] : [a, b, c], flip ? [b, c, d] : [a, c, d]].forEach(function (tri) {
        tiles.push({ p: tri, cx: (tri[0][0] + tri[1][0] + tri[2][0]) / 3, cy: (tri[0][1] + tri[1][1] + tri[2][1]) / 3, ox: 0, oy: 0, vx: 0, vy: 0, r: 0, vr: 0, delay: 0 });
      });
    }
  }
  function shatter(strength) {
    tiles.forEach(function (t) {
      var a = Math.random() * 6.28, d = (strength || 1) * (180 + Math.random() * 520);
      t.ox = Math.cos(a) * d; t.oy = Math.sin(a) * d - 120; t.r = (Math.random() - .5) * 8; t.vx = t.vy = t.vr = 0;
      t.delay = Math.random() * 60 + (t.cy / S) * 50;
    });
    wake();
  }
  function draw() {
    ctx.fillStyle = '#cdc3b1'; ctx.fillRect(0, 0, S, S);
    var energy = 0;
    for (var n = 0; n < tiles.length; n++) {
      var t = tiles[n];
      if (t.delay > 0) { t.delay--; } else {
        var dx = t.cx + t.ox - mx, dy = t.cy + t.oy - my, d = Math.hypot(dx, dy);
        if (inside && d < R) { var f = (1 - d / R) * 5.2; t.vx += dx / (d + .1) * f; t.vy += dy / (d + .1) * f; t.vr += (Math.random() - .5) * .08 * f; }
        t.vx += -t.ox * .035; t.vy += -t.oy * .035; t.vr += -t.r * .04;
        t.vx *= .86; t.vy *= .86; t.vr *= .86;
        t.ox += t.vx; t.oy += t.vy; t.r += t.vr;
      }
      energy += Math.abs(t.ox) + Math.abs(t.oy) + Math.abs(t.r) * 40 + t.delay;
      ctx.save();
      ctx.translate(t.cx + t.ox, t.cy + t.oy); ctx.rotate(t.r); ctx.scale(.965, .965); ctx.translate(-t.cx, -t.cy);
      ctx.beginPath(); ctx.moveTo(t.p[0][0], t.p[0][1]); ctx.lineTo(t.p[1][0], t.p[1][1]); ctx.lineTo(t.p[2][0], t.p[2][1]); ctx.closePath();
      ctx.clip(); ctx.drawImage(base, 0, 0);
      ctx.restore();
      if (Math.abs(t.ox) + Math.abs(t.oy) > 6) { // soft shadow while airborne
        ctx.save(); ctx.translate(t.cx + t.ox + 4, t.cy + t.oy + 6); ctx.rotate(t.r); ctx.translate(-t.cx, -t.cy); ctx.globalAlpha = .12; ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.moveTo(t.p[0][0], t.p[0][1]); ctx.lineTo(t.p[1][0], t.p[1][1]); ctx.lineTo(t.p[2][0], t.p[2][1]); ctx.fill(); ctx.restore();
      }
    }
    if (inside) { // trowel ring
      ctx.beginPath(); ctx.arc(mx, my, R, 0, 6.28); ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.setLineDash([2, 9]); ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]);
    }
    return energy;
  }
  function wake() { if (!running && seen) { running = true; requestAnimationFrame(loop); } }
  function loop() {
    if (!seen) { running = false; return; }
    var e = draw();
    if (e < 60 && !inside) { running = false; return; }
    requestAnimationFrame(loop);
  }
  function select(i, shat) {
    cur = i;
    document.querySelectorAll('#tessPick button').forEach(function (b, n) { b.setAttribute('aria-pressed', n === i); });
    loadImg(SRC[i].k, function (im) { makeBase(im); build(); if (shat !== false) shatter(1); else draw(); });
  }
  function init() {
    cv = document.getElementById('tess'); if (!cv) return;
    ctx = cv.getContext('2d'); S = cv.width; R = S * .13;
    var pick = document.getElementById('tessPick');
    SRC.forEach(function (s, i) {
      var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', s.alt); b.setAttribute('aria-pressed', i === 0);
      b.innerHTML = '<img src="img/' + s.k + '.webp" alt="" loading="lazy">'; b.onclick = function () { select(i); }; pick.appendChild(b);
    });
    function pos(e) { var r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * S; my = (e.clientY - r.top) / r.height * S; }
    cv.addEventListener('pointermove', function (e) { pos(e); inside = true; wake(); });
    cv.addEventListener('pointerdown', function (e) { pos(e); inside = true; wake(); });
    cv.addEventListener('pointerleave', function () { inside = false; mx = my = -999; wake(); });
    document.getElementById('tessReplay').onclick = function () { shatter(1.2); };
    var first = true;
    loadImg(SRC[0].k, function (im) { makeBase(im); build(); draw(); });
    new IntersectionObserver(function (en) {
      seen = en[0].isIntersecting;
      if (seen && first && tiles.length) { first = false; shatter(1); }
      else if (seen) wake();
    }, { threshold: .35 }).observe(cv);
  }
  window.Mosaic = { init: init };
})();
