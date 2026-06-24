/**
 * Live Dev Labs report index — parses openami-smart-village/reports/index.html
 * and merges wiki enrichments from technical-notes/catalog.json.
 */
(function () {
  const REPORTS_INDEX_URL =
    'https://raw.githubusercontent.com/rahulbhargavain/openami-smart-village/main/reports/index.html';
  const COTTONSPACE_BASE = 'https://sattal.cottonspace.com/reports';
  const GITHUB_REPO = 'https://github.com/rahulbhargavain/openami-smart-village';

  const CATEGORY_TYPE = {
    'Regulatory Strategy': 'regulatory-strategy',
    'Funding Pitch': 'funding-pitch',
    'Policy Framework': 'policy-framework',
    'Technical Reference': 'technical-reference',
    'Strategic Synthesis': 'strategic-synthesis',
    'Regulatory Analysis': 'regulatory-analysis',
    'Engineering Critique': 'engineering-critique',
    'Investment Pitch': 'investment-pitch',
    'Vehicle Assessment': 'vehicle-assessment',
    'Industry Letter': 'industry-letter',
  };

  const REPORT_SEGMENT_CATEGORY = {
    REG: 'Regulatory Strategy',
    TRD: 'Technical Reference',
    PITCH: 'Funding Pitch',
    NEX: 'Strategic Synthesis',
    CR: 'Engineering Critique',
    CRIT: 'Engineering Critique',
    TECH: 'Technical Reference',
    SSA: 'Vehicle Assessment',
    STS: 'Industry Letter',
  };

  const SPECIAL_CATEGORY = {
    'EMG-PITCH-002': 'Investment Pitch',
    'SSA-STS-LEGACY-2026-001': 'Industry Letter',
  };

  function stripHtml(text) {
    const el = document.createElement('div');
    el.innerHTML = text;
    return (el.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function inferCategory(reportCode, dataCategory) {
    if (dataCategory === 'critique') return 'Engineering Critique';
    if (SPECIAL_CATEGORY[reportCode]) return SPECIAL_CATEGORY[reportCode];
    const parts = (reportCode || '').split('-');
    if (parts.length >= 2 && REPORT_SEGMENT_CATEGORY[parts[1]]) {
      return REPORT_SEGMENT_CATEGORY[parts[1]];
    }
    return (
      {
        technical: 'Technical Reference',
        policy: 'Regulatory Strategy',
        funding: 'Funding Pitch',
        critique: 'Engineering Critique',
      }[dataCategory] || 'Report'
    );
  }

  function slugFromCode(code) {
    return (code || '').toLowerCase().replace(/\s+/g, '-');
  }

  function parseIndexHtml(raw) {
    const cards = [];
    const parts = raw.split('<div class="card"');
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      const dataCatM = part.match(/data-category="([^"]+)"/);
      const dataCategory = dataCatM ? dataCatM[1] : '';
      const hrefM = part.match(/href="([^"]+\.html)"/);
      if (!hrefM) continue;

      const href = hrefM[1].replace(/^\//, '');
      const filename = href.startsWith('reports/') ? href.split('/').pop() : href.split('/').pop();

      const statusM = part.match(/class="card-status[^"]*">([^<]+)/);
      const titleM = part.match(/class="card-title">([\s\S]*?)<\/h2>/);
      const descM = part.match(/class="card-desc">([^<]+)/);

      let reportCode = '';
      if (statusM) {
        const statusLine = stripHtml(statusM[1]);
        if (statusLine.includes(' · ')) {
          reportCode = statusLine.split(' · ').pop().trim();
        }
      }

      const title = titleM ? stripHtml(titleM[1]) : filename;
      const summary = descM ? stripHtml(descM[1]) : '';
      const category = inferCategory(reportCode, dataCategory);

      cards.push({
        filename,
        reportCode,
        category,
        title,
        summary,
        url: `${COTTONSPACE_BASE}/${filename}`,
        sourceFile: `reports/${filename}`,
        githubUrl: `${GITHUB_REPO}/blob/main/reports/${filename}`,
        type: CATEGORY_TYPE[category] || 'report',
      });
    }
    return cards;
  }

  function matchEnrichment(enrichments, card) {
    for (const item of enrichments) {
      if (item.reportCode && item.reportCode === card.reportCode) return item;
    }
    for (const item of enrichments) {
      const url = item.url || '';
      if (url.endsWith(card.filename) || url === card.url) return item;
    }
    return null;
  }

  function mergeReportCatalog(enrichments, cards) {
    const items = [];
    const enrichmentList = Array.isArray(enrichments) ? enrichments : [];

    for (const card of cards) {
      const old = matchEnrichment(enrichmentList, card);
      items.push({
        id: old?.id || slugFromCode(card.reportCode || card.filename.replace('.html', '')),
        reportCode: card.reportCode,
        title: card.title,
        publisher: old?.publisher || 'Cottonspace Dev Labs',
        published: old?.published || 'May 2026',
        type: card.type,
        category: card.category,
        tags: old?.tags || [],
        url: card.url,
        sourceFile: card.sourceFile,
        githubUrl: card.githubUrl,
        sourceCatalog: 'cottonspace-dev-labs',
        summary: card.summary,
        isvRelevance: old?.isvRelevance || '',
        relatedMeetingNotes: old?.relatedMeetingNotes || [],
        mediumUrl: old?.mediumUrl,
      });
    }

    for (const item of enrichmentList) {
      if (item.syncProtected || (item.sourceCatalog && item.sourceCatalog !== 'cottonspace-dev-labs')) {
        if (!items.some((m) => m.id === item.id)) items.push(item);
      }
    }

    return items;
  }

  async function fetchLiveReports(enrichments, indexUrl) {
    const url = indexUrl || REPORTS_INDEX_URL;
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`Index fetch failed (${resp.status})`);
    const raw = await resp.text();
    const cards = parseIndexHtml(raw);
    if (!cards.length) throw new Error('No report cards in index');
    return { items: mergeReportCatalog(enrichments, cards), cardCount: cards.length, source: 'live' };
  }

  window.TechNotesCatalog = {
    REPORTS_INDEX_URL,
    parseIndexHtml,
    mergeReportCatalog,
    fetchLiveReports,
  };
})();
