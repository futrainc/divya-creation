/* Resin pour — flow-field marbling on canvas */
(function () {
  var PAL = {
    ocean:   { name: 'Ocean',    base: '#eef4f6', cols: ['#0b3a63', '#1f7fa8', '#4fc3d9', '#ffffff', '#0d2a4a', '#7fd6e6'], flake: '#f3d98c' },
    rose:    { name: 'Rosé',     base: '#fbeef0', cols: ['#e98aa8', '#f4b8c5', '#c2185b', '#ffffff', '#f7d6a0', '#d9608a'], flake: '#e8c068' },
    emerald: { name: 'Emerald',  base: '#eef2ec', cols: ['#1e5b45', '#2f8f6b', '#b7d9c4', '#0f3b2c', '#ffffff', '#5bb38c'], flake: '#e2bd72' },
    midnight:{ name: 'Midnight', base: '#12141d', cols: ['#05060a', '#2a3150', '#e2bd72', '#ffffff', '#7d8cc0', '#1b2036'], flake: '#f1d58a' }
  };
  var cv, ctx, W, H, pal = 'ocean', flakes = true, parts = [], t = 0, running = false, seen = false, down = false, last = null, auto = null, hinted = false;

  function noise(x, y) {
    return (Math.sin(x * .0105 + t * .6) + Math.sin(y * .0122 - t * .45) + Math.sin((x + y) * .0069 + 1.3) + Math.sin(Math.hypot(x - W / 2, y - H / 2) * .012 - t * .3)) / 4;
  }
  function paintBase() { ctx.globalAlpha = 1; ctx.fillStyle = PAL[pal].base; ctx.fillRect(0, 0, W, H); parts.length = 0; }
  function spawn(x, y, n) {
    var cols = PAL[pal].cols;
    for (var i = 0; i < n; i++) {
      parts.push({ x: x + (Math.random() - .5) * 46, y: y + (Math.random() - .5) * 46, px: x, py: y,
        c: cols[(Math.random() * cols.length) | 0], w: 6 + Math.random() * 30, life: 160 + Math.random() * 220,
        s: .8 + Math.random() * 1.8 });
    }
    if (parts.length > 1400) parts.splice(0, parts.length - 1400);
  }
  function flake(x, y) {
    var s = 3 + Math.random() * 9, a = Math.random() * 6.28, n = 3 + ((Math.random() * 3) | 0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.globalAlpha = .92; ctx.fillStyle = PAL[pal].flake;
    ctx.beginPath();
    for (var i = 0; i < n; i++) { var aa = i / n * 6.28, rr = s * (.55 + Math.random() * .6); ctx[i ? 'lineTo' : 'moveTo'](Math.cos(aa) * rr, Math.sin(aa) * rr); }
    ctx.closePath(); ctx.fill(); ctx.globalAlpha = .5; ctx.strokeStyle = '#fff'; ctx.lineWidth = .6; ctx.stroke(); ctx.restore();
  }
  function pour(x, y) {
    spawn(x, y, 9);
    if (flakes && Math.random() < .55) flake(x + (Math.random() - .5) * 90, y + (Math.random() - .5) * 90);
  }
  function step() {
    t += .012;
    ctx.lineCap = 'round';
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      var a = noise(p.x, p.y) * 6.28 * 1.6;
      p.px = p.x; p.py = p.y;
      p.x += Math.cos(a) * p.s * 2.2; p.y += Math.sin(a) * p.s * 2.2;
      p.life--; p.w *= .992;
      ctx.globalAlpha = Math.min(.24, p.life / 520);
      ctx.strokeStyle = p.c; ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      if (p.life <= 0 || p.w < .6 || p.x < -40 || p.y < -40 || p.x > W + 40 || p.y > H + 40) parts.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    // cell-like thin highlights for depth
    if (parts.length && Math.random() < .5) {
      var q = parts[(Math.random() * parts.length) | 0];
      ctx.globalAlpha = .1; ctx.strokeStyle = pal === 'midnight' ? '#e2bd72' : '#fff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(q.x, q.y, 4 + Math.random() * 16, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
    }
  }
  function loop() {
    if (!seen) { running = false; return; }
    if (auto) { auto.i++; var k = auto.i / auto.n; pour(W * (.5 + .34 * Math.sin(k * 11 + auto.o)), H * (.5 + .34 * Math.cos(k * 8.3))); if (auto.i > auto.n) auto = null; }
    step(); requestAnimationFrame(loop);
  }
  function xy(e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; }
  function hideHint() { if (hinted) return; hinted = true; document.getElementById('pourHint').classList.add('gone'); }
  function setPal(k) {
    pal = k; paintBase();
    document.querySelectorAll('.sw').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.k === k); });
  }
  function init() {
    cv = document.getElementById('pour'); if (!cv) return;
    ctx = cv.getContext('2d'); W = cv.width; H = cv.height;
    var sw = document.getElementById('swatches');
    Object.keys(PAL).forEach(function (k) {
      var b = document.createElement('button'); b.className = 'sw'; b.type = 'button'; b.dataset.k = k; b.setAttribute('role', 'radio');
      b.setAttribute('aria-label', PAL[k].name); b.setAttribute('aria-checked', k === pal);
      var c = PAL[k].cols; b.style.background = 'conic-gradient(from 20deg,' + c.concat(c[0]).join(',') + ')';
      b.innerHTML = '<small>' + PAL[k].name + '</small>';
      b.onclick = function () { setPal(k); auto = { i: 0, n: 120, o: Math.random() * 6 }; };
      sw.appendChild(b);
    });
    paintBase();
    cv.addEventListener('pointerdown', function (e) { down = true; cv.setPointerCapture(e.pointerId); var p = xy(e); pour(p[0], p[1]); hideHint(); });
    cv.addEventListener('pointermove', function (e) { if (!down) return; var p = xy(e); pour(p[0], p[1]); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { cv.addEventListener(n, function () { down = false; }); });
    document.getElementById('pourAuto').onclick = function () { auto = { i: 0, n: 240, o: Math.random() * 6 }; hideHint(); };
    document.getElementById('pourClear').onclick = function () { paintBase(); };
    var fb = document.getElementById('pourFlakes');
    fb.onclick = function () { flakes = !flakes; fb.setAttribute('aria-pressed', flakes); fb.textContent = 'Gold flakes: ' + (flakes ? 'on' : 'off'); };
    var first = true;
    new IntersectionObserver(function (en) {
      seen = en[0].isIntersecting;
      if (seen && first) { first = false; auto = { i: 0, n: 170, o: 1.2 }; }
      if (seen && !running) { running = true; requestAnimationFrame(loop); }
    }, { threshold: .25 }).observe(cv);
  }
  window.Pour = { init: init };
})();
