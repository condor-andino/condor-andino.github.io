// Zamuro signature, "vigil" variant: the mark waits at the foot of the page
// and appears only once the reader arrives there.
(function () {
  var mark = document.querySelector('.vigil-mark');
  var footer = document.getElementById('site-footer');
  if (!mark || !footer) return;

  if (!('IntersectionObserver' in window)) {
    mark.classList.add('visible');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        mark.classList.add('visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.3 });

  io.observe(footer);
})();

// Constellation: an abstract force-directed map of relations. No labels, no
// data — clusters, hubs and bridges generated from a fixed seed so the map
// is the same on every visit. Exactly one sienna point: the best-connected.
(function () {
  var canvas = document.querySelector('.constellation-canvas');
  if (!canvas || !canvas.getContext) return;

  var ctx = canvas.getContext('2d');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20260703);

  var palette = {};
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    palette.ink = (cs.getPropertyValue('--ink') || '#2E2B28').trim();
    palette.warm = (cs.getPropertyValue('--warm-ink') || '#715A5A').trim();
    palette.line = (cs.getPropertyValue('--rule') || '#D9D2C4').trim();
    palette.sienna = (cs.getPropertyValue('--sienna') || '#8B3A2F').trim();
  }
  function rgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  var CLUSTERS = 4;
  var COUNT = Math.min(window.innerWidth, 1200) < 640 ? 58 : 96;
  var nodes = [], links = [], centers = [];

  (function build() {
    var members = [], c, i;
    for (c = 0; c < CLUSTERS; c++) members.push([]);
    for (i = 0; i < COUNT; i++) {
      c = Math.floor(rand() * CLUSTERS);
      nodes.push({ cluster: c, x: 0, y: 0, vx: 0, vy: 0, deg: 0, warm: rand() < 0.26 });
      members[c].push(i);
    }
    function connect(a, b, rest) {
      if (a === b) return;
      links.push({ a: a, b: b, rest: rest });
      nodes[a].deg++; nodes[b].deg++;
    }
    members.forEach(function (m) {
      // spanning tree biased toward early members, so hubs emerge
      for (var k = 1; k < m.length; k++) {
        connect(m[k], m[Math.floor(Math.pow(rand(), 2.2) * k)], 34 + rand() * 26);
      }
      var extras = Math.floor(m.length * 0.45);
      for (var e = 0; e < extras; e++) {
        connect(m[Math.floor(rand() * m.length)],
                m[Math.floor(Math.pow(rand(), 2) * m.length)], 40 + rand() * 30);
      }
    });
    for (var q = 0; q < 6; q++) {
      var ca = Math.floor(rand() * CLUSTERS);
      var cb = (ca + 1 + Math.floor(rand() * (CLUSTERS - 1))) % CLUSTERS;
      if (!members[ca].length || !members[cb].length) continue;
      connect(members[ca][Math.floor(rand() * members[ca].length)],
              members[cb][Math.floor(rand() * members[cb].length)], 130);
    }
    var top = 0;
    nodes.forEach(function (n, idx) { if (n.deg > nodes[top].deg) top = idx; });
    nodes[top].anchor = true;
    nodes.forEach(function (n) { n.r = 2.2 + Math.min(5, n.deg * 0.55); });
    nodes[top].r += 1.5;
  })();

  var adjacency = nodes.map(function () { return []; });
  links.forEach(function (l) {
    adjacency[l.a].push(l.b);
    adjacency[l.b].push(l.a);
  });

  var width = 0, height = 0, placed = false;
  var alpha = 0, raf = null, visible = true;
  var hovered = -1, dragged = null;

  function layoutCenters() {
    centers.length = 0;
    var rx = width * 0.24, ry = height * 0.24;
    for (var c = 0; c < CLUSTERS; c++) {
      var ang = (c / CLUSTERS) * Math.PI * 2 + 0.6;
      centers.push({
        x: width / 2 + Math.cos(ang) * rx,
        y: height / 2 + Math.sin(ang) * ry
      });
    }
  }

  function tick(a) {
    var i, j, n, m;
    for (i = 0; i < COUNT; i++) {
      n = nodes[i];
      for (j = i + 1; j < COUNT; j++) {
        m = nodes[j];
        var dx = m.x - n.x, dy = m.y - n.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > 22500 || !d2) continue;
        var d = Math.sqrt(d2);
        var f = (a * 640) / d2;
        n.vx -= dx / d * f; n.vy -= dy / d * f;
        m.vx += dx / d * f; m.vy += dy / d * f;
      }
      var c = centers[n.cluster];
      n.vx += (c.x - n.x) * 0.012 * a;
      n.vy += (c.y - n.y) * 0.012 * a;
    }
    links.forEach(function (l) {
      var p = nodes[l.a], q = nodes[l.b];
      var dx = q.x - p.x, dy = q.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = (d - l.rest) * 0.045 * a;
      p.vx += dx / d * f; p.vy += dy / d * f;
      q.vx -= dx / d * f; q.vy -= dy / d * f;
    });
    var pad = 26;
    nodes.forEach(function (nd) {
      if (nd === dragged) { nd.vx = 0; nd.vy = 0; return; }
      nd.vx *= 0.85; nd.vy *= 0.85;
      nd.x += nd.vx; nd.y += nd.vy;
      if (nd.x < pad) nd.x = pad; else if (nd.x > width - pad) nd.x = width - pad;
      if (nd.y < pad) nd.y = pad; else if (nd.y > height - pad) nd.y = height - pad;
    });
  }
  function warmup(steps) {
    for (var s = 0; s < steps; s++) tick(0.35);
  }

  function loop() {
    raf = null;
    if (!visible || alpha <= 0.02) { alpha = 0; return; }
    tick(alpha);
    alpha *= 0.992;
    draw();
    raf = requestAnimationFrame(loop);
  }
  function wake(a) {
    if (reducedMotion) { draw(); return; }
    alpha = Math.max(alpha, a);
    if (!raf && visible) raf = requestAnimationFrame(loop);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    var focusIndex = dragged ? nodes.indexOf(dragged) : hovered;
    var focus = focusIndex >= 0;
    var neigh = focus ? adjacency[focusIndex] : null;

    links.forEach(function (l) {
      var on = focus && (l.a === focusIndex || l.b === focusIndex);
      ctx.strokeStyle = on ? rgba(palette.warm, 0.85)
        : rgba(palette.line, focus ? 0.35 : 0.9);
      ctx.lineWidth = on ? 1.2 : 1;
      ctx.beginPath();
      ctx.moveTo(nodes[l.a].x, nodes[l.a].y);
      ctx.lineTo(nodes[l.b].x, nodes[l.b].y);
      ctx.stroke();
    });

    nodes.forEach(function (n, i) {
      var fill = n.anchor ? rgba(palette.sienna, 0.95)
        : n.warm ? rgba(palette.warm, 0.75)
        : rgba(palette.ink, 0.3);
      if (focus) {
        if (i === focusIndex) fill = rgba(palette.ink, 0.95);
        else if (neigh.indexOf(i) !== -1) fill = n.anchor ? rgba(palette.sienna, 0.95) : rgba(palette.warm, 0.9);
        else fill = n.anchor ? rgba(palette.sienna, 0.4) : rgba(palette.ink, 0.12);
      }
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (focus && i === focusIndex) {
        ctx.strokeStyle = rgba(palette.warm, 0.9);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 3.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    width = rect.width;
    height = rect.height;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layoutCenters();
    if (!placed) {
      placed = true;
      nodes.forEach(function (n) {
        var c = centers[n.cluster];
        n.x = c.x + (rand() - 0.5) * 120;
        n.y = c.y + (rand() - 0.5) * 120;
      });
      warmup(reducedMotion ? 500 : 240);
    }
    draw();
  }

  function pointerPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function nodeAt(p) {
    var best = -1, bestD = Infinity;
    nodes.forEach(function (n, i) {
      var dx = n.x - p.x, dy = n.y - p.y;
      var d = dx * dx + dy * dy;
      var reach = (n.r + 7) * (n.r + 7);
      if (d < reach && d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  canvas.addEventListener('pointerdown', function (e) {
    var i = nodeAt(pointerPos(e));
    if (i < 0) return;
    dragged = nodes[i];
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
    wake(0.45);
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointerPos(e);
    if (dragged) {
      dragged.x = Math.max(10, Math.min(width - 10, p.x));
      dragged.y = Math.max(10, Math.min(height - 10, p.y));
      wake(0.4);
      return;
    }
    var i = nodeAt(p);
    if (i !== hovered) {
      hovered = i;
      canvas.style.cursor = i >= 0 ? 'grab' : 'default';
      draw();
    }
  });
  function release() {
    if (!dragged) return;
    dragged = null;
    canvas.style.cursor = hovered >= 0 ? 'grab' : 'default';
    wake(0.3);
    draw();
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', function () {
    if (dragged) return;
    if (hovered !== -1) { hovered = -1; draw(); }
    canvas.style.cursor = 'default';
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible = entry.isIntersecting;
        if (visible) wake(0.12);
      });
    }, { threshold: 0.05 }).observe(canvas);
  }

  if ('ResizeObserver' in window) {
    var firstRO = true;
    new ResizeObserver(function () {
      if (firstRO) { firstRO = false; return; } // initial fire duplicates resize()
      resize();
      wake(0.2);
    }).observe(canvas);
  } else {
    window.addEventListener('resize', function () { resize(); wake(0.2); });
  }

  var scheme = window.matchMedia('(prefers-color-scheme: dark)');
  if (scheme.addEventListener) {
    scheme.addEventListener('change', function () { readPalette(); draw(); });
  }

  readPalette();
  resize();
  wake(0.3);
})();
