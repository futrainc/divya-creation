/* Live resin name-plate designer */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var FONTS = {
    script:  { label: 'Script',      css: "'Great Vibes', cursive", w: 400, k: 2.3, y2: 0 },
    classic: { label: 'Classic',     css: "'Cormorant Garamond', serif", w: 600, italic: true, k: 2.0 },
    deva:    { label: 'देवनागरी',     css: "'Tiro Devanagari Hindi', serif", w: 400, k: 1.6 },
    modern:  { label: 'Modern',      css: "'DM Sans', sans-serif", w: 700, k: 1.5, ls: 3 }
  };
  var FIN = {
    marble:  { label: 'Marble',   a: '#fbf8f2', b: '#e6dac7', vein: [.78, .66, .5],  sw: '#f3ebdd' },
    ocean:   { label: 'Ocean',    a: '#33b0cf', b: '#0a3c66', vein: [1, 1, 1],       sw: '#1f7fa8' },
    rose:    { label: 'Rosé',     a: '#fad3dc', b: '#e68aa6', vein: [1, 1, 1],       sw: '#f1a2b8' },
    emerald: { label: 'Emerald',  a: '#2f8a69', b: '#0e3b2c', vein: [.89, .74, .45], sw: '#1e5b45' },
    midnight:{ label: 'Midnight', a: '#222942', b: '#07080d', vein: [.89, .74, .45], sw: '#12141d' }
  };
  var SHAPES = { oval: 'Oval', rect: 'Plaque', circle: 'Round', arch: 'Arch', scallop: 'Scalloped' };
  var st = { font: 'script', fin: 'marble', shape: 'oval', stones: true }, svg;

  function shapeD(k) {
    if (k === 'oval') return 'M30,220 a290,190 0 1,0 580,0 a290,190 0 1,0 -580,0Z';
    if (k === 'rect') return 'M66,50 H574 a36,36 0 0 1 36,36 V354 a36,36 0 0 1 -36,36 H66 a36,36 0 0 1 -36,-36 V86 a36,36 0 0 1 36,-36Z';
    if (k === 'circle') return 'M120,220 a200,200 0 1,0 400,0 a200,200 0 1,0 -400,0Z';
    if (k === 'arch') return 'M130,412 V222 A190,190 0 0 1 510,222 V412 Z';
    var d = ''; for (var i = 0; i <= 360; i += 2) { var a = i * Math.PI / 180, m = 1 + .03 * Math.cos(a * 20); d += (i ? 'L' : 'M') + (320 + Math.cos(a) * 292 * m).toFixed(1) + ',' + (220 + Math.sin(a) * 192 * m).toFixed(1); } return d + 'Z';
  }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function render() {
    var f = FIN[st.fin], fo = FONTS[st.font], d = shapeD(st.shape);
    var name = document.getElementById('tName').value.trim(), sub = document.getElementById('tSub').value.trim();
    var v = f.vein, r = rng(7), stones = '';
    if (st.stones) {
      var corners = st.shape === 'arch' ? [[165, 396], [475, 396], [190, 130]] : [[88, 78], [552, 362], [82, 340]];
      corners.forEach(function (c, ci) {
        for (var i = 0; i < 46; i++) {
          var a = r() * 6.28, rr = Math.pow(r(), .8) * (ci === 2 ? 52 : 74), x = c[0] + Math.cos(a) * rr, y = c[1] + Math.sin(a) * rr, s = 3 + r() * 8.5;
          var pts = '', nv = 5 + ((r() * 2) | 0); for (var q = 0; q < nv; q++) { var qa = q / nv * 6.28 + r() * .6, qr = s * (.65 + r() * .5); pts += (x + Math.cos(qa) * qr).toFixed(1) + ',' + (y + Math.sin(qa) * qr * .8).toFixed(1) + ' '; }
          stones += '<polygon points="' + pts + '" fill="url(#stone)" stroke="#8a6418" stroke-width=".5" opacity=".96"/>';
        }
      });
    }
    var two = !!sub, ty1 = two ? 212 : 238;
    var fam = fo.css.replace(/"/g, "'"), fs1 = 96;
    var tx = function (y, size, txt, extra) {
      var common = 'text-anchor="middle" x="320" font-family="' + fam + '" font-weight="' + fo.w + '" ' + (fo.italic ? 'font-style="italic" ' : '') + (fo.ls ? 'letter-spacing="' + fo.ls + '" ' : '') + 'font-size="' + size + '" ' + (extra || '');
      return '<text ' + common + ' y="' + (y + 4) + '" fill="#7a5714" opacity=".9" class="t3d">' + esc(txt) + '</text>' +
             '<text ' + common + ' y="' + y + '" fill="url(#gold)" stroke="#8a6418" stroke-width=".7" class="tfit" filter="url(#sh)">' + esc(txt) + '</text>';
    };
    svg.innerHTML =
      '<defs>' +
      '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + f.a + '"/><stop offset="1" stop-color="' + f.b + '"/></linearGradient>' +
      '<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#e2b955"/><stop offset=".55" stop-color="#b98a2b"/><stop offset="1" stop-color="#f1d27a"/></linearGradient>' +
      '<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".5" stop-color="#b98a2b"/><stop offset="1" stop-color="#f6dc8a"/></linearGradient>' +
      '<radialGradient id="stone" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6d0"/><stop offset=".6" stop-color="#d9b25a"/><stop offset="1" stop-color="#9a722a"/></radialGradient>' +
      '<filter id="veins" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency=".007 .02" numOctaves="3" seed="' + (st.fin.length * 3 + 2) + '"/>' +
      '<feColorMatrix type="matrix" values="0 0 0 0 ' + v[0] + '  0 0 0 0 ' + v[1] + '  0 0 0 0 ' + v[2] + '  -7.5 0 0 0 1.15"/></filter>' +
      '<filter id="sh" x="-10%" y="-20%" width="120%" height="150%"><feDropShadow dx="0" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity=".4"/></filter>' +
      '<clipPath id="shp"><path d="' + d + '"/></clipPath>' +
      '<linearGradient id="gloss" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>' +
      '</defs>' +
      '<path d="' + d + '" fill="rgba(0,0,0,.35)" transform="translate(0 14)" filter="blur(4px)"/>' +
      '<g clip-path="url(#shp)"><rect width="640" height="440" fill="url(#bg)"/><rect width="640" height="440" filter="url(#veins)" opacity=".85"/>' + stones + '<rect width="640" height="440" fill="url(#gloss)"/></g>' +
      '<path d="' + d + '" fill="none" stroke="url(#rim)" stroke-width="7"/><path d="' + d + '" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1" transform="translate(0 -.5)"/>' +
      (name ? tx(ty1, fs1, name) : '') + (sub ? tx(ty1 + 92, 52, sub, 'data-sub="1"') : '');
    fit();
  }
  function fit() {
    var max = st.shape === 'circle' ? 330 : st.shape === 'arch' ? 300 : st.shape === 'oval' || st.shape === 'scallop' ? 410 : 480;
    var pairs = svg.querySelectorAll('text');
    for (var i = 0; i < pairs.length; i += 2) {
      var a = pairs[i], b = pairs[i + 1]; if (!b) continue;
      var fs = parseFloat(b.getAttribute('font-size'));
      try { var w = b.getComputedTextLength(); if (w > max) { fs = fs * max / w; a.setAttribute('font-size', fs.toFixed(1)); b.setAttribute('font-size', fs.toFixed(1)); } } catch (e) {}
    }
  }
  function msg() {
    var n = document.getElementById('tName').value.trim(), s = document.getElementById('tSub').value.trim();
    var t = "Hi Divya! I'd love a custom resin name plate.\n\nLine one: " + (n || '—') + "\nLine two: " + (s || '—') +
      "\nLettering: " + FONTS[st.font].label + "\nFinish: " + FIN[st.fin].label + "\nShape: " + SHAPES[st.shape] +
      "\nCrushed-stone corners: " + (st.stones ? 'yes' : 'no') + "\n\nPlease share size options & pricing. Thank you!";
    document.getElementById('plateSend').href = 'https://wa.me/919867305432?text=' + encodeURIComponent(t);
  }
  function group(id, map, key, sw) {
    var box = document.getElementById(id);
    Object.keys(map).forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'opt'; b.dataset.k = k;
      var lab = typeof map[k] === 'string' ? map[k] : map[k].label;
      b.innerHTML = (sw ? '<i style="background:' + map[k].sw + '"></i>' : '') + '<span' + (key === 'font' ? ' style="font-family:' + FONTS[k].css.replace(/"/g, "'") + '"' : '') + '>' + lab + '</span>';
      b.setAttribute('aria-pressed', st[key] === k);
      b.onclick = function () { st[key] = k; box.querySelectorAll('.opt').forEach(function (o) { o.setAttribute('aria-pressed', o.dataset.k === k); }); render(); msg(); };
      box.appendChild(b);
    });
  }
  function init() {
    svg = document.getElementById('plate'); if (!svg) return;
    group('oFont', FONTS, 'font'); group('oFinish', FIN, 'fin', true); group('oShape', SHAPES, 'shape');
    ['tName', 'tSub'].forEach(function (id) { document.getElementById(id).addEventListener('input', function () { render(); msg(); }); });
    document.getElementById('tStones').addEventListener('change', function (e) { st.stones = e.target.checked; render(); });
    document.getElementById('plateForm').addEventListener('submit', function (e) { e.preventDefault(); });
    render(); msg();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(); });
  }
  window.Studio = { init: init };
})();
