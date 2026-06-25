/**
 * Meter Interoperability standalone pages — embed mode (?embed=1)
 * Keeps in-iframe navigation on meter-*.html and delegates wiki hash links to parent.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);
  if (params.get('embed') !== '1') return;

  document.documentElement.classList.add('embed');

  var PAGE_BY_ID = {
    overview: 'meter-overview.html',
    'problems-today': 'meter-problems-today.html',
    vmrs: 'meter-vmrs.html',
    'vendor-study': 'meter-vendor-study.html',
    openami: 'openami.html'
  };

  var ID_BY_FILE = Object.keys(PAGE_BY_ID).reduce(function (acc, id) {
    acc[PAGE_BY_ID[id]] = id;
    return acc;
  }, {});

  function parentMeterNav(pageId) {
    if (window.parent === window) return false;
    if (typeof window.parent.showMeterPage === 'function') {
      window.parent.showMeterPage(pageId);
      return true;
    }
    return false;
  }

  function meterSrc(pageId) {
    return (PAGE_BY_ID[pageId] || PAGE_BY_ID.overview) + '?embed=1';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.target === '_top') return;

    var hashMatch = href.match(/index\.html#meter-study(?:\/([\w-]+))?\/?$/);
    if (hashMatch) {
      e.preventDefault();
      var pageId = hashMatch[1] || 'overview';
      if (!parentMeterNav(pageId)) location.href = meterSrc(pageId);
      return;
    }

    if (href === 'index.html' || href === './index.html' || href === '../index.html') {
      e.preventDefault();
      if (window.parent !== window && typeof window.parent.showSection === 'function') {
        window.parent.showSection('home');
      } else {
        a.target = '_top';
        location.href = href;
      }
      return;
    }

    var fileMatch = href.match(/^([^?#]*(?:meter-[\w-]+|openami)\.html)(?:[?#].*)?$/);
    if (fileMatch) {
      var file = fileMatch[1].replace(/^\.\//, '');
      var base = file.split('/').pop();
      var pageId = ID_BY_FILE[base];
      if (pageId && window.parent !== window) {
        e.preventDefault();
        if (!parentMeterNav(pageId)) location.href = meterSrc(pageId);
      }
    }
  }, true);
})();
