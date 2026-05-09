/* ============================================================
   ecosystem.js — plants, rays, particles, driftwood
   ============================================================ */

(function () {

  /* ── DEVICE TIER ── */
  var TIER = (function () {
    var cores = navigator.hardwareConcurrency || 2;
    var mem = navigator.deviceMemory || 2;
    var mob = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (mob && (cores <= 4 || mem <= 2)) return 'low';
    if (mob) return 'mid';
    return 'high';
  })();

  if (TIER === 'low') document.documentElement.classList.add('tier-low');

  /* Expose TIER globally so other scripts can read it */
  window.AR_TIER = TIER;

  var CFG = {
    low:  { plants: 6,  rays: 3, motes: 6,  sparks: 8  },
    mid:  { plants: 10, rays: 5, motes: 12, sparks: 18 },
    high: { plants: 17, rays: 8, motes: 25, sparks: 38 }
  }[TIER];

  /* ── PAUSE ON HIDDEN TAB ── */
  window.AR_PAUSED = false;
  document.addEventListener('visibilitychange', function () {
    window.AR_PAUSED = document.hidden;
  });

  /* ── RAYS ── */
  var rc = document.getElementById('rays');
  var allRays = [
    { l: '5%',  w: 58, h: '60%', d: 15,   dl: 0   },
    { l: '15%', w: 38, h: '48%', d: 19,   dl: 2   },
    { l: '27%', w: 66, h: '68%', d: 14,   dl: .8  },
    { l: '41%', w: 44, h: '54%', d: 17,   dl: 3   },
    { l: '56%', w: 52, h: '63%', d: 13,   dl: 1.5 },
    { l: '69%', w: 36, h: '46%', d: 18,   dl: 4   },
    { l: '81%', w: 60, h: '58%', d: 14.5, dl: 2.2 },
    { l: '91%', w: 32, h: '42%', d: 20,   dl: .5  }
  ];
  allRays.slice(0, CFG.rays).forEach(function (r) {
    var e = document.createElement('div');
    e.className = 'ray';
    e.style.cssText = 'left:' + r.l + ';width:' + r.w + 'px;height:' + r.h + ';animation-duration:' + r.d + 's;animation-delay:' + r.dl + 's';
    rc.appendChild(e);
  });

  /* ── PLANTS ── */
  var pc = document.getElementById('plants');
  var NS = 'http://www.w3.org/2000/svg';

  var plantTypes = [
    {
      name: 'val', draw: function (svg, w, h, c) {
        var cx = w / 2;
        [[0, 1, .92], [-.18, .88, 1], [.14, .96, .78], [-.06, .82, .95]].forEach(function (r, i) {
          var bx = cx + r[0] * w * .3, bh = h * r[1], cv = (i % 2 === 0) ? 1 : -1;
          var p = document.createElementNS(NS, 'path');
          p.setAttribute('d', 'M' + bx + ' ' + h + ' C' + (bx + cv * w * .35) + ' ' + (h * .6) + ' ' + (bx - cv * w * .2) + ' ' + (h * .3) + ' ' + (bx + cv * w * .1) + ' ' + bh);
          p.setAttribute('stroke', c); p.setAttribute('stroke-width', (r[2] * 2.5).toString()); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round'); svg.appendChild(p);
        });
      }
    },
    {
      name: 'sword', draw: function (svg, w, h, c) {
        var cx = w / 2, s = document.createElementNS(NS, 'path');
        s.setAttribute('d', 'M' + cx + ' ' + h + ' C' + cx + ' ' + (h * .7) + ' ' + cx + ' ' + (h * .3) + ' ' + cx + ' 0');
        s.setAttribute('stroke', c); s.setAttribute('stroke-width', '1.8'); s.setAttribute('fill', 'none'); svg.appendChild(s);
        [[.75, -1, 28, 12], [.55, 1, 32, 14], [.38, -1, 26, 11], [.22, 1, 20, 9], [.1, -1, 14, 7]].forEach(function (lp) {
          var ly = h * lp[0], dir = lp[1], lw = lp[2], lhh = lp[3], lx = cx + dir * lw * .15;
          var leaf = document.createElementNS(NS, 'path');
          leaf.setAttribute('d', 'M' + cx + ' ' + ly + ' C' + (lx + dir * lw * .5) + ' ' + (ly - lhh * .3) + ' ' + (lx + dir * lw) + ' ' + (ly - lhh * .7) + ' ' + (lx + dir * lw * .8) + ' ' + (ly - lhh) + ' C' + (lx + dir * lw * .5) + ' ' + (ly - lhh * 1.1) + ' ' + (cx + dir * 4) + ' ' + (ly - lhh * .5) + ' ' + cx + ' ' + ly + 'Z');
          leaf.setAttribute('fill', c); leaf.setAttribute('opacity', '0.75'); svg.appendChild(leaf);
        });
      }
    },
    {
      name: 'cabomba', draw: function (svg, w, h, c) {
        var cx = w / 2, s = document.createElementNS(NS, 'path');
        s.setAttribute('d', 'M' + cx + ' ' + h + ' C' + (cx - w * .1) + ' ' + (h * .7) + ' ' + (cx + w * .08) + ' ' + (h * .4) + ' ' + cx + ' 0');
        s.setAttribute('stroke', c); s.setAttribute('stroke-width', '1.5'); s.setAttribute('fill', 'none'); svg.appendChild(s);
        [.82, .65, .5, .36, .22, .1].forEach(function (pos, i) {
          var y = h * pos, branches = 3 + i % 2;
          for (var b = -branches; b <= branches; b++) {
            if (b === 0) continue;
            var angle = b * (Math.PI / (branches * 1.4)), len = w * .28 + Math.abs(b) * 2;
            var ex = cx + Math.sin(angle) * len, ey = y - Math.cos(angle) * len * .4;
            var br = document.createElementNS(NS, 'path');
            br.setAttribute('d', 'M' + cx + ' ' + y + ' Q' + ((cx + ex) / 2 + b * 2) + ' ' + (y - len * .2) + ' ' + ex + ' ' + ey);
            br.setAttribute('stroke', c); br.setAttribute('stroke-width', '0.9'); br.setAttribute('fill', 'none'); br.setAttribute('opacity', '0.7'); svg.appendChild(br);
          }
        });
      }
    },
    {
      name: 'bacopa', draw: function (svg, w, h, c) {
        var cx = w / 2, s = document.createElementNS(NS, 'path');
        s.setAttribute('d', 'M' + cx + ' ' + h + ' C' + (cx + w * .08) + ' ' + (h * .7) + ' ' + (cx - w * .08) + ' ' + (h * .4) + ' ' + cx + ' 0');
        s.setAttribute('stroke', c); s.setAttribute('stroke-width', '1.6'); s.setAttribute('fill', 'none'); svg.appendChild(s);
        for (var li = 8; li > 0; li -= 1.5) {
          var ly = h * li / 10;
          [-1, 1].forEach(function (dir) {
            var lf = document.createElementNS(NS, 'ellipse');
            lf.setAttribute('cx', (cx + dir * w * .22).toString()); lf.setAttribute('cy', (ly - 4).toString());
            lf.setAttribute('rx', (w * .18).toString()); lf.setAttribute('ry', '5');
            lf.setAttribute('fill', c); lf.setAttribute('opacity', '0.68'); svg.appendChild(lf);
          });
        }
      }
    },
    {
      name: 'moss', draw: function (svg, w, h, c) {
        var count = window.AR_TIER === 'low' ? 8 : 16;
        for (var mi = 0; mi < count; mi++) {
          var angle2 = -Math.PI / 2 + (Math.random() - .5) * Math.PI * .9, len2 = h * (.35 + Math.random() * .55);
          var sx = w * .1 + Math.random() * w * .8, ex = sx + Math.cos(angle2) * len2 * .5 + (Math.random() - .5) * w * .2, ey = h - Math.sin(-angle2) * len2;
          var br2 = document.createElementNS(NS, 'path');
          br2.setAttribute('d', 'M' + sx + ' ' + h + ' Q' + ((sx + ex) / 2 + (Math.random() - .5) * w * .3) + ' ' + (h - len2 * .5) + ' ' + ex + ' ' + ey);
          br2.setAttribute('stroke', c); br2.setAttribute('stroke-width', (.8 + Math.random() * .8).toString()); br2.setAttribute('fill', 'none'); br2.setAttribute('opacity', (.4 + Math.random() * .35).toString()); svg.appendChild(br2);
        }
      }
    }
  ];

  var allPlacements = [
    { l: '1%',  t: 'val',     w: 32, h: 145, sa: '-3deg',   sb: '2.5deg', d: '6.5s', dl: '0s',   c: 'rgba(68,105,62,.62)'  },
    { l: '5%',  t: 'moss',    w: 45, h: 55,  sa: '-2deg',   sb: '2deg',   d: '9s',   dl: '.5s',  c: 'rgba(55,90,45,.55)'   },
    { l: '10%', t: 'sword',   w: 52, h: 200, sa: '-2deg',   sb: '2.5deg', d: '8s',   dl: '1s',   c: 'rgba(72,110,60,.65)'  },
    { l: '17%', t: 'bacopa',  w: 28, h: 130, sa: '-4deg',   sb: '4deg',   d: '7s',   dl: '2s',   c: 'rgba(62,100,52,.55)'  },
    { l: '23%', t: 'val',     w: 26, h: 165, sa: '-3deg',   sb: '3deg',   d: '9.5s', dl: '.8s',  c: 'rgba(58,95,48,.58)'   },
    { l: '29%', t: 'cabomba', w: 50, h: 180, sa: '-2.5deg', sb: '2deg',   d: '7.5s', dl: '1.5s', c: 'rgba(78,120,65,.6)'   },
    { l: '37%', t: 'moss',    w: 55, h: 60,  sa: '-2deg',   sb: '2.5deg', d: '10s',  dl: '3s',   c: 'rgba(50,85,40,.5)'    },
    { l: '43%', t: 'sword',   w: 46, h: 185, sa: '-2deg',   sb: '2.5deg', d: '7s',   dl: '1.1s', c: 'rgba(70,112,58,.62)'  },
    { l: '51%', t: 'bacopa',  w: 30, h: 115, sa: '-3.5deg', sb: '3.5deg', d: '8s',   dl: '2.2s', c: 'rgba(62,100,50,.52)'  },
    { l: '57%', t: 'sword',   w: 46, h: 185, sa: '-2deg',   sb: '2.5deg', d: '7s',   dl: '1.1s', c: 'rgba(70,112,58,.62)'  },
    { l: '64%', t: 'val',     w: 24, h: 140, sa: '-3deg',   sb: '3.5deg', d: '9s',   dl: '.6s',  c: 'rgba(60,98,50,.56)'   },
    { l: '70%', t: 'cabomba', w: 44, h: 170, sa: '-3deg',   sb: '2.5deg', d: '8.5s', dl: '1.8s', c: 'rgba(75,115,62,.6)'   },
    { l: '77%', t: 'moss',    w: 48, h: 52,  sa: '-2deg',   sb: '2deg',   d: '11s',  dl: '2.8s', c: 'rgba(52,88,42,.5)'    },
    { l: '82%', t: 'sword',   w: 50, h: 195, sa: '-2deg',   sb: '2deg',   d: '7.5s', dl: '.4s',  c: 'rgba(72,110,60,.64)'  },
    { l: '88%', t: 'val',     w: 28, h: 150, sa: '-3.5deg', sb: '3deg',   d: '8s',   dl: '1.4s', c: 'rgba(64,102,54,.58)'  },
    { l: '93%', t: 'bacopa',  w: 26, h: 120, sa: '-4deg',   sb: '4deg',   d: '9.5s', dl: '2.5s', c: 'rgba(60,96,48,.5)'    },
    { l: '97%', t: 'moss',    w: 42, h: 48,  sa: '-2deg',   sb: '2.5deg', d: '10s',  dl: '0s',   c: 'rgba(55,88,44,.48)'   }
  ];

  var chosen = allPlacements.slice(0, CFG.plants), pi = 0;
  function plantBatch() {
    for (var b = 0; b < 3 && pi < chosen.length; b++, pi++) {
      var pd = chosen[pi];
      var type = plantTypes.find(function (t) { return t.name === pd.t; }) || plantTypes[0];
      var wrap = document.createElement('div'); wrap.className = 'plant';
      wrap.style.cssText = 'left:' + pd.l + ';--sa:' + pd.sa + ';--sb:' + pd.sb + ';animation:psway ' + pd.d + ' ease-in-out ' + pd.dl + ' infinite';
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('width', pd.w); svg.setAttribute('height', pd.h); svg.setAttribute('viewBox', '0 0 ' + pd.w + ' ' + pd.h); svg.setAttribute('fill', 'none');
      type.draw(svg, pd.w, pd.h, pd.c); wrap.appendChild(svg); pc.appendChild(wrap);
    }
    if (pi < chosen.length) setTimeout(plantBatch, 80);
  }
  setTimeout(plantBatch, 200);

  /* ── PARTICLES ── */
  setTimeout(function () {
    var ptc = document.getElementById('particles');
    for (var i = 0; i < CFG.motes; i++) {
      var m = document.createElement('div'); m.className = 'mote';
      var sz = 3 + Math.random() * 5, lt = Math.random() * 100, bt = 40 + Math.random() * 60;
      var dur = 8 + Math.random() * 14, dl = Math.random() * 20, rise = -(280 + Math.random() * 480), drift = (Math.random() - .5) * 55, op = .3 + Math.random() * .5;
      m.style.cssText = 'width:' + sz + 'px;height:' + sz + 'px;left:' + lt + '%;bottom:' + bt + 'px;--mo:' + op + ';--mr:' + rise + 'px;--md:' + drift + 'px;animation-duration:' + dur + 's;animation-delay:' + dl + 's';
      ptc.appendChild(m);
    }
    for (var j = 0; j < CFG.sparks; j++) {
      var s = document.createElement('div'); s.className = 'spk';
      var ssz = 1 + Math.random() * 2.2, slt = Math.random() * 100, stp = 10 + Math.random() * 75;
      var sdur = 6 + Math.random() * 12, sdl = Math.random() * 10, sxv = ((Math.random() - .5) * 16) + 'px', syv = ((Math.random() - .5) * 12) + 'px';
      s.style.cssText = 'width:' + ssz + 'px;height:' + ssz + 'px;left:' + slt + '%;top:' + stp + '%;--sx:' + sxv + ';--sy:' + syv + ';animation-duration:' + sdur + 's;animation-delay:' + sdl + 's';
      ptc.appendChild(s);
    }
  }, 800);

  /* ── DRIFTWOOD — mid/high only ── */
  if (TIER !== 'low') {
    setTimeout(function () {
      var dl = document.getElementById('driftwood-layer');

      function mkEl(tag, attrs) {
        var e = document.createElementNS(NS, tag);
        Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
      }
      function path(d, fill, stroke, sw) {
        var e = mkEl('path', { d: d });
        if (fill && fill !== 'none') e.setAttribute('fill', fill); else e.setAttribute('fill', 'none');
        if (stroke) { e.setAttribute('stroke', stroke); e.setAttribute('stroke-width', sw || 2); }
        e.setAttribute('stroke-linecap', 'round');
        return e;
      }

      /* Left driftwood */
      (function () {
        var w = 300, h = 140, svg = mkEl('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h });
        svg.appendChild(path('M8,' + h + ' C25,' + Math.round(h * .72) + ' 70,' + Math.round(h * .48) + ' 130,' + Math.round(h * .38) + ' C185,' + Math.round(h * .3) + ' 248,' + Math.round(h * .33) + ' 292,' + Math.round(h * .4), 'none', 'rgba(52,32,12,.7)', 9));
        svg.appendChild(path('M130,' + Math.round(h * .38) + ' C148,' + Math.round(h * .2) + ' 188,' + Math.round(h * .1) + ' 215,' + Math.round(h * .06), 'none', 'rgba(46,28,10,.58)', 5.5));
        svg.appendChild(path('M195,' + Math.round(h * .32) + ' C215,' + Math.round(h * .44) + ' 252,' + Math.round(h * .5) + ' 294,' + Math.round(h * .54), 'none', 'rgba(44,26,8,.52)', 4));
        [[30, h * .68, 14, 6], [55, h * .6, 10, 5], [80, h * .54, 12, 5]].forEach(function (r) {
          svg.appendChild(mkEl('ellipse', { cx: r[0], cy: Math.round(r[1]), rx: r[2], ry: r[3], fill: 'rgba(42,62,28,.38)' }));
        });
        var wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;left:2%;bottom:0;opacity:.5'; wrap.appendChild(svg); dl.appendChild(wrap);
      })();

      /* Right driftwood */
      (function () {
        var w = 270, h = 88, svg = mkEl('svg', { width: w, height: h, viewBox: '0 0 ' + w + ' ' + h });
        svg.appendChild(path('M0,' + Math.round(h * .62) + ' C38,' + Math.round(h * .46) + ' 95,' + Math.round(h * .38) + ' 158,' + Math.round(h * .42) + ' C208,' + Math.round(h * .46) + ' 255,' + Math.round(h * .56) + ' 268,' + Math.round(h * .66), 'none', 'rgba(48,30,10,.65)', 13));
        svg.appendChild(path('M95,' + Math.round(h * .38) + ' C100,' + Math.round(h * .2) + ' 112,' + Math.round(h * .1) + ' 120,' + Math.round(h * .06), 'none', 'rgba(44,26,8,.52)', 6));
        [[60, h * .5, 11, 5], [95, h * .42, 9, 4], [130, h * .44, 10, 5]].forEach(function (r) {
          svg.appendChild(mkEl('ellipse', { cx: r[0], cy: Math.round(r[1]), rx: r[2], ry: r[3], fill: 'rgba(40,60,25,.34)' }));
        });
        var wrap = document.createElement('div'); wrap.style.cssText = 'position:absolute;left:58%;bottom:0;opacity:.45'; wrap.appendChild(svg); dl.appendChild(wrap);
      })();
    }, 1200);
  }

})();
