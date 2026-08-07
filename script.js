// orejarena.org — vault edition.
// Sidebar file tree + a single, non-accumulating reading pane. The graph is
// a concept map, not a sitemap: its nodes are the five substantive works
// plus the themes that actually recur across them (grounded in a close
// read of each text — see TOPIC_EDGES below), not Home/Trajectory/Contact.
// The graph and the sidebar are the only navigation.

// `title` is what prints as the note's heading — kept in the original
// Spanish for the published works, since that's their real title.
// `navLabel` is the short English string used everywhere else (sidebar,
// breadcrumb, graph labels) so the interface itself stays fully in English.
var NOTES = {
  'inicio': { navLabel: 'Home', title: 'Alexander Orejarena-Correa', folder: null, meta: 'Jurist · Researcher · Essayist — Caribbean coast, Colombia' },
  'trayectoria': { navLabel: 'Trajectory', title: 'Trajectory', folder: null, meta: null },
  'analisis': { navLabel: 'Undergraduate Thesis', title: 'Análisis de los aportes interdisciplinares a la comprensión de lo jurídico como epistemología científica', folder: 'Research', meta: 'Undergraduate thesis · Universidad del Magdalena · 2023' },
  'dignidad': { navLabel: 'Is Human Dignity Obsolete?', title: '¿Es la dignidad humana un concepto obsoleto en la jurisprudencia de la Corte Constitucional?', folder: 'Research', meta: 'Article · Applied legal epistemology' },
  'corte-soberana': { navLabel: 'The Court as Sovereign', title: 'The Court as Sovereign', folder: 'Essays', meta: 'Axis I — The Court and its sovereignty · 2026' },
  'todo-lo-dicho': { navLabel: 'Everything Said Is Said by Someone', title: 'Everything Said Is Said by Someone', folder: 'Essays', meta: 'Axis II — Knowledge and its observer · 2026' },
  'monopolio-papel': { navLabel: 'A Monopoly on Paper', title: 'A Monopoly on Paper', folder: 'Essays', meta: 'Axis III — Law and its plural origins · 2026' },
  'contacto': { navLabel: 'Contact', title: 'Contact', folder: null, meta: null }
};

// The works that actually appear in the graph — Home/Trajectory/Contact are
// site furniture, not "trabajos", so they stay sidebar-only.
var WORK_IDS = ['analisis', 'dignidad', 'corte-soberana', 'todo-lo-dicho', 'monopolio-papel'];

var TOPICS = {
  't-epistemology': 'Legal Epistemology',
  't-biology': 'Biology of Cognition',
  't-anthropology': 'Legal Anthropology & Pluralism',
  't-judicial-power': 'Judicial Power & Democracy',
  't-neuroscience': 'Neuroscience of Judgment'
};

// Work ↔ topic — each pair reflects an actual argument made in the text,
// not a guess: e.g. the thesis and "A Monopoly on Paper" both build on
// Thomas Duve; "Everything Said..." and the thesis both start from
// Maturana & Varela's structural determinism.
var TOPIC_EDGES = [
  ['analisis', 't-epistemology'],
  ['analisis', 't-biology'],
  ['analisis', 't-anthropology'],
  ['analisis', 't-neuroscience'],
  ['dignidad', 't-epistemology'],
  ['dignidad', 't-neuroscience'],
  ['corte-soberana', 't-epistemology'],
  ['corte-soberana', 't-judicial-power'],
  ['todo-lo-dicho', 't-epistemology'],
  ['todo-lo-dicho', 't-biology'],
  ['monopolio-papel', 't-epistemology'],
  ['monopolio-papel', 't-anthropology'],
  ['monopolio-papel', 't-judicial-power']
];

var ADJACENCY = {};
WORK_IDS.concat(Object.keys(TOPICS)).forEach(function (id) { ADJACENCY[id] = []; });
TOPIC_EDGES.forEach(function (e) {
  ADJACENCY[e[0]].push(e[1]);
  ADJACENCY[e[1]].push(e[0]);
});

/* ── Sidebar: folder collapse ── */

document.querySelectorAll('.tree-folder-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var folder = btn.closest('.tree-folder');
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    folder.classList.toggle('collapsed', open);
  });
});

/* ── Theme: dark by default, light one click away, remembered ── */

var THEME_KEY = 'orejarena-theme';
var root = document.documentElement;
var themeToggle = document.getElementById('themeToggle');
var themeIconUse = document.getElementById('themeIconUse');
var themeColorMeta = document.getElementById('themeColorMeta');

