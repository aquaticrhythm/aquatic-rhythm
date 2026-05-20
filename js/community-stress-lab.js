/**
 * Community Stress Lab — rules engine + UI (MVP v1).
 * Spec: docs/community-stress-lab-mvp.md
 */
(function () {
  'use strict';

  var MAX_DISTINCT_SPECIES = 6;
  var MAX_INDIVIDUALS = 24;
  var BIoload_COEFF = 0.35;
  var BIoload_HIGH = 0.5;
  var SMALL_TANK_L = 60;
  var TIGER_MIN_SCHOOL = 8;

  var LANES = ['thermal', 'chemistry', 'space', 'predation', 'social', 'inverts'];

  function hasTag(s, tag) {
    return s.tags && s.tags.indexOf(tag) !== -1;
  }

  function isInvert(s) {
    return hasTag(s, 'invert');
  }

  function intersectIntervals(intervals) {
    if (!intervals.length) return null;
    var lo = -Infinity;
    var hi = Infinity;
    for (var i = 0; i < intervals.length; i++) {
      lo = Math.max(lo, intervals[i][0]);
      hi = Math.min(hi, intervals[i][1]);
    }
    if (lo > hi) return null;
    return { lo: lo, hi: hi, width: hi - lo };
  }

  function thermalIntersection(speciesById, picks) {
    var iv = [];
    for (var i = 0; i < picks.length; i++) {
      var s = speciesById[picks[i].id];
      if (!s) continue;
      iv.push([s.tempMinC, s.tempMaxC]);
    }
    return intersectIntervals(iv);
  }

  /**
   * @returns {{ skip: true } | { gap: true } | { ok: true, width: number, lo: number, hi: number }}
   */
  function phIntersection(speciesById, picks) {
    var iv = [];
    for (var i = 0; i < picks.length; i++) {
      var s = speciesById[picks[i].id];
      if (!s) return { skip: true };
      if (s.phMin == null || s.phMax == null) return { skip: true };
      iv.push([s.phMin, s.phMax]);
    }
    var intv = intersectIntervals(iv);
    if (!intv) return { gap: true };
    return { ok: true, width: intv.width, lo: intv.lo, hi: intv.hi };
  }

  function severityRank(sev) {
    if (sev === 'high') return 3;
    if (sev === 'elevated') return 2;
    if (sev === 'info') return 1;
    return 0;
  }

  function runRules(volumeL, plantCover, picks, speciesById) {
    var findings = [];
    if (!picks.length) {
      return { findings: [], laneLevel: emptyLanes(), picks: picks };
    }

    var tInt = thermalIntersection(speciesById, picks);
    if (!tInt) {
      findings.push({
        id: 'R_THERMAL_GAP',
        title: 'No shared temperature window',
        body: 'On paper, these species do not overlap in a comfortable temperature range. Re-check sources before attempting a mixed setup.',
        severity: 'high',
        lanes: ['thermal']
      });
    } else if (tInt.width < 2) {
      findings.push({
        id: 'R_THERMAL_NARROW',
        title: 'Very narrow temperature overlap',
        body: 'The overlap is only about ' + tInt.width.toFixed(1) + ' °C — small heater drift or seasons can push someone out of comfort.',
        severity: 'elevated',
        lanes: ['thermal']
      });
    }

    var phInt = phIntersection(speciesById, picks);
    if (!phInt.skip) {
      if (phInt.gap) {
        findings.push({
          id: 'R_PH_GAP',
          title: 'pH targets do not overlap',
          body: 'General ranges do not intersect. Source water and buffering will matter even more than usual.',
          severity: 'high',
          lanes: ['chemistry']
        });
      } else if (phInt.ok && phInt.width < 0.4) {
        findings.push({
          id: 'R_PH_NARROW',
          title: 'Tight pH overlap',
          body: 'The combined pH window is narrow — test tap and tank chemistry before mixing.',
          severity: 'elevated',
          lanes: ['chemistry']
        });
      }
    }

    var anyCold = false;
    var anyNonCold = false;
    for (var c = 0; c < picks.length; c++) {
      var sp = speciesById[picks[c].id];
      if (!sp) continue;
      if (hasTag(sp, 'coldwater')) anyCold = true;
      else anyNonCold = true;
    }
    if (anyCold && anyNonCold) {
      findings.push({
        id: 'R_COLDWARM_MIX',
        title: 'Coldwater mixed with tropical',
        body: 'Coldwater species (like goldfish) and tropical species rarely share one stable long-term plan.',
        severity: 'high',
        lanes: ['thermal']
      });
    }

    var bioload = 0;
    var distinct = {};
    for (var b = 0; b < picks.length; b++) {
      var p = picks[b];
      var sb = speciesById[p.id];
      if (!sb) continue;
      distinct[p.id] = true;
      bioload += (sb.bioloadUnits || 0) * (p.count || 0);
    }
    var nSpecies = Object.keys(distinct).length;
    if (bioload > volumeL * BIoload_HIGH) {
      findings.push({
        id: 'R_BIoload_HIGH',
        title: 'Bioload proxy is high for this volume',
        body: 'Stocking density (rough proxy) is high relative to ' + volumeL + ' L — filtration, plants, and water changes need to match.',
        severity: 'high',
        lanes: ['space']
      });
    } else if (bioload > volumeL * BIoload_COEFF) {
      findings.push({
        id: 'R_BIoload_PROXY',
        title: 'Bioload proxy is elevated',
        body: 'There is meaningful livestock mass for this volume on paper — leave margin for growth and messy days.',
        severity: 'elevated',
        lanes: ['space']
      });
    }

    var aggressiveCichlid = false;
    var mbunaPresent = false;
    for (var k = 0; k < picks.length; k++) {
      var sk = speciesById[picks[k].id];
      if (!sk) continue;
      if (hasTag(sk, 'cichlid_aggressive') || hasTag(sk, 'mbuna')) aggressiveCichlid = true;
      if (hasTag(sk, 'mbuna')) mbunaPresent = true;
    }
    if (volumeL < SMALL_TANK_L && (nSpecies > 3 || aggressiveCichlid)) {
      findings.push({
        id: 'R_SMALL_TANK',
        title: 'Small tank, many lifestyles',
        body: 'Under ' + SMALL_TANK_L + ' L with several species or aggressive cichlids, territory and water quality swing faster.',
        severity: 'elevated',
        lanes: ['space']
      });
    }

    if (mbunaPresent) {
      for (var m = 0; m < picks.length; m++) {
        if (picks[m].id !== 'mbuna_generic') {
          findings.push({
            id: 'R_MBUNA_COMMUNITY',
            title: 'Mbuna with non-mbuna fish',
            body: 'Rock-dwelling mbuna are a different community model than typical community fish — mixing usually raises chronic aggression or stress.',
            severity: 'high',
            lanes: ['social', 'space']
          });
          break;
        }
      }
    }

    for (var pi = 0; pi < picks.length; pi++) {
      for (var pj = 0; pj < picks.length; pj++) {
        if (pi === pj) continue;
        var a = speciesById[picks[pi].id];
        var bb = speciesById[picks[pj].id];
        if (!a || !bb) continue;
        if ((a.mouthPredatorLevel || 0) < 2) continue;
        if ((bb.bodyMmAdult || 999) > 45) continue;
        var sev = (a.mouthPredatorLevel >= 3 && bb.bodyMmAdult <= 30) ? 'high' : 'elevated';
        findings.push({
          id: 'R_PREDATION_' + a.id + '_' + bb.id,
          title: 'Mouth / body mismatch',
          body: a.displayName + ' may treat very small tankmates (such as ' + bb.displayName + ') as food — behaviour varies by individual and setup.',
          severity: sev,
          lanes: ['predation']
        });
      }
    }

    var shrimpLike = false;
    for (var sh = 0; sh < picks.length; sh++) {
      var shr = speciesById[picks[sh].id];
      if (!shr) continue;
      if (isInvert(shr) && !hasTag(shr, 'snail') && (shr.bodyMmAdult || 999) <= 55) {
        shrimpLike = true;
        break;
      }
    }
    if (shrimpLike) {
      var risky = false;
      var riskyHigh = false;
      for (var f = 0; f < picks.length; f++) {
        var sf = speciesById[picks[f].id];
        if (!sf || isInvert(sf)) continue;
        if (hasTag(sf, 'cichlid_aggressive') || hasTag(sf, 'mbuna')) riskyHigh = true;
        if ((sf.mouthPredatorLevel || 0) >= 2) riskyHigh = true;
        if ((sf.mouthPredatorLevel || 0) >= 1 || sf.finNipper) risky = true;
      }
      if (riskyHigh) {
        findings.push({
          id: 'R_SHRIMP_RISK',
          title: 'Shrimp with high-risk fish',
          body: 'Active predators, nippers, or aggressive cichlids often stress or consume dwarf shrimp in typical aquascapes.',
          severity: 'high',
          lanes: ['inverts']
        });
      } else if (risky) {
        findings.push({
          id: 'R_SHRIMP_RISK',
          title: 'Shrimp with moderate-risk fish',
          body: 'Some fish ignore shrimp; others do not. Plan hiding places and watch for missing shrimp over weeks, not hours.',
          severity: 'elevated',
          lanes: ['inverts']
        });
      }
    }

    var nipper = null;
    var longFinOrLabyrinth = false;
    for (var n = 0; n < picks.length; n++) {
      var sn = speciesById[picks[n].id];
      if (!sn) continue;
      if (sn.finNipper) nipper = sn;
      if (hasTag(sn, 'long_finned') || hasTag(sn, 'labyrinth')) longFinOrLabyrinth = true;
    }
    if (nipper && longFinOrLabyrinth) {
      findings.push({
        id: 'R_FIN_NIPPER',
        title: 'Fin-nipping exposure',
        body: 'A nipping species is paired with long fins or labyrinth fish — watch fins daily after introduction.',
        severity: 'elevated',
        lanes: ['social']
      });
    }

    var tigerCount = 0;
    for (var t = 0; t < picks.length; t++) {
      if (picks[t].id === 'tiger_barb') tigerCount += picks[t].count || 0;
    }
    if (tigerCount > 0 && tigerCount < TIGER_MIN_SCHOOL) {
      findings.push({
        id: 'R_TIGER_SCHOOL',
        title: 'Tiger barbs in a small group',
        body: 'Tiger barbs are often nippier below ~' + TIGER_MIN_SCHOOL + ' — a larger school sometimes redirects nipping within the group.',
        severity: 'elevated',
        lanes: ['social']
      });
    }

    for (var sc = 0; sc < picks.length; sc++) {
      var ssp = speciesById[picks[sc].id];
      if (!ssp || ssp.schoolingMin == null) continue;
      if ((picks[sc].count || 0) < ssp.schoolingMin) {
        findings.push({
          id: 'R_SCHOOLING_' + picks[sc].id,
          title: ssp.displayName + ' — low group size',
          body: 'This species is usually kept in larger groups (about ' + ssp.schoolingMin + '+). Small groups often hide or act skittish.',
          severity: 'elevated',
          lanes: ['social']
        });
      }
    }

    var bettaMale = picks.some(function (x) { return x.id === 'betta_male'; });
    var bettaMaleCount = 0;
    for (var bm = 0; bm < picks.length; bm++) {
      if (picks[bm].id === 'betta_male') bettaMaleCount += picks[bm].count || 0;
    }
    if (bettaMaleCount > 1) {
      findings.push({
        id: 'R_BETTA_MALE_MULTI',
        title: 'Multiple male bettas — fighting near-certain',
        body: 'Male bettas are strongly territorial and will fight if housed together. Fin damage, stress, and death are the typical outcome in all but very large, heavily-divided setups.',
        severity: 'high',
        lanes: ['social']
      });
    }
    if (bettaMale) {
      var fast = picks.some(function (x) {
        var sx = speciesById[x.id];
        return sx && (x.id === 'zebra_danio' || x.id === 'tiger_barb' || hasTag(sx, 'fast_swimmer'));
      });
      if (fast) {
        findings.push({
          id: 'R_BETTA_MALE_FLOW',
          title: 'Male betta with very active swimmers',
          body: 'Fast mid-water fish sometimes stress male bettas by repeatedly crossing territory — watch for flaring, torn fins, or loss of appetite.',
          severity: 'elevated',
          lanes: ['social']
        });
      }
      var gourami = picks.some(function (x) {
        if (x.id === 'betta_male') return false;
        var sx2 = speciesById[x.id];
        return sx2 && hasTag(sx2, 'labyrinth');
      });
      if (gourami) {
        findings.push({
          id: 'R_BETTA_MALE_GOURAMI',
          title: 'Male betta with other labyrinth fish',
          body: 'Multiple labyrinth species can dispute the surface — line of sight breaks and float plants help, but aggression is common.',
          severity: 'elevated',
          lanes: ['social']
        });
      }
    }

    if (tInt && tInt.lo < 26) {
      var warmSpecial = picks.some(function (x) {
        var wx = speciesById[x.id];
        return wx && (hasTag(wx, 'warm_specialist') || x.id === 'discus');
      });
      if (warmSpecial) {
        findings.push({
          id: 'R_GBR_HEAT',
          title: 'Warm-specialist in a cool-overlap window',
          body: 'Warm-loving fish need stable warm water — if the whole-group overlap sits low, heaters and room temperature need extra headroom.',
          severity: 'elevated',
          lanes: ['thermal']
        });
      }
    }

    var discusHere = picks.some(function (x) { return x.id === 'discus'; });
    if (discusHere) {
      var clash = picks.some(function (x) {
        return x.id === 'goldfish' || x.id === 'zebra_danio' || x.id === 'tiger_barb' || x.id === 'mbuna_generic' || x.id === 'molly';
      });
      if (clash) {
        findings.push({
          id: 'R_DISCUS_COMPLEX',
          title: 'Discus with a mismatched lifestyle mix',
          body: 'Discus husbandry (temperature, flow, temperament) rarely lines up with coldwater, high-chase, or mbuna setups — expect extra friction.',
          severity: 'elevated',
          lanes: ['chemistry', 'social']
        });
      }
    }

    // R_SNAIL_LOACH: snails with snail-eating or aggressive species
    var snailPresent = false;
    var mysterySnailPresent = false;
    for (var sl = 0; sl < picks.length; sl++) {
      var slS = speciesById[picks[sl].id];
      if (slS && hasTag(slS, 'snail') && isInvert(slS)) {
        snailPresent = true;
        if (picks[sl].id === 'mystery_snail') mysterySnailPresent = true;
      }
    }
    if (snailPresent) {
      for (var sl2 = 0; sl2 < picks.length; sl2++) {
        var slF = speciesById[picks[sl2].id];
        if (!slF || hasTag(slF, 'snail')) continue;
        if (hasTag(slF, 'snail_eater')) {
          findings.push({
            id: 'R_SNAIL_LOACH',
            title: 'Snails with snail-eating species',
            body: 'Loaches and similar fish actively hunt snails — snail populations will likely decline over time.',
            severity: 'info',
            lanes: ['inverts']
          });
          break;
        }
      }
      if (mysterySnailPresent) {
        for (var sl3 = 0; sl3 < picks.length; sl3++) {
          var slA = speciesById[picks[sl3].id];
          if (slA && (hasTag(slA, 'cichlid_aggressive') || hasTag(slA, 'mbuna'))) {
            findings.push({
              id: 'R_SNAIL_LOACH_CICHLID',
              title: 'Mystery snail with aggressive cichlid',
              body: 'Aggressive cichlids may harass or injure mystery snails — antennas and soft parts are vulnerable.',
              severity: 'elevated',
              lanes: ['inverts']
            });
            break;
          }
        }
      }
    }

    // R_INVERT_ASSASSIN: assassin snail with small soft-bodied inverts
    var assassinPresent = picks.some(function (x) { return x.id === 'assassin_snail'; });
    if (assassinPresent) {
      for (var ai = 0; ai < picks.length; ai++) {
        var aiS = speciesById[picks[ai].id];
        if (!aiS || picks[ai].id === 'assassin_snail') continue;
        if (isInvert(aiS) && !hasTag(aiS, 'snail')) {
          findings.push({
            id: 'R_INVERT_ASSASSIN',
            title: 'Assassin snail with small inverts',
            body: 'Assassin snails prey on pest snails and may also take dwarf shrimp, especially juveniles — monitor closely in a mixed invert setup.',
            severity: 'elevated',
            lanes: ['inverts']
          });
          break;
        }
      }
    }

    // R_ZONE_BENTHIC_CROWD: multiple heavy benthic/bottom species in a small tank
    var benthicSpp = [];
    for (var zb = 0; zb < picks.length; zb++) {
      var zbS = speciesById[picks[zb].id];
      if (zbS && (zbS.zone === 'benthic' || zbS.zone === 'bottom') && (zbS.bioloadUnits || 0) >= 2) {
        benthicSpp.push(zbS.displayName);
      }
    }
    if (benthicSpp.length >= 2 && volumeL < SMALL_TANK_L) {
      findings.push({
        id: 'R_ZONE_BENTHIC_CROWD',
        title: 'Multiple bottom-dwellers in a small tank',
        body: 'Several benthic species (' + benthicSpp.join(', ') + ') compete for substrate territory — friction increases in tanks under ' + SMALL_TANK_L + ' L.',
        severity: 'elevated',
        lanes: ['space', 'social']
      });
    }

    dedupeFindings(findings);
    var laneLevel = aggregateLanes(findings);
    findings.sort(function (a, b) {
      return severityRank(b.severity) - severityRank(a.severity) || a.title.localeCompare(b.title);
    });
    return { findings: findings, laneLevel: laneLevel, picks: picks };
  }

  function dedupeFindings(findings) {
    var seen = {};
    for (var i = findings.length - 1; i >= 0; i--) {
      var id = findings[i].id;
      if (id.indexOf('R_PREDATION_') === 0) continue;
      if (seen[id]) findings.splice(i, 1);
      else seen[id] = true;
    }
    var predSeen = {};
    for (var j = findings.length - 1; j >= 0; j--) {
      if (findings[j].id.indexOf('R_PREDATION_') !== 0) continue;
      var key = findings[j].severity + findings[j].body;
      if (predSeen[key]) findings.splice(j, 1);
      else predSeen[key] = true;
    }
  }

  function aggregateLanes(findings) {
    var out = emptyLanes();
    for (var i = 0; i < findings.length; i++) {
      var f = findings[i];
      if (f.severity === 'info') continue;
      var w = severityRank(f.severity);
      var lanes = f.lanes || [];
      for (var L = 0; L < lanes.length; L++) {
        var lane = lanes[L];
        if (out[lane] != null && w > out[lane]) out[lane] = w;
      }
    }
    return out;
  }

  function emptyLanes() {
    var o = {};
    for (var i = 0; i < LANES.length; i++) o[LANES[i]] = 0;
    return o;
  }

  function laneLabel(score) {
    if (score >= 3) return 'high';
    if (score >= 2) return 'elevated';
    return 'low';
  }

  function init() {
    var root = document.getElementById('csl-root');
    if (!root) return;

    var volumeEl = document.getElementById('csl-volume');
    var volumeVal = document.getElementById('csl-volume-val');
    var searchEl = document.getElementById('csl-search');
    var addBtn = document.getElementById('csl-add');
    var chipsEl = document.getElementById('csl-chips');
    var lanesEl = document.getElementById('csl-lanes');
    var findingsEl = document.getElementById('csl-findings');
    var checklistEl = document.getElementById('csl-checklist');
    var statusEl = document.getElementById('csl-status');

    var speciesList = [];
    var speciesById = {};
    var picks = [];

    function setStatus(msg, err) {
      if (!statusEl) return;
      statusEl.textContent = msg || '';
      statusEl.style.color = err ? 'rgba(220,120,100,.9)' : 'rgba(235,240,236,.45)';
    }

    function totalIndividuals() {
      var t = 0;
      for (var i = 0; i < picks.length; i++) t += picks[i].count || 0;
      return t;
    }

    function renderChips() {
      chipsEl.innerHTML = '';
      if (!picks.length) {
        chipsEl.innerHTML = '<p class="csl-empty">Add species to map overlapping pressures.</p>';
        return;
      }
      for (var i = 0; i < picks.length; i++) {
        (function (idx) {
          var p = picks[idx];
          var s = speciesById[p.id];
          var row = document.createElement('div');
          row.className = 'csl-chip';
          row.innerHTML =
            '<span class="csl-chip-name">' + escapeHtml(s.displayName) + '</span>' +
            '<span class="csl-chip-ctl">' +
            '<button type="button" class="csl-count-btn" data-act="minus" aria-label="Decrease count">−</button>' +
            '<span class="csl-count">' + p.count + '</span>' +
            '<button type="button" class="csl-count-btn" data-act="plus" aria-label="Increase count">+</button>' +
            '</span>' +
            '<button type="button" class="csl-remove" data-act="remove" aria-label="Remove ' + escapeHtml(s.displayName) + '">×</button>';
          row.querySelector('[data-act="minus"]').addEventListener('click', function () {
            if (picks[idx].count > 1) picks[idx].count--;
            else picks.splice(idx, 1);
            refresh();
          });
          row.querySelector('[data-act="plus"]').addEventListener('click', function () {
            if (totalIndividuals() >= MAX_INDIVIDUALS) return;
            picks[idx].count++;
            refresh();
          });
          row.querySelector('[data-act="remove"]').addEventListener('click', function () {
            picks.splice(idx, 1);
            refresh();
          });
          chipsEl.appendChild(row);
        })(i);
      }
    }

    function escapeHtml(t) {
      return String(t)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    function refresh() {
      var vol = parseInt(volumeEl.value, 10) || 60;
      volumeVal.textContent = vol + ' L';
      renderChips();
      var result = runRules(vol, 'med', picks, speciesById);
      renderLanes(result.laneLevel);
      renderFindings(result.findings);
      renderChecklist(result.findings);
    }

    function renderLanes(laneLevel) {
      lanesEl.innerHTML = '';
      for (var i = 0; i < LANES.length; i++) {
        var lane = LANES[i];
        var score = laneLevel[lane] || 0;
        var lab = laneLabel(score);
        var row = document.createElement('div');
        row.className = 'csl-lane csl-lane--' + lab;
        row.setAttribute('role', 'group');
        var w = lab === 'low' ? 22 : lab === 'elevated' ? 55 : 92;
        row.innerHTML =
          '<div class="csl-lane-head">' +
          '<span class="csl-lane-name">' + escapeHtml(laneDisplay(lane)) + '</span>' +
          '<span class="csl-lane-lbl">' + escapeHtml(lab) + '</span>' +
          '</div>' +
          '<div class="csl-lane-meter">' +
          '<div class="csl-lane-track"><span class="csl-lane-fill" style="width:' + w + '%"></span></div>' +
          '</div>';
        lanesEl.appendChild(row);
      }
    }

    function laneDisplay(key) {
      return {
        thermal: 'Thermal',
        chemistry: 'Water chemistry',
        space: 'Space / load',
        predation: 'Predation',
        social: 'Social tension',
        inverts: 'Invert safety'
      }[key] || key;
    }

    function renderFindings(findings) {
      findingsEl.innerHTML = '';
      if (!picks.length) {
        findingsEl.innerHTML = '<li class="csl-finding csl-finding--low">Select species to generate findings.</li>';
        return;
      }
      if (!findings.length) {
        findingsEl.innerHTML = '<li class="csl-finding csl-finding--low">No major overlapping pressures flagged by this MVP model — still observe the real tank.</li>';
        return;
      }
      for (var i = 0; i < findings.length; i++) {
        var f = findings[i];
        var li = document.createElement('li');
        li.className = 'csl-finding csl-finding--' + f.severity;
        li.innerHTML = '<strong>' + escapeHtml(f.title) + '</strong><p>' + escapeHtml(f.body) + '</p>';
        findingsEl.appendChild(li);
      }
    }

    function renderChecklist(findings) {
      var staticLines = [
        'Watch feeding response and body condition for 7–10 days after any addition.',
        'Note fin damage, hiding, or colour loss at the same time each day.',
        'When troubleshooting, change one variable at a time so cause stays readable.'
      ];
      var extra = [];
      for (var i = 0; i < findings.length; i++) {
        if (findings[i].severity === 'high') {
          extra.push('Priority: re-read behaviour for “' + findings[i].title + '” before adding more livestock.');
        }
      }
      checklistEl.innerHTML = staticLines.concat(extra).map(function (line) {
        return '<li>' + escapeHtml(line) + '</li>';
      }).join('');
    }

    function addSpeciesById(id) {
      if (!speciesById[id]) return;
      if (picks.length >= MAX_DISTINCT_SPECIES && !picks.some(function (p) { return p.id === id; })) return;
      if (totalIndividuals() >= MAX_INDIVIDUALS) return;
      var existing = picks.filter(function (p) { return p.id === id; })[0];
      if (existing) {
        if (totalIndividuals() >= MAX_INDIVIDUALS) return;
        existing.count++;
      } else {
        if (picks.length >= MAX_DISTINCT_SPECIES) return;
        picks.push({ id: id, count: 1 });
      }
      refresh();
    }

    function tryAddFromSearch() {
      var q = (searchEl.value || '').trim().toLowerCase();
      if (!q) return;
      var match = null;
      for (var i = 0; i < speciesList.length; i++) {
        var s = speciesList[i];
        if (s.id === q || s.displayName.toLowerCase() === q) {
          match = s;
          break;
        }
        if (s.displayName.toLowerCase().indexOf(q) !== -1 || s.id.indexOf(q) !== -1) {
          match = s;
          break;
        }
      }
      if (match) {
        addSpeciesById(match.id);
        searchEl.value = '';
      } else {
        setStatus('No species match that search.', true);
        setTimeout(function () { setStatus(''); }, 2400);
      }
    }

    volumeEl.addEventListener('input', refresh);
    addBtn.addEventListener('click', tryAddFromSearch);
    searchEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        tryAddFromSearch();
      }
    });

    fetch(root.getAttribute('data-pack') || '/data/community-stress-lab-species-v1.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (pack) {
        speciesList = pack.species || [];
        for (var i = 0; i < speciesList.length; i++) {
          speciesById[speciesList[i].id] = speciesList[i];
        }
        var dl = document.getElementById('csl-species-datalist');
        if (dl) {
          dl.innerHTML = speciesList
            .map(function (s) {
              return '<option value="' + escapeHtml(s.id) + '">' + escapeHtml(s.displayName) + '</option>';
            })
            .join('');
        }
        setStatus('');
        refresh();
      })
      .catch(function () {
        setStatus('Could not load species data. Check your connection and refresh.', true);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
