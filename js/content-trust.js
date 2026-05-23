(function () {
  'use strict';

  // Tool pages (tank-builder, tank-simulator, community-stress-lab) have no <main>.
  // Only inject on standard reading articles.
  if (!document.querySelector('main')) return;

  var nav = document.getElementById('bnav');
  if (!nav) return;

  var style = document.createElement('style');
  style.textContent =
    '.art-trust{margin:2.5rem clamp(1.25rem,5vw,3rem) 1rem;padding:1.4rem 1.5rem;' +
    'border-top:1px solid rgba(235,240,236,.08);font-size:.78rem;' +
    'color:rgba(235,240,236,.44);line-height:1.72}' +
    '.art-trust-label{display:block;text-transform:uppercase;' +
    'letter-spacing:.08em;font-size:.68rem;margin-bottom:.55rem;' +
    'color:rgba(61,214,232,.48)}' +
    '.art-trust-body{margin:0 0 .35rem;font-weight:300}' +
    '.art-trust-cta{margin:1.1rem 0 0;padding-top:1.05rem;border-top:1px solid rgba(61,214,232,.2)}' +
    '.art-trust-cta-link{display:inline-block;font-size:.62rem;font-weight:600;letter-spacing:.16em;' +
    'text-transform:uppercase;color:rgba(61,214,232,.92)!important;text-decoration:none!important;' +
    'border-bottom:none!important}' +
    '.art-trust-cta-link:hover{color:rgba(190,245,255,.98)!important}' +
    '.art-trust-cta-note{margin:.45rem 0 0;font-size:.74rem;font-weight:300;color:rgba(235,240,236,.52);' +
    'line-height:1.65}' +
    '.art-trust a{color:rgba(61,214,232,.62);text-decoration:none;' +
    'border-bottom:1px solid rgba(61,214,232,.2)}' +
    '.art-trust a:hover{color:rgba(61,214,232,.9);border-bottom-color:rgba(61,214,232,.5)}' +
    '.art-trust-meta{margin-top:.9rem;font-size:.68rem;color:rgba(235,240,236,.26);' +
    'letter-spacing:.03em}';
  document.head.appendChild(style);

  var isSharePhotosPage = /\/share-photos\.html$/i.test(location.pathname || '');
  var photoInviteHtml = isSharePhotosPage
    ? ''
    : '<div class="art-trust-cta">' +
      '<a class="art-trust-cta-link" href="/share-photos.html">Share your tank photos →</a>' +
      '<p class="art-trust-cta-note">Offer aquarium images for editorial consideration in future guides.</p>' +
      '</div>';

  var section = document.createElement('section');
  section.className = 'art-trust';
  section.setAttribute('aria-label', 'About this content');
  section.innerHTML =
    '<span class="art-trust-label">About this content</span>' +
    '<p class="art-trust-body">This guide reflects established aquarium keeping principles ' +
    'and the ARA framework. Parameters and guidance are based on hobby consensus and ' +
    'field observation — not clinical research. For critical decisions — stocking, ' +
    'treatment, water chemistry — verify with ' +
    '<a href="https://fishbase.se" target="_blank" rel="noopener noreferrer">FishBase</a>, ' +
    '<a href="https://www.seriouslyfish.com" target="_blank" rel="noopener noreferrer">SeriouslyFish</a>, ' +
    'or consult a local aquarium specialist. Your tank and your observations always ' +
    'come first.</p>' +
    photoInviteHtml +
    '<p class="art-trust-meta">Content by Aquatic Rhythm · ARA framework · aquaticrhythm.com</p>';

  nav.parentNode.insertBefore(section, nav);
})();
