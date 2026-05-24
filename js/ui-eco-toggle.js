/* ============================================================
   ui-eco-toggle.js
   Extracted from js/ui.js (PR #233) — behaviour unchanged.
   Header eco-toggle (fauna/flora) + window.__arApply{Fauna,Flora} bridge.
   ============================================================ */

/* ── ECOSYSTEM TOGGLE ── */
(function () {
  var faunaBtn  = document.getElementById('fauna-btn');
  var floraBtn  = document.getElementById('flora-btn');
  var fishLayer = document.getElementById('fish-layer');
  var plants    = document.getElementById('plants');
  var driftwood = document.getElementById('driftwood-layer');

  var faunaOff = localStorage.getItem('ar_fauna') === '0';
  var floraOff = localStorage.getItem('ar_flora') === '0';

  function applyFauna(off) {
    faunaOff = off;
    if (faunaBtn) {
      faunaBtn.classList.toggle('off', off);
      faunaBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
      faunaBtn.title = off ? 'Show fish' : 'Hide fish';
    }
    if (fishLayer) { fishLayer.style.transition = 'opacity .6s'; fishLayer.style.opacity = off ? '0' : ''; }
    localStorage.setItem('ar_fauna', off ? '0' : '1');
  }

  function applyFlora(off) {
    floraOff = off;
    if (floraBtn) {
      floraBtn.classList.toggle('off', off);
      floraBtn.setAttribute('aria-pressed', off ? 'true' : 'false');
      floraBtn.title = off ? 'Show plants' : 'Hide plants';
    }
    if (plants)    { plants.style.transition    = 'opacity .6s'; plants.style.opacity    = off ? '0' : ''; }
    if (driftwood) { driftwood.style.transition = 'opacity .6s'; driftwood.style.opacity = off ? '0' : ''; }
    localStorage.setItem('ar_flora', off ? '0' : '1');
  }

  if (faunaBtn) faunaBtn.addEventListener('click', function (e) { e.stopPropagation(); applyFauna(!faunaOff); });
  if (floraBtn) floraBtn.addEventListener('click', function (e) { e.stopPropagation(); applyFlora(!floraOff); });

  if (faunaOff) applyFauna(true);
  if (floraOff) applyFlora(true);

  window.__arApplyFauna = applyFauna;
  window.__arApplyFlora = applyFlora;
  window.__arGetFauna   = function () { return faunaOff; };
  window.__arGetFlora   = function () { return floraOff; };
})();
