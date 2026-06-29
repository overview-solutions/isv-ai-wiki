/**
 * ISV task tracker — GitHub Issues for overview-solutions/isv-ai-wiki
 */
(function (global) {
  'use strict';

  var CONFIG_URL = 'tasks/config.json';
  var cache = { config: null, issues: null, loadPromise: null };

  function tasksBasePath() {
    var path = location.pathname.replace(/\/[^/]*$/, '/');
    if (path.includes('/technical-notes/')) return '../../';
    return path.endsWith('/') ? path : path + '/';
  }

  function resolveUrl(relative) {
    var base = tasksBasePath();
    if (location.protocol === 'file:') return base + relative;
    return new URL(relative, location.href).href;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pillClass(status) {
    return 'task-pill task-pill-' + (status || 'not_started');
  }

  function statusLabel(data, status) {
    return (data.statusLegend && data.statusLegend[status])
      ? data.statusLegend[status].label
      : status;
  }

  function meetingLink(meeting, data) {
    var m = data.meetings && data.meetings[meeting];
    if (!m) return '#';
    var isIndex = /index\.html$/.test(location.pathname) || location.pathname.endsWith('/');
    if (isIndex) return '#' + m.hash;
    return 'index.html#' + m.hash;
  }

  function meetingStandaloneLink(meeting, data) {
    var m = data.meetings && data.meetings[meeting];
    if (!m || !m.standalone) return null;
    return tasksBasePath() + m.standalone;
  }

  function wikiSiteRoot() {
    if (/isv\.wiki$/i.test(location.hostname)) return 'https://isv.wiki';
    if (location.pathname.indexOf('/isv-ai-wiki') === 0) {
      return location.origin + '/isv-ai-wiki';
    }
    return location.origin;
  }

  function deployedWikiHref(hashPath) {
    hashPath = hashPath || 'index.html';
    if (location.protocol === 'file:') return wikiSiteRoot() + '/' + hashPath.replace(/^\//, '');
    return wikiSiteRoot() + '/' + hashPath.replace(/^\//, '');
  }

  function wikiTasksHref(queryString) {
    var qs = queryString || '';
    if (qs && qs.charAt(0) !== '?') qs = '?' + qs;
    var isIndex = /index\.html$/.test(location.pathname) || location.pathname.endsWith('/');
    if (isIndex) return '#tasks' + qs;
    return tasksBasePath() + 'index.html#tasks' + qs;
  }

  function githubIssueUrl(config, number) {
    return config.github.issuesUrl + '/' + number;
  }

  function githubNewIssueUrl(config, options) {
    options = options || {};
    var url = config.github.chooseTemplateUrl || config.github.newIssueUrl;
    var params = new URLSearchParams();
    if (options.title) params.set('title', options.title);
    if (options.body) params.set('body', options.body);
    if (options.labels && options.labels.length) params.set('labels', options.labels.join(','));
    var qs = params.toString();
    return qs ? url + (url.indexOf('?') >= 0 ? '&' : '?') + qs : url;
  }

  function meetingLabelForId(config, meetingId) {
    var m = config.meetings && config.meetings[meetingId];
    if (!m) return '';
    if (m.label) return m.label;
    return (config.labelPrefix.meeting || 'meeting-') + meetingId;
  }

  function meetingIdFromLabels(config, labels) {
    var prefix = config.labelPrefix.meeting || 'meeting-';
    var names = (labels || []).map(function (l) { return l.name; });
    var i;
    for (i = 0; i < names.length; i++) {
      if (names[i].indexOf(prefix) === 0) return names[i].slice(prefix.length);
    }
    return '';
  }

  function priorityFromLabels(config, labels) {
    var prefix = config.labelPrefix.priority || 'priority-';
    var names = (labels || []).map(function (l) { return l.name; });
    for (var i = 0; i < names.length; i++) {
      if (names[i].indexOf(prefix) === 0) return names[i].slice(prefix.length);
    }
    return '';
  }

  function statusFromIssue(config, issue) {
    if (issue.state === 'closed') return 'done';
    var labels = issue.labels || [];
    var names = labels.map(function (l) { return typeof l === 'string' ? l : l.name; });
    var blocked = config.statusLabels.blocked || ['blocked'];
    var inProg = config.statusLabels.in_progress || ['in-progress'];
    if (names.some(function (n) { return blocked.indexOf(n) >= 0; })) return 'blocked';
    if (names.some(function (n) { return inProg.indexOf(n) >= 0; })) return 'in_progress';
    var rules = config.statusRules || {};
    if (rules.inProgressWhenComments !== false && (issue.comments || 0) > 0) {
      return 'in_progress';
    }
    return 'not_started';
  }

  function taskTagsFromLabels(config, labels, meetingId) {
    var prefixMeeting = config.labelPrefix.meeting || 'meeting-';
    var prefixPriority = config.labelPrefix.priority || 'priority-';
    var system = ['task'].concat(
      config.statusLabels.in_progress || [],
      config.statusLabels.blocked || []
    );
    return (labels || []).map(function (l) { return l.name; }).filter(function (name) {
      if (system.indexOf(name) >= 0) return false;
      if (name.indexOf(prefixMeeting) === 0) return false;
      if (name.indexOf(prefixPriority) === 0) return false;
      return true;
    }).sort();
  }

  function issueToTask(config, issue) {
    var meeting = meetingIdFromLabels(config, issue.labels);
    var status = statusFromIssue(config, issue);
    var assignee = 'Unassigned';
    if (issue.assignees && issue.assignees.length) {
      assignee = issue.assignees.map(function (a) { return a.login; }).join(', ');
    }
    return {
      id: '#' + issue.number,
      number: issue.number,
      title: issue.title,
      status: status,
      assignee: assignee,
      meeting: meeting,
      priority: priorityFromLabels(config, issue.labels),
      tags: taskTagsFromLabels(config, issue.labels, meeting),
      notes: issue.body || '',
      url: issue.html_url,
      state: issue.state,
      comments: issue.comments || 0,
      updatedAt: issue.updated_at,
      createdAt: issue.created_at,
      labels: (issue.labels || []).map(function (l) { return l.name; })
    };
  }

  function isFileProtocol() {
    return location.protocol === 'file:';
  }

  function renderFileProtocolHelp() {
    return '<div class="tasks-api-error">' +
      '<strong>Tasks need a web server — not <code>file://</code></strong>' +
      '<p style="margin:0.5rem 0 0;font-size:13px;line-height:1.55">Opening <code>index.html</code> directly in the browser blocks <code>fetch</code> (CORS). The Tasks page cannot load <code>tasks/config.json</code> or the GitHub API that way.</p>' +
      '<p style="margin:0.75rem 0 0;font-size:13px;line-height:1.55"><strong>Local:</strong> run <code>./preview.sh</code> in this repo, then open <a href="http://localhost:8765/index.html#tasks">http://localhost:8765/index.html#tasks</a>.</p>' +
      '<p style="margin:0.5rem 0 0;font-size:13px;line-height:1.55"><strong>Deployed:</strong> <a href="' + escapeHtml(deployedWikiHref('index.html#tasks')) + '" target="_blank" rel="noopener">' + escapeHtml(wikiSiteRoot()) + '</a> · or manage issues on <a href="https://github.com/overview-solutions/isv-ai-wiki/issues" target="_blank" rel="noopener">GitHub ↗</a>.</p>' +
    '</div>';
  }

  function loadConfig() {
    return fetch(resolveUrl(CONFIG_URL))
      .then(function (r) {
        if (!r.ok) throw new Error('Config unavailable');
        return r.json();
      });
  }

  function fetchAllIssues(config) {
    var api = 'https://api.github.com/repos/' +
      config.github.owner + '/' + config.github.repo + '/issues';
    var issues = [];
    var page = 1;

    function fetchPage() {
      var url = api + '?state=all&per_page=100&page=' + page + '&sort=updated&direction=desc';
      return fetch(url, { headers: { Accept: 'application/vnd.github+json' } })
        .then(function (r) {
          if (!r.ok) {
            var err = new Error('GitHub API error ' + r.status);
            err.status = r.status;
            throw err;
          }
          return r.json().then(function (data) {
            var batch = data.filter(function (item) { return !item.pull_request; });
            issues = issues.concat(batch);
            if (data.length === 100) {
              page += 1;
              return fetchPage();
            }
            return issues;
          });
        });
    }

    return fetchPage();
  }

  function loadTasks() {
    if (cache.config && cache.issues) {
      return Promise.resolve({ config: cache.config, issues: cache.issues, tasks: cache.tasks });
    }
    if (cache.loadPromise) return cache.loadPromise;

    cache.loadPromise = loadConfig()
      .then(function (config) {
        return fetchAllIssues(config).then(function (raw) {
          var tasks = raw.map(function (issue) { return issueToTask(config, issue); });
          cache.config = config;
          cache.issues = raw;
          cache.tasks = tasks;
          return { config: config, issues: raw, tasks: tasks };
        });
      })
      .catch(function (err) {
        return loadConfig().then(function (config) {
          return { config: config, issues: [], tasks: [], error: err };
        }).catch(function () {
          return { config: { meetings: {}, statusLegend: {}, github: { issuesUrl: 'https://github.com/overview-solutions/isv-ai-wiki/issues' } }, issues: [], tasks: [], error: err };
        });
      });

    return cache.loadPromise;
  }

  function invalidateCache() {
    cache = { config: null, issues: null, loadPromise: null };
  }

  function tasksForMeeting(data, meetingId) {
    return (data.tasks || []).filter(function (t) { return t.meeting === meetingId; });
  }

  function completionStats(tasks) {
    var total = tasks.length;
    var done = tasks.filter(function (t) { return t.status === 'done'; }).length;
    var inProgress = tasks.filter(function (t) { return t.status === 'in_progress'; }).length;
    var blocked = tasks.filter(function (t) { return t.status === 'blocked'; }).length;
    var open = tasks.filter(function (t) { return t.status === 'not_started'; }).length;
    var pct = total ? Math.round((done / total) * 100) : 0;
    return { total: total, done: done, inProgress: inProgress, blocked: blocked, open: open, pct: pct };
  }

  function taskTags(task) {
    return task.tags || [];
  }

  function collectAllTags(tasks) {
    var seen = {};
    (tasks || []).forEach(function (t) {
      taskTags(t).forEach(function (tag) { seen[tag] = true; });
    });
    return Object.keys(seen).sort();
  }

  function tagFilterHref(tag) {
    return wikiTasksHref('tag=' + encodeURIComponent(tag));
  }

  function renderTagsHtml(tags, options) {
    options = options || {};
    if (!tags.length) return options.empty != null ? options.empty : '—';
    return '<span class="task-tags">' + tags.map(function (tag) {
      var label = tag.indexOf('#') === 0 ? tag : tag;
      if (options.filterable) {
        return '<a class="task-tag" href="' + escapeHtml(tagFilterHref(tag)) + '">' + escapeHtml(label) + '</a>';
      }
      return '<span class="task-tag">' + escapeHtml(label) + '</span>';
    }).join('') + '</span>';
  }

  function formatWhen(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function truncate(text, len) {
    var s = String(text || '').trim();
    if (s.length <= len) return s;
    return s.slice(0, len - 1) + '…';
  }

  function renderGithubToolbar(config, options) {
    options = options || {};
    var newUrl = githubNewIssueUrl(config, {
      labels: options.meeting ? [meetingLabelForId(config, options.meeting)] : ['task']
    });
    return '<div class="tasks-github-bar">' +
      '<a class="task-github-btn" href="' + escapeHtml(config.github.issuesUrl) + '" target="_blank" rel="noopener">All issues on GitHub ↗</a>' +
      '<a class="task-github-btn task-github-btn-primary" href="' + escapeHtml(newUrl) + '" target="_blank" rel="noopener">New follow-up ↗</a>' +
      '<span class="tasks-github-hint">Click a task to open it on GitHub — create, comment, assign, and close there.</span>' +
    '</div>';
  }

  function renderErrorBanner(data) {
    if (!data.error) return '';
    var msg = data.error.status === 403
      ? 'GitHub API rate limit reached. Open issues directly on GitHub.'
      : 'Could not load issues from GitHub. Open the repo issues page instead.';
    return '<div class="tasks-api-error">' +
      '<strong>' + escapeHtml(msg) + '</strong>' +
      ' <a href="' + escapeHtml(data.config.github.issuesUrl) + '" target="_blank" rel="noopener">View issues ↗</a>' +
    '</div>';
  }

  function redirectToGithubIssue(config, issueNum) {
    window.location.href = githubIssueUrl(config, issueNum);
  }

  function buildListQuery(options) {
    options = options || {};
    var q = new URLSearchParams();
    if (options.meeting) q.set('meeting', options.meeting);
    if (options.status) q.set('status', options.status);
    if (options.assignee) q.set('assignee', options.assignee);
    if (options.tag) q.set('tag', options.tag);
    var s = q.toString();
    return s ? '?' + s : '';
  }

  function renderMeetingPanel(meetingId, containerId) {
    var el = document.getElementById(containerId || 'follow-ups-panel');
    if (!el) return;
    if (isFileProtocol()) {
      el.innerHTML =
        '<div class="follow-ups-panel">' +
          '<div class="follow-ups-foot">Follow-ups load from GitHub when served over HTTP. Run <code>./preview.sh</code> or use the <a href="' + escapeHtml(deployedWikiHref('index.html#tasks')) + '" target="_blank" rel="noopener">deployed wiki</a>.</div>' +
        '</div>';
      return;
    }
    loadTasks().then(function (data) {
      var config = data.config;
      if (data.error) {
        el.innerHTML =
          '<div class="follow-ups-panel">' +
            renderErrorBanner(data) +
          '</div>';
        return;
      }
      var tasks = tasksForMeeting(data, meetingId);
      if (!tasks.length && !data.error) {
        var label = meetingLabelForId(config, meetingId);
        el.innerHTML =
          '<div class="follow-ups-panel">' +
            '<div class="follow-ups-head"><strong>Follow-ups from this session</strong></div>' +
            '<div class="follow-ups-foot">' +
              'No GitHub issues with label <code>' + escapeHtml(label) + '</code> yet. ' +
              '<a href="' + escapeHtml(githubNewIssueUrl(config, { labels: [label] })) + '" target="_blank" rel="noopener">Create follow-up ↗</a>' +
            '</div>' +
          '</div>';
        return;
      }
      if (!tasks.length) return;
      var stats = completionStats(tasks);
      var meeting = config.meetings && config.meetings[meetingId];
      var sorted = tasks.slice().sort(function (a, b) {
        var order = { blocked: 0, in_progress: 1, not_started: 2, done: 3 };
        return (order[a.status] || 9) - (order[b.status] || 9);
      });
      var list = sorted.map(function (t) {
        var tags = taskTags(t);
        return '<li>' +
          '<span class="' + pillClass(t.status) + '">' + escapeHtml(statusLabel(config, t.status)) + '</span>' +
          '<span class="task-title"><a class="task-open-link" href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener">' + escapeHtml(t.title) + '</a>' +
            (tags.length ? '<span class="task-tags-inline">' + renderTagsHtml(tags) + '</span>' : '') +
          '</span>' +
          '<span class="task-meta">Assigned: <strong>' + escapeHtml(t.assignee) + '</strong>' +
          (t.comments ? ' · ' + t.comments + ' comment' + (t.comments === 1 ? '' : 's') : '') +
          '</span>' +
          '</li>';
      }).join('');

      var tasksPage = wikiTasksHref('');
      var newUrl = githubNewIssueUrl(config, { labels: [meetingLabelForId(config, meetingId)] });

      el.innerHTML =
        '<div class="follow-ups-panel">' +
          '<div class="follow-ups-head">' +
            '<strong>Follow-ups from this session</strong>' +
            '<div class="follow-ups-summary">' +
              '<span class="' + pillClass('done') + '">' + stats.done + ' done</span>' +
              '<span class="' + pillClass('in_progress') + '">' + stats.inProgress + ' active</span>' +
              '<span class="' + pillClass('not_started') + '">' + stats.open + ' open</span>' +
              (stats.blocked ? '<span class="' + pillClass('blocked') + '">' + stats.blocked + ' blocked</span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="follow-ups-progress" aria-hidden="true"><div class="follow-ups-progress-bar" style="width:' + stats.pct + '%"></div></div>' +
          '<ul class="follow-ups-list">' + list + '</ul>' +
          '<div class="follow-ups-foot">' +
            stats.pct + '% complete · <a href="' + tasksPage + '">All tasks</a>' +
            ' · <a href="' + escapeHtml(newUrl) + '" target="_blank" rel="noopener">Add follow-up ↗</a>' +
            ' · <a href="' + escapeHtml(wikiTasksHref('meeting=' + encodeURIComponent(meetingId))) + '">Filter in wiki</a>' +
          '</div>' +
        '</div>';
    });
  }

  function renderTaskPage(options) {
    options = options || {};
    var root = document.getElementById('tasks-root');
    if (!root) return;

    if (isFileProtocol()) {
      root.innerHTML = renderFileProtocolHelp();
      return;
    }

    root.innerHTML = '<p style="color:var(--text-3);font-size:14px">Loading issues from GitHub…</p>';

    loadTasks().then(function (data) {
      var config = data.config;
      var filterStatus = options.status || '';
      var filterMeeting = options.meeting || '';
      var filterAssignee = options.assignee || '';
      var filterTag = options.tag || '';

      var params = new URLSearchParams(location.search);
      var hashOpts = parseTasksHash();
      if (!filterMeeting && (params.get('meeting') || hashOpts.meeting)) {
        filterMeeting = params.get('meeting') || hashOpts.meeting;
      }
      if (!filterStatus && (params.get('status') || hashOpts.status)) {
        filterStatus = params.get('status') || hashOpts.status;
      }
      if (!filterTag && (params.get('tag') || hashOpts.tag)) {
        filterTag = params.get('tag') || hashOpts.tag;
      }
      if (!filterAssignee && (params.get('assignee') || hashOpts.assignee)) {
        filterAssignee = params.get('assignee') || hashOpts.assignee;
      }

      var issueNum = parseInt(options.issue || hashOpts.issue || params.get('issue') || params.get('task') || '', 10);

      if (issueNum) {
        redirectToGithubIssue(config, issueNum);
        return;
      }

      var all = data.tasks || [];
      var stats = completionStats(all);
      var assignees = [];
      all.forEach(function (t) {
        if (t.assignee && t.assignee !== 'Unassigned' && assignees.indexOf(t.assignee) < 0) {
          assignees.push(t.assignee);
        }
      });
      assignees.sort();

      var allTags = collectAllTags(all);
      var tagOptions = allTags.map(function (tag) {
        return '<option value="' + escapeHtml(tag) + '"' + (filterTag === tag ? ' selected' : '') + '>' +
          escapeHtml(tag) + '</option>';
      }).join('');

      var filtered = all.filter(function (t) {
        if (filterStatus && t.status !== filterStatus) return false;
        if (filterMeeting && t.meeting !== filterMeeting) return false;
        if (filterAssignee && t.assignee !== filterAssignee) return false;
        if (filterTag && taskTags(t).indexOf(filterTag) < 0) return false;
        return true;
      });

      filtered.sort(function (a, b) {
        var sm = { blocked: 0, in_progress: 1, not_started: 2, done: 3 };
        var d = (sm[a.status] || 9) - (sm[b.status] || 9);
        if (d !== 0) return d;
        return (b.number || 0) - (a.number || 0);
      });

      var meetingOptions = Object.keys(config.meetings || {}).map(function (id) {
        var m = config.meetings[id];
        return '<option value="' + escapeHtml(id) + '"' + (filterMeeting === id ? ' selected' : '') + '>' +
          escapeHtml(m.title) + ' (' + escapeHtml(m.date) + ')</option>';
      }).join('');

      var assigneeOptions = assignees.map(function (a) {
        return '<option value="' + escapeHtml(a) + '"' + (filterAssignee === a ? ' selected' : '') + '>' +
          escapeHtml(a) + '</option>';
      }).join('');

      var rows = filtered.map(function (t) {
        var m = config.meetings && config.meetings[t.meeting];
        var meetLabel = m ? m.title + ' · ' + m.date : (t.meeting || '—');
        var meetHref = t.meeting ? meetingLink(t.meeting, config) : '';
        var meetCell = meetHref
          ? '<a href="' + meetHref + '">' + escapeHtml(meetLabel) + '</a>'
          : escapeHtml(meetLabel);
        var tags = taskTags(t);
        return '<tr>' +
          '<td class="task-id"><a href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener">' + escapeHtml(t.id) + '</a></td>' +
          '<td><a class="task-open-link" href="' + escapeHtml(t.url) + '" target="_blank" rel="noopener">' + escapeHtml(t.title) + '</a>' +
            (t.notes ? '<div style="font-size:11px;color:var(--text-3);margin-top:2px">' + escapeHtml(truncate(t.notes, 120)) + '</div>' : '') +
          '</td>' +
          '<td class="task-tags-col">' + renderTagsHtml(tags, { filterable: true }) + '</td>' +
          '<td><span class="' + pillClass(t.status) + '">' + escapeHtml(statusLabel(config, t.status)) + '</span></td>' +
          '<td>' + escapeHtml(t.assignee) + '</td>' +
          '<td class="task-updated-col">' + escapeHtml(formatWhen(t.updatedAt)) + '</td>' +
          '<td>' + meetCell + '</td>' +
          '</tr>';
      }).join('');

      var byMeeting = Object.keys(config.meetings || {}).map(function (mid) {
        var mt = tasksForMeeting(data, mid);
        var st = completionStats(mt);
        var m = config.meetings[mid];
        return '<div class="tasks-by-meeting">' +
          '<h3>' + escapeHtml(m.title) + ' <span style="font-weight:400;color:var(--text-3)">· ' + st.pct + '% done</span></h3>' +
          '<div class="follow-ups-progress" style="margin:0 0 0.5rem"><div class="follow-ups-progress-bar" style="width:' + st.pct + '%"></div></div>' +
          '</div>';
      }).join('');

      root.innerHTML =
        renderErrorBanner(data) +
        renderGithubToolbar(config, { meeting: filterMeeting }) +
        '<div class="tasks-stats">' +
          '<div class="tasks-stat"><strong>' + stats.total + '</strong><span>Total issues</span></div>' +
          '<div class="tasks-stat"><strong style="color:var(--green)">' + stats.done + '</strong><span>Done</span></div>' +
          '<div class="tasks-stat"><strong style="color:var(--amber)">' + stats.inProgress + '</strong><span>In progress</span></div>' +
          '<div class="tasks-stat"><strong>' + stats.open + '</strong><span>Not started</span></div>' +
          '<div class="tasks-stat"><strong style="color:var(--red)">' + stats.blocked + '</strong><span>Blocked</span></div>' +
          '<div class="tasks-stat"><strong>' + stats.pct + '%</strong><span>Overall complete</span></div>' +
        '</div>' +
        (all.length ? '<div class="tasks-by-meeting-wrap">' + byMeeting + '</div>' : '') +
        '<div class="tasks-filters">' +
          '<select id="tasks-filter-meeting" aria-label="Filter by meeting"><option value="">All meetings</option>' + meetingOptions + '</select>' +
          '<select id="tasks-filter-status" aria-label="Filter by status">' +
            '<option value="">All statuses</option>' +
            '<option value="not_started"' + (filterStatus === 'not_started' ? ' selected' : '') + '>Not started</option>' +
            '<option value="in_progress"' + (filterStatus === 'in_progress' ? ' selected' : '') + '>In progress</option>' +
            '<option value="blocked"' + (filterStatus === 'blocked' ? ' selected' : '') + '>Blocked</option>' +
            '<option value="done"' + (filterStatus === 'done' ? ' selected' : '') + '>Done</option>' +
          '</select>' +
          '<select id="tasks-filter-assignee" aria-label="Filter by assignee"><option value="">All assignees</option>' + assigneeOptions + '</select>' +
          '<select id="tasks-filter-tag" aria-label="Filter by tag"><option value="">All tags</option>' + tagOptions + '</select>' +
        '</div>' +
        '<div class="tasks-table-wrap">' +
          (filtered.length
            ? '<table class="tasks-table"><thead><tr><th>Issue</th><th>Task</th><th>Tags</th><th>Status</th><th>Assignee</th><th>Updated</th><th>Meeting</th></tr></thead><tbody>' + rows + '</tbody></table>'
            : '<div class="tasks-empty">No issues match the current filters. <a href="' + escapeHtml(githubNewIssueUrl(config)) + '" target="_blank" rel="noopener">Create one on GitHub ↗</a></div>') +
        '</div>' +
        '<p class="tasks-source-note">Tasks are <a href="' + escapeHtml(config.github.issuesUrl) + '" target="_blank" rel="noopener">GitHub Issues</a> on <code>overview-solutions/isv-ai-wiki</code>. Click any row to open the issue on GitHub.</p>';

      function applyFilters() {
        var m = document.getElementById('tasks-filter-meeting');
        var s = document.getElementById('tasks-filter-status');
        var a = document.getElementById('tasks-filter-assignee');
        var tg = document.getElementById('tasks-filter-tag');
        var q = new URLSearchParams();
        if (m && m.value) q.set('meeting', m.value);
        if (s && s.value) q.set('status', s.value);
        if (a && a.value) q.set('assignee', a.value);
        if (tg && tg.value) q.set('tag', tg.value);
        var qs = q.toString();
        history.replaceState(null, '', '#tasks' + (qs ? '?' + qs : ''));
        renderTaskPage({
          meeting: m ? m.value : '',
          status: s ? s.value : '',
          assignee: a ? a.value : '',
          tag: tg ? tg.value : ''
        });
      }

      ['tasks-filter-meeting', 'tasks-filter-status', 'tasks-filter-assignee', 'tasks-filter-tag'].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) node.onchange = applyFilters;
      });

      history.replaceState(null, '', '#tasks' + buildListQuery({
        meeting: filterMeeting,
        status: filterStatus,
        assignee: filterAssignee,
        tag: filterTag
      }));
    });
  }

  function parseTasksHash() {
    var raw = (location.hash || '').replace(/^#/, '');
    if (!raw.startsWith('tasks')) return {};
    var qIdx = raw.indexOf('?');
    if (qIdx < 0) return {};
    var params = new URLSearchParams(raw.slice(qIdx + 1));
    return {
      meeting: params.get('meeting') || '',
      status: params.get('status') || '',
      assignee: params.get('assignee') || '',
      tag: params.get('tag') || '',
      issue: params.get('issue') || params.get('task') || ''
    };
  }

  global.ISVTasks = {
    load: loadTasks,
    renderMeetingPanel: renderMeetingPanel,
    renderTaskPage: renderTaskPage,
    parseTasksHash: parseTasksHash,
    invalidateCache: invalidateCache
  };
})(typeof window !== 'undefined' ? window : this);