function applyTheme(theme, animate) {
  if (animate) {
    root.classList.add('theme-transition');
    window.setTimeout(function () { root.classList.remove('theme-transition'); }, 350);
  }
  if (theme === 'light') root.setAttribute('data-theme', 'light');
  else root.removeAttribute('data-theme');

  themeIconUse.setAttribute('href', theme === 'light' ? '#icon-moon' : '#icon-sun');
  themeToggle.setAttribute('aria-label', theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
  themeColorMeta.setAttribute('content', theme === 'light' ? '#F2EEE7' : '#1a1a1a');

  if (window.refreshGraphPalette) window.refreshGraphPalette();
}

applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);

themeToggle.addEventListener('click', function () {
  var next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next, true);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
});

/* ── Sidebar: collapsible at any screen size ── */

var vault = document.getElementById('vault');
var sidebarToggle = document.getElementById('sidebarToggle');
var MOBILE_BP = 860;

(function () {
  // Desktop opens by default (matches the static markup); mobile starts
  // collapsed so the graph/reading pane isn't covered on load.
  if (window.innerWidth <= MOBILE_BP) {
    vault.classList.remove('sidebar-open');
    sidebarToggle.setAttribute('aria-expanded', 'false');
  }
  sidebarToggle.addEventListener('click', function () {
    var open = vault.classList.toggle('sidebar-open');
    sidebarToggle.setAttribute('aria-expanded', String(open));
  });
  vault.addEventListener('click', function (e) {
    if (vault.classList.contains('sidebar-open') && e.target === vault) {
      vault.classList.remove('sidebar-open');
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }
  });
})();

/* ── The single reading pane: sidebar and graph are the only ways to
   navigate, and opening a note always replaces whatever was open — nothing
   accumulates. ── */

var noteHeader = document.getElementById('noteHeader');
var noteBreadcrumb = document.getElementById('noteBreadcrumb');
var noteClose = document.getElementById('noteClose');
var paneContainer = document.getElementById('paneContainer');
var workspace = document.getElementById('workspace');

function breadcrumb(id) {
  var n = NOTES[id];
  return (n.folder ? n.folder + ' / ' : '') + n.navLabel + '.md';
}

function renderNote(id) {
  var tpl = document.getElementById('note-' + id);
  var inner = document.createElement('div');
  inner.className = 'note-pane-inner';

  var h1 = document.createElement('h1');
  h1.className = 'note-title';
  h1.textContent = NOTES[id].title;
  inner.appendChild(h1);

  if (NOTES[id].meta) {
    var meta = document.createElement('p');
    meta.className = 'note-meta';
    meta.textContent = NOTES[id].meta;
    inner.appendChild(meta);
  }

  if (tpl) inner.appendChild(tpl.content.cloneNode(true));

  paneContainer.innerHTML = '';
  paneContainer.appendChild(inner);
}

function openNote(id) {
  if (!NOTES[id]) return;
  noteBreadcrumb.textContent = breadcrumb(id);
  renderNote(id);
  workspace.classList.add('note-open');
  document.querySelectorAll('.tree-file').forEach(function (f) {
    f.classList.toggle('active', f.dataset.note === id);
  });
  // "You are here" on the graph — only works have a node, so opening
  // Home/Trajectory/Contact simply clears it rather than lying about it.
  if (window.setGraphActiveNote) window.setGraphActiveNote(WORK_IDS.indexOf(id) !== -1 ? id : null);
}

function closeNote() {
  paneContainer.innerHTML = '';
  noteBreadcrumb.textContent = '';
  workspace.classList.remove('note-open');
  document.querySelectorAll('.tree-file').forEach(function (f) { f.classList.remove('active'); });
  if (window.setGraphActiveNote) window.setGraphActiveNote(null);
}

noteClose.addEventListener('click', closeNote);

document.querySelectorAll('.tree-file').forEach(function (btn) {
  btn.addEventListener('click', function () { openNote(btn.dataset.note); });
});

/* ── Graph view: force-directed layout of the real vault graph ── */

