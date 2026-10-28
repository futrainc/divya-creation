/* Generative lippan-style mandala (SVG). Used as ornament + a draggable one. */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function petal(r, l, w) {
    return 'M0,' + (-r) + ' C' + w + ',' + (-r - l * .25) + ' ' + w + ',' + (-r - l * .8) + ' 0,' + (-r - l) +
      ' C' + (-w) + ',' + (-r - l * .8) + ' ' + (-w) + ',' + (-r - l * .25) + ' 0,' + (-r) + 'Z';
  }
  function ring(g, n, r, l, w, attrs, off) {
    for (var i = 0; i < n; i++) {
      var a = (360 / n) * i + (off || 0);
      var a2 = {}; for (var k in attrs) a2[k] = attrs[k];
      a2.d = petal(r, l, w); a2.transform = 'rotate(' + a + ')';
      el('path', a2, g);
    }
  }
  function dots(g, n, r, rad, attrs, off) {
    for (var i = 0; i < n; i++) {
      var a = ((360 / n) * i + (off || 0)) * Math.PI / 180;
      var a2 = { cx: Math.sin(a) * r, cy: -Math.cos(a) * r, r: rad }; for (var k in attrs) a2[k] = attrs[k];
      el('circle', a2, g);
    }
  }
  function build(svg, mode) {
    var g = el('g', { 'class': 'mg' }, svg);
    if (mode === 'lg') {
      var pink = '#e0267f', teal = '#1f9fb3', yel = '#f2c14e', cream = '#fff6ea';
      el('circle', { r: 98, fill: 'none', stroke: cream, 'stroke-width': 2.4, opacity: .8 }, g);
      el('circle', { r: 94, fill: 'none', stroke: teal, 'stroke-width': 5, opacity: .9 }, g);
      dots(g, 48, 89, 1.3, { fill: cream }, 0);
      ring(g, 16, 66, 22, 9, { fill: pink, stroke: cream, 'stroke-width': 1.6 }, 0);
      dots(g, 16, 76, 1.6, { fill: cream }, 11.25);
      ring(g, 16, 46, 18, 7, { fill: '#f6a6b9', stroke: cream, 'stroke-width': 1.4 }, 11.25);
      el('circle', { r: 46, fill: 'none', stroke: yel, 'stroke-width': 3, 'stroke-dasharray': '1 4.2', 'stroke-linecap': 'round' }, g);
      ring(g, 12, 28, 16, 6, { fill: pink, stroke: cream, 'stroke-width': 1.3 }, 0);
      el('circle', { r: 26, fill: teal, stroke: cream, 'stroke-width': 2 }, g);
      dots(g, 12, 18.5, 2.2, { fill: cream }, 0);
      el('circle', { r: 10, fill: yel, stroke: cream, 'stroke-width': 1.6 }, g);
      el('circle', { r: 3.6, fill: '#c9d3d8' }, g);
    } else {
      var s = { fill: 'none', stroke: 'currentColor', 'stroke-width': .9 };
      el('circle', { r: 97, fill: 'none', stroke: 'currentColor', 'stroke-width': .8, opacity: .7 }, g);
      dots(g, 60, 92, .9, { fill: 'currentColor' }, 0);
      ring(g, 24, 70, 20, 8, s, 0);
      ring(g, 24, 54, 16, 6, s, 7.5);
      ring(g, 12, 36, 18, 8, s, 0);
      ring(g, 12, 22, 12, 5, s, 15);
      el('circle', { r: 7, fill: 'currentColor', opacity: .85 }, g);
    }
    return g;
  }
  function drag(svg, g) {
    var ang = 0, vel = .06, down = false, last = 0, lastT = 0, running = false, seen = true;
    function center() { var r = svg.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
    function pa(e) { var c = center(); return Math.atan2(e.clientY - c.y, e.clientX - c.x) * 180 / Math.PI; }
    svg.addEventListener('pointerdown', function (e) { down = true; last = pa(e); lastT = performance.now(); svg.setPointerCapture(e.pointerId); svg.style.cursor = 'grabbing'; });
    svg.addEventListener('pointermove', function (e) {
      if (!down) return; var a = pa(e), d = a - last; if (d > 180) d -= 360; if (d < -180) d += 360;
      var t = performance.now(); vel = d / Math.max(8, t - lastT) * 16; ang += d; last = a; lastT = t;
    });
    function up() { down = false; svg.style.cursor = 'grab'; }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    new IntersectionObserver(function (en) { seen = en[0].isIntersecting; if (seen && !running) loop(); }).observe(svg);
    function loop() {
      running = true;
      if (!down) { ang += vel; vel += (.06 - vel) * .02; }
      g.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ')');
      if (seen) requestAnimationFrame(loop); else running = false;
    }
  }
  window.Mandala = {
    init: function () {
      document.querySelectorAll('[data-mandala]').forEach(function (svg) {
        var mode = svg.getAttribute('data-mandala'); var g = build(svg, mode);
        if (mode === 'lg') drag(svg, g);
      });
    }
  };
})();