(function () {
  var canvas = document.getElementById('graphCanvas');
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
  var rand = mulberry32(20260803);

  // Read straight from the CSS custom properties so the graph follows
  // whichever theme is active, instead of hardcoding one palette.
  var palette = {};
  function readPalette() {
    var cs = getComputedStyle(document.documentElement);
    palette.ink = (cs.getPropertyValue('--text') || '#dcddde').trim();
    palette.muted = (cs.getPropertyValue('--muted') || '#8b8b8b').trim();
    palette.line = (cs.getPropertyValue('--border') || '#3a3a3a').trim();
    palette.sienna = (cs.getPropertyValue('--sienna') || '#c1503d').trim();
  }
  function rgba(hex, alpha) {
    var h = hex.replace('#', '');
    var n = parseInt(h, 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  var ids = WORK_IDS.concat(Object.keys(TOPICS));
  var index = {}; ids.forEach(function (id, i) { index[id] = i; });
  var nodes = ids.map(function (id) {
    var isTopic = TOPICS.hasOwnProperty(id);
    return {
      id: id,
      type: isTopic ? 'topic' : 'work',
      label: isTopic ? TOPICS[id] : NOTES[id].navLabel,
      deg: ADJACENCY[id].length,
      x: 0, y: 0, vx: 0, vy: 0
    };
  });
  // Works stay small and roughly uniform — they're individual documents.
  // Topics grow with how many works actually touch that theme, so the size
  // itself shows which ideas run through the most of the corpus — kept
  // modest on purpose so a big topic never blocks a small work next to it.
  nodes.forEach(function (n) {
    n.r = n.type === 'work' ? 4.5 + n.deg * 0.5 : 6.5 + n.deg * 1.4;
  });

  // "You are here": whichever work is currently open in the reading pane,
  // if any — set from outside via window.setGraphActiveNote.
  var activeId = null;
  window.setGraphActiveNote = function (id) {
    activeId = id;
    draw();
  };

  var links = TOPIC_EDGES.map(function (e) { return { a: index[e[0]], b: index[e[1]], rest: 130 }; });

  var width = 0, height = 0, placed = false;
  var alpha = 0, raf = null, visible = true;
  var hovered = -1, dragged = null, downPos = null, moved = false;

  function tick(a) {
    var i, j, n, m;
    for (i = 0; i < nodes.length; i++) {
      n = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        m = nodes[j];
        var dx = m.x - n.x, dy = m.y - n.y;
        var d2 = dx * dx + dy * dy;
        if (d2 > 60000 || !d2) continue;
        var d = Math.sqrt(d2);
        var f = (a * 2600) / d2;
        n.vx -= dx / d * f; n.vy -= dy / d * f;
        m.vx += dx / d * f; m.vy += dy / d * f;
      }
      n.vx += (width / 2 - n.x) * 0.006 * a;
      n.vy += (height / 2 - n.y) * 0.006 * a;
    }
    links.forEach(function (l) {
      var p = nodes[l.a], q = nodes[l.b];
      var dx = q.x - p.x, dy = q.y - p.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var f = (d - l.rest) * 0.05 * a;
      p.vx += dx / d * f; p.vy += dy / d * f;
      q.vx -= dx / d * f; q.vy -= dy / d * f;
    });
    var pad = 34;
    nodes.forEach(function (nd) {
      if (nd === dragged) { nd.vx = 0; nd.vy = 0; return; }
      nd.vx *= 0.82; nd.vy *= 0.82;
      nd.x += nd.vx; nd.y += nd.vy;
      if (nd.x < pad) nd.x = pad; else if (nd.x > width - pad) nd.x = width - pad;
      if (nd.y < pad) nd.y = pad; else if (nd.y > height - pad) nd.y = height - pad;
    });
  }
  function warmup(steps) { for (var s = 0; s < steps; s++) tick(0.35); }

  function loop() {
    raf = null;
    if (!visible || alpha <= 0.02) { alpha = 0; return; }
    tick(alpha);
    alpha *= 0.99;
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
    var focus = hovered >= 0 || dragged;
    var focusIndex = dragged ? nodes.indexOf(dragged) : hovered;
    var neigh = focus ? ADJACENCY[nodes[focusIndex].id].map(function (id) { return index[id]; }) : null;

    links.forEach(function (l) {
      var on = focus && (l.a === focusIndex || l.b === focusIndex);
      ctx.strokeStyle = on ? rgba(palette.sienna, 0.75) : rgba(palette.line, focus ? 0.35 : 0.9);
      ctx.lineWidth = on ? 1.4 : 1;
      ctx.beginPath();
      ctx.moveTo(nodes[l.a].x, nodes[l.a].y);
      ctx.lineTo(nodes[l.b].x, nodes[l.b].y);
      ctx.stroke();
    });

    nodes.forEach(function (n, i) {
      var isActive = n.id === activeId;
      // Same shape for both — works and topics are told apart by size
      // (topics grow with how many works share them) and by weight: works
      // sit dimmer/darker, topics read brighter so they stand out as hubs.
      // Sienna is reserved for one thing only: wherever the reading pane
      // currently is — the graph's "you are here".
      var baseAlpha = n.type === 'work' ? 0.38 : 0.72;
      var fill = isActive ? rgba(palette.sienna, 0.95) : rgba(palette.ink, baseAlpha);
      if (focus) {
        if (i === focusIndex) fill = isActive ? rgba(palette.sienna, 1) : rgba(palette.ink, 1);
        else if (neigh.indexOf(i) !== -1) fill = isActive ? rgba(palette.sienna, 0.95) : rgba(palette.ink, Math.min(1, baseAlpha + 0.32));
        else fill = isActive ? rgba(palette.sienna, 0.4) : rgba(palette.ink, baseAlpha * 0.4);
      }
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      ctx.fill();
      if (isActive) {
        ctx.strokeStyle = rgba(palette.sienna, 0.55);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + 4, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (focus && i === focusIndex) {
        ctx.strokeStyle = rgba(palette.sienna, 0.9);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r + (isActive ? 7 : 4), 0, Math.PI * 2);
        ctx.stroke();
      }

      var dim = focus && i !== focusIndex && neigh.indexOf(i) === -1;
      var label = n.label.length > 34 ? n.label.slice(0, 33) + '…' : n.label;
      ctx.font = (n.type === 'topic' ? 'italic ' : '') + '11px "IBM Plex Mono", monospace';
      ctx.fillStyle = dim ? rgba(palette.muted, 0.25) : (isActive ? rgba(palette.sienna, 0.95) : rgba(palette.muted, 0.85));
      ctx.textBaseline = 'middle';

      // Flip the label to the node's left whenever it wouldn't fully fit
      // on the right, so text is never lost off the edge of a narrow panel.
      var labelW = ctx.measureText(label).width;
      if (n.x + n.r + 7 + labelW + 6 > width) {
        ctx.textAlign = 'right';
        ctx.fillText(label, n.x - n.r - 7, n.y);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(label, n.x + n.r + 7, n.y);
      }
    });
  }

  window.sizeGraphCanvas = function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    width = rect.width; height = rect.height;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!placed) {
      placed = true;
      nodes.forEach(function (n) {
        n.x = width / 2 + (rand() - 0.5) * width * 0.6;
        n.y = height / 2 + (rand() - 0.5) * height * 0.6;
      });
      warmup(reducedMotion ? 500 : 260);
    }
    draw();
  };

  function pointerPos(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function nodeAt(p) {
    var best = -1, bestD = Infinity;
    nodes.forEach(function (n, i) {
      var dx = n.x - p.x, dy = n.y - p.y;
      var d = dx * dx + dy * dy;
      var reach = (n.r + 8) * (n.r + 8);
      if (d < reach && d < bestD) { bestD = d; best = i; }
    });
    return best;
  }

  canvas.addEventListener('pointerdown', function (e) {
    var i = nodeAt(pointerPos(e));
    if (i < 0) return;
    dragged = nodes[i];
    downPos = pointerPos(e);
    moved = false;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
    e.preventDefault();
    wake(0.4);
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointerPos(e);
    if (dragged) {
      if (downPos && (Math.abs(p.x - downPos.x) > 3 || Math.abs(p.y - downPos.y) > 3)) moved = true;
      dragged.x = Math.max(10, Math.min(width - 10, p.x));
      dragged.y = Math.max(10, Math.min(height - 10, p.y));
      wake(0.35);
      return;
    }
    var i = nodeAt(p);
    if (i !== hovered) {
      hovered = i;
      canvas.style.cursor = i >= 0 && nodes[i].type === 'work' ? 'pointer' : 'default';
      draw();
    }
  });
  function release() {
    if (!dragged) return;
    var wasClick = !moved;
    var clicked = dragged;
    dragged = null;
    canvas.style.cursor = hovered >= 0 && nodes[hovered].type === 'work' ? 'pointer' : 'default';
    wake(0.25);
    draw();
    // Topics organize the map but aren't readable notes — only works open.
    if (wasClick && clicked.type === 'work') openNote(clicked.id);
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', function () { dragged = null; });
  canvas.addEventListener('pointerleave', function () {
    if (dragged) return;
    if (hovered !== -1) { hovered = -1; draw(); }
    canvas.style.cursor = 'default';
  });

  if ('ResizeObserver' in window) {
    new ResizeObserver(function () { window.sizeGraphCanvas(); wake(0.15); }).observe(canvas);
  } else {
    window.addEventListener('resize', function () { window.sizeGraphCanvas(); wake(0.15); });
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        visible = entry.isIntersecting;
        if (visible) wake(0.12);
      });
    }, { threshold: 0.05 }).observe(canvas);
  }

  window.refreshGraphPalette = function () {
    readPalette();
    draw();
  };

  readPalette();
  window.sizeGraphCanvas();
  wake(0.3);
})();
