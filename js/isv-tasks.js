/**
 * ISV task tracker — loads tasks/tasks.json + optional local drafts (localStorage)
 */
(function (global) {
  'use strict';

  var TASKS_URL = 'tasks/tasks.json';
  var LOCAL_KEY = 'isv-user-tasks';
  var OVERLAY_KEY = 'isv-task-overlays';
  var AUTHOR_KEY = 'isv-task-author';
  var FLASH_KEY = 'isv-task-created-flash';
  var UPDATE_FLASH_KEY = 'isv-task-updated-flash';
  var GITHUB_TASKS_EDIT = 'https://github.com/overview-solutions/isv-ai-wiki/edit/main/tasks/tasks.json';
  var cache = null;
  var loadPromise = null;

  function tasksBasePath() {
    var path = location.pathname.replace(/\/[^/]*$/, '/');
    if (path.includes('/technical-notes/')) return '../../';
    return path.endsWith('/') ? path : path + '/';
  }

  function resolveTasksUrl() {
    var base = tasksBasePath();
    if (location.protocol === 'file:') return base + 'tasks/tasks.json';
    return new URL('tasks/tasks.json', location.href).href;
  }

  function getLocalTasks() {
    try {
      var raw = localStorage.getItem(LOCAL_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveLocalTask(task) {
    var list = getLocalTasks();
    list.push(task);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    cache = null;
    loadPromise = null;
  }

  function updateLocalTask(taskId, updater) {
    var list = getLocalTasks();
    var idx = list.findIndex(function (t) { return t.id === taskId; });
    if (idx < 0) return false;
    list[idx] = updater(list[idx]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
    cache = null;
    loadPromise = null;
    return true;
  }

  function getOverlays() {
    try {
      return JSON.parse(localStorage.getItem(OVERLAY_KEY) || '{}');
    } catch (e) {
      return {};
    }
  }

  function saveOverlay(taskId, overlay) {
    var all = getOverlays();
    all[taskId] = overlay;
    localStorage.setItem(OVERLAY_KEY, JSON.stringify(all));
    cache = null;
    loadPromise = null;
  }

  function getStoredAuthor() {
    return localStorage.getItem(AUTHOR_KEY) || '';
  }

  function setStoredAuthor(name) {
    if (name) localStorage.setItem(AUTHOR_KEY, name);
  }

  function applyOverlayToTask(task) {
    var overlay = getOverlays()[task.id];
    var merged = Object.assign({}, task);
    if (overlay) {
      ['status', 'assignee', 'deadline', 'priority', 'notes'].forEach(function (k) {
        if (overlay[k] != null && overlay[k] !== '') merged[k] = overlay[k];
      });
      if (overlay.tags) merged.tags = overlay.tags;
      merged._localEdits = true;
    }
    merged.history = buildTaskHistory(merged, overlay && overlay.history);
    return merged;
  }

  function buildTaskHistory(task, overlayHistory) {
    var base = task.history && task.history.length
      ? task.history.slice()
      : [{
          at: task._createdAt || '1970-01-01T00:00:00.000Z',
          type: 'created',
          status: task.status || 'not_started',
          by: 'tasks.json',
          comment: 'Task recorded in catalog'
        }];
    var extra = overlayHistory || [];
    return base.concat(extra).sort(function (a, b) {
      return new Date(a.at).getTime() - new Date(b.at).getTime();
    });
  }

  function findTaskById(data, taskId) {
    return (data.tasks || []).find(function (t) { return t.id === taskId; }) || null;
  }

  function mergeWithLocal(data) {
    var serverIds = {};
    var tasks = (data.tasks || []).map(function (t) {
      if (t.id) serverIds[t.id] = true;
      return applyOverlayToTask(t);
    });
    var local = getLocalTasks().filter(function (t) {
      return t.id && !serverIds[t.id];
    }).map(function (t) {
      var copy = Object.assign({}, t);
      copy.history = buildTaskHistory(copy, null);
      return copy;
    });
    if (!local.length) {
      return Object.assign({}, data, { tasks: tasks });
    }
    return Object.assign({}, data, {
      tasks: tasks.concat(local)
    });
  }

  function loadTasks() {
    if (cache) return Promise.resolve(cache);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(resolveTasksUrl())
      .then(function (r) {
        if (!r.ok) throw new Error('Tasks catalog unavailable');
        return r.json();
      })
      .then(function (data) {
        cache = mergeWithLocal(data);
        return cache;
      })
      .catch(function () {
        cache = mergeWithLocal({ tasks: [], meetings: {}, statusLegend: {} });
        return cache;
      });
    return loadPromise;
  }

  function invalidateCache() {
    cache = null;
    loadPromise = null;
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

  function prefixForMeeting(data, meetingId) {
    if (!meetingId || !data.meetings || !data.meetings[meetingId]) return 'gen';
    var group = data.meetings[meetingId].group;
    if (group === 'power-africa') return 'pa';
    if (group === 'tech-comm') return 'tc';
    return 'gen';
  }

  function nextTaskId(data, meetingId) {
    var prefix = prefixForMeeting(data, meetingId);
    var max = 0;
    (data.tasks || []).forEach(function (t) {
      var m = (t.id || '').match(new RegExp('^' + prefix + '-(\\d+)$'));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return prefix + '-' + String(max + 1).padStart(3, '0');
  }

  function taskToJsonSnippet(task) {
    var copy = {};
    ['id', 'title', 'status', 'assignee', 'meeting', 'priority', 'deadline', 'notes'].forEach(function (k) {
      if (task[k] != null && task[k] !== '') copy[k] = task[k];
    });
    var tags = taskTags(task);
    if (tags.length) copy.tags = tags;
    if (task.history && task.history.length) copy.history = task.history;
    return JSON.stringify(copy, null, 2);
  }

  function normalizeTags(raw) {
    if (raw == null || raw === '') return [];
    var parts = Array.isArray(raw)
      ? raw
      : String(raw).split(/[\s,]+/);
    var seen = {};
    return parts.map(function (part) {
      return String(part).trim().replace(/^#+/, '');
    }).filter(function (tag) {
      if (!tag || seen[tag]) return false;
      seen[tag] = true;
      return true;
    });
  }

  function taskTags(task) {
    return normalizeTags(task && task.tags);
  }

  function collectAllTags(tasks) {
    var seen = {};
    (tasks || []).forEach(function (t) {
      taskTags(t).forEach(function (tag) { seen[tag] = true; });
    });
    return Object.keys(seen).sort(function (a, b) { return a.localeCompare(b); });
  }

  function wikiTasksHref(queryString) {
    var qs = queryString || '';
    if (qs && qs.charAt(0) !== '?') qs = '?' + qs;
    var isIndex = /index\.html$/.test(location.pathname) || location.pathname.endsWith('/');
    if (isIndex) return '#tasks' + qs;
    return tasksBasePath() + 'index.html#tasks' + qs;
  }

  function tagFilterHref(tag) {
    return wikiTasksHref('tag=' + encodeURIComponent(tag));
  }

  function renderTagsHtml(tags, options) {
    options = options || {};
    if (!tags.length) return options.empty != null ? options.empty : '—';
    return '<span class="task-tags">' + tags.map(function (tag) {
      var label = '#' + tag;
      if (options.filterable) {
        return '<a class="task-tag" href="' + escapeHtml(tagFilterHref(tag)) + '" title="Filter by ' + escapeHtml(label) + '">' + escapeHtml(label) + '</a>';
      }
      return '<span class="task-tag">' + escapeHtml(label) + '</span>';
    }).join('') + '</span>';
  }

  function formatDeadline(deadline) {
    if (!deadline) return '—';
    var d = new Date(deadline + 'T12:00:00');
    if (isNaN(d.getTime())) return deadline;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function isDeadlineOverdue(deadline, status) {
    if (!deadline || status === 'done') return false;
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var d = new Date(deadline + 'T12:00:00');
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  function renderDeadlineCell(deadline, status) {
    if (!deadline) return '—';
    var label = formatDeadline(deadline);
    if (isDeadlineOverdue(deadline, status)) {
      return '<span class="task-deadline task-deadline-overdue" title="Past due">' + escapeHtml(label) + '</span>';
    }
    return '<span class="task-deadline">' + escapeHtml(label) + '</span>';
  }

  function renderMeetingContext(data, meetingId) {
    if (!meetingId) {
      return '<span class="task-meeting-context-hint">Optional — link this follow-up to the meeting where it was raised.</span>';
    }
    var m = data.meetings && data.meetings[meetingId];
    if (!m) return '';
    var wikiHref = meetingLink(meetingId, data);
    var standalone = meetingStandaloneLink(meetingId, data);
    var links =
      '<a href="' + escapeHtml(wikiHref) + '">Meeting notes in wiki</a>';
    if (standalone) {
      links += ' · <a href="' + escapeHtml(standalone) + '" target="_blank" rel="noopener">Full note page ↗</a>';
    }
    return '<div class="task-meeting-context-title">' + escapeHtml(m.title) + ' · ' + escapeHtml(m.date) + '</div>' +
      '<div class="task-meeting-context-links">' + links + '</div>';
  }

  function renderCreateForm(data, options) {
    var showForm = options.showCreateForm;
    var meetingOptions = '<option value="">No meeting (general task)</option>' +
      Object.keys(data.meetings || {}).map(function (id) {
        var m = data.meetings[id];
        var selected = options.createMeeting === id ? ' selected' : '';
        return '<option value="' + escapeHtml(id) + '"' + selected + '>' +
          escapeHtml(m.title) + ' (' + escapeHtml(m.date) + ')</option>';
      }).join('');

    var defaultMeeting = options.createMeeting || options.meeting || '';
    var contextHtml = renderMeetingContext(data, defaultMeeting);

    return '<div class="task-create-panel">' +
        '<div class="task-create-head">' +
          '<strong>New follow-up</strong>' +
          '<button type="button" class="task-create-toggle" id="task-create-toggle" aria-expanded="' + (showForm ? 'true' : 'false') + '">' +
            (showForm ? 'Hide form' : 'Add task') +
          '</button>' +
        '</div>' +
        '<div class="task-create-body' + (showForm ? ' is-open' : '') + '" id="task-create-body">' +
          '<form id="task-create-form" class="task-create-form">' +
            '<label class="task-form-field task-form-field-wide">' +
              '<span>Task description</span>' +
              '<input type="text" name="title" required maxlength="240" placeholder="What needs to be done?">' +
            '</label>' +
            '<label class="task-form-field">' +
              '<span>Assignee</span>' +
              '<input type="text" name="assignee" placeholder="Name or team">' +
            '</label>' +
            '<label class="task-form-field">' +
              '<span>Status</span>' +
              '<select name="status">' +
                '<option value="not_started">Not started</option>' +
                '<option value="in_progress">In progress</option>' +
                '<option value="blocked">Blocked</option>' +
                '<option value="done">Done</option>' +
              '</select>' +
            '</label>' +
            '<label class="task-form-field task-form-field-wide">' +
              '<span>From meeting</span>' +
              '<select name="meeting" id="task-create-meeting">' + meetingOptions + '</select>' +
            '</label>' +
            '<div class="task-meeting-context" id="task-meeting-context">' + contextHtml + '</div>' +
            '<label class="task-form-field">' +
              '<span>Priority</span>' +
              '<select name="priority">' +
                '<option value="">—</option>' +
                '<option value="high">High</option>' +
                '<option value="medium">Medium</option>' +
                '<option value="low">Low</option>' +
              '</select>' +
            '</label>' +
            '<label class="task-form-field">' +
              '<span>Deadline <span class="task-form-optional">(optional)</span></span>' +
              '<input type="date" name="deadline">' +
            '</label>' +
            '<label class="task-form-field task-form-field-wide">' +
              '<span>Tags <span class="task-form-optional">(optional)</span></span>' +
              '<input type="text" name="tags" placeholder="#PAC-workshop, metering, vendor-study">' +
              '<span class="task-form-hint">Comma-separated labels for grouping in reports (hash optional).</span>' +
            '</label>' +
            '<label class="task-form-field task-form-field-wide">' +
              '<span>Notes <span class="task-form-optional">(optional)</span></span>' +
              '<textarea name="notes" rows="2" placeholder="Context from the call…"></textarea>' +
            '</label>' +
            '<label class="task-form-field task-form-field-wide">' +
              '<span>Your name <span class="task-form-optional">(for history — login coming later)</span></span>' +
              '<input type="text" name="author" placeholder="Who is creating this?" value="' + escapeHtml(getStoredAuthor()) + '">' +
            '</label>' +
            '<div class="task-create-actions">' +
              '<button type="submit" class="task-create-submit">Create task</button>' +
            '</div>' +
          '</form>' +
        '</div>' +
      '</div>';
  }

  function formatHistoryWhen(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  }

  function historyEntryLabel(data, entry) {
    if (entry.type === 'created') {
      return 'Created · ' + escapeHtml(statusLabel(data, entry.status || 'not_started'));
    }
    if (entry.type === 'imported') return 'Imported from catalog';
    if (entry.type === 'status_change') {
      return 'Status · ' +
        escapeHtml(statusLabel(data, entry.from || '')) +
        ' → ' +
        escapeHtml(statusLabel(data, entry.to || ''));
    }
    if (entry.type === 'comment') return 'Comment';
    return escapeHtml(entry.type || 'Update');
  }

  function renderHistoryTimeline(data, history) {
    if (!history || !history.length) {
      return '<p class="task-history-empty">No activity yet.</p>';
    }
    var items = history.slice().reverse().map(function (entry) {
      return '<li class="task-history-item task-history-' + escapeHtml(entry.type || 'update') + '">' +
        '<div class="task-history-meta">' +
          '<span class="task-history-label">' + historyEntryLabel(data, entry) + '</span>' +
          '<time datetime="' + escapeHtml(entry.at || '') + '">' + escapeHtml(formatHistoryWhen(entry.at)) + '</time>' +
        '</div>' +
        (entry.by ? '<div class="task-history-by">' + escapeHtml(entry.by) + '</div>' : '') +
        (entry.comment ? '<div class="task-history-comment">' + escapeHtml(entry.comment) + '</div>' : '') +
      '</li>';
    }).join('');
    return '<ol class="task-history">' + items + '</ol>';
  }

  function renderUpdateFlash(task) {
    var flash = null;
    try {
      flash = JSON.parse(sessionStorage.getItem(UPDATE_FLASH_KEY) || 'null');
      sessionStorage.removeItem(UPDATE_FLASH_KEY);
    } catch (e) {
      sessionStorage.removeItem(UPDATE_FLASH_KEY);
    }
    if (!flash || flash.taskId !== task.id) return '';
    var snippet = taskToJsonSnippet(task);
    var needsGit = !task._local;
    return '<div class="task-update-flash">' +
      '<strong>Update saved on this device</strong>' +
      (needsGit
        ? '<p>Progress is stored locally until synced. Copy the updated task (with <code>history</code>) into <code>tasks/tasks.json</code>:</p>' +
          '<pre class="task-json-snippet">' + escapeHtml(snippet) + '</pre>' +
          '<div class="task-create-flash-actions">' +
            '<button type="button" class="task-copy-json">Copy JSON</button>' +
            '<a class="task-github-edit" href="' + GITHUB_TASKS_EDIT + '" target="_blank" rel="noopener">Edit tasks.json on GitHub ↗</a>' +
          '</div>'
        : '<p>Change recorded in your local draft task.</p>') +
    '</div>';
  }

  function statusOptionsHtml(data, current) {
    return ['not_started', 'in_progress', 'blocked', 'done'].map(function (s) {
      return '<option value="' + s + '"' + (current === s ? ' selected' : '') + '>' +
        escapeHtml(statusLabel(data, s)) + '</option>';
    }).join('');
  }

  function renderTaskDetail(data, task, options) {
    var m = data.meetings && data.meetings[task.meeting];
    var meetLabel = m ? m.title + ' · ' + m.date : (task.meeting || '—');
    var meetHref = task.meeting ? meetingLink(task.meeting, data) : '';
    var tags = taskTags(task);
    var backHref = wikiTasksHref(buildListQuery(options));
    var badges = '';
    if (task._local) badges += ' <span class="task-pill task-pill-draft">Draft</span>';
    if (task._localEdits) badges += ' <span class="task-pill task-pill-edited" title="Local edits not yet in git">Local edits</span>';

    return '<div class="task-detail">' +
      '<p class="task-detail-back"><a href="' + escapeHtml(backHref) + '">← All tasks</a></p>' +
      renderUpdateFlash(task) +
      '<div class="task-detail-head">' +
        '<div class="task-detail-id">' + escapeHtml(task.id) + badges + '</div>' +
        '<h2 class="task-detail-title">' + escapeHtml(task.title) + '</h2>' +
        '<div class="task-detail-meta">' +
          '<span class="' + pillClass(task.status) + '">' + escapeHtml(statusLabel(data, task.status)) + '</span>' +
          '<span>Assignee: <strong>' + escapeHtml(task.assignee || 'Unassigned') + '</strong></span>' +
          (task.deadline ? '<span>Due: <strong class="' + (isDeadlineOverdue(task.deadline, task.status) ? 'task-deadline-overdue' : '') + '">' + escapeHtml(formatDeadline(task.deadline)) + '</strong></span>' : '') +
          (task.priority ? '<span>Priority: <strong>' + escapeHtml(task.priority) + '</strong></span>' : '') +
          (meetHref ? '<span>Meeting: <a href="' + meetHref + '">' + escapeHtml(meetLabel) + '</a></span>' : '') +
        '</div>' +
        (tags.length ? '<div class="task-detail-tags">' + renderTagsHtml(tags, { filterable: true }) + '</div>' : '') +
        (task.notes ? '<p class="task-detail-notes">' + escapeHtml(task.notes) + '</p>' : '') +
      '</div>' +
      '<div class="task-update-panel">' +
        '<h3 class="task-panel-title">Post an update</h3>' +
        '<p class="task-panel-lead">Change status and/or leave a comment. History is saved on this device until login and git sync are added.</p>' +
        '<form id="task-update-form" class="task-update-form">' +
          '<label class="task-form-field">' +
            '<span>Status</span>' +
            '<select name="status">' + statusOptionsHtml(data, task.status) + '</select>' +
          '</label>' +
          '<label class="task-form-field">' +
            '<span>Your name</span>' +
            '<input type="text" name="author" value="' + escapeHtml(getStoredAuthor()) + '" placeholder="Who is posting this update?">' +
          '</label>' +
          '<label class="task-form-field task-form-field-wide">' +
            '<span>Comment <span class="task-form-optional">(optional)</span></span>' +
            '<textarea name="comment" rows="3" placeholder="What changed? Blockers, next steps, links…"></textarea>' +
          '</label>' +
          '<div class="task-create-actions">' +
            '<button type="submit" class="task-create-submit">Save update</button>' +
          '</div>' +
        '</form>' +
      '</div>' +
      '<div class="task-history-panel">' +
        '<h3 class="task-panel-title">History</h3>' +
        renderHistoryTimeline(data, task.history) +
      '</div>' +
    '</div>';
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

  function postTaskUpdate(taskId, payload) {
    return loadTasks().then(function (data) {
      var task = findTaskById(data, taskId);
      if (!task) throw new Error('Task not found');

      var author = (payload.author || getStoredAuthor() || 'Anonymous').trim();
      setStoredAuthor(author);
      var newStatus = payload.status || task.status;
      var comment = (payload.comment || '').trim();
      var statusChanged = newStatus !== task.status;

      if (!statusChanged && !comment) return null;

      var entry = {
        at: new Date().toISOString(),
        by: author,
        type: statusChanged ? 'status_change' : 'comment'
      };
      if (comment) entry.comment = comment;
      if (statusChanged) {
        entry.from = task.status;
        entry.to = newStatus;
      }

      if (task._local) {
        updateLocalTask(taskId, function (t) {
          if (statusChanged) t.status = newStatus;
          t.history = (t.history || []).concat([entry]);
          return t;
        });
      } else {
        var overlay = getOverlays()[taskId] || {};
        if (statusChanged) overlay.status = newStatus;
        overlay.history = (overlay.history || []).concat([entry]);
        overlay._updatedAt = entry.at;
        saveOverlay(taskId, overlay);
      }

      invalidateCache();
      return entry;
    });
  }

  function bindTaskDetail(data, taskId, options) {
    var form = document.getElementById('task-update-form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        postTaskUpdate(taskId, {
          status: form.status.value,
          author: form.author.value,
          comment: form.comment.value
        }).then(function (entry) {
          if (!entry) return;
          sessionStorage.setItem(UPDATE_FLASH_KEY, JSON.stringify({ taskId: taskId }));
          renderTaskPage(Object.assign({}, options, { task: taskId }));
        });
      };
    }

    document.querySelectorAll('.task-copy-json').forEach(function (btn) {
      btn.onclick = function () {
        var pre = btn.closest('.task-update-flash, .task-create-flash');
        var json = pre && pre.querySelector('.task-json-snippet')
          ? pre.querySelector('.task-json-snippet').textContent
          : '';
        if (!json || !navigator.clipboard || !navigator.clipboard.writeText) return;
        navigator.clipboard.writeText(json).then(function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy JSON'; }, 2000);
        });
      };
    });
  }

  function renderFlashBanner() {
    var flash = null;
    try {
      flash = JSON.parse(sessionStorage.getItem(FLASH_KEY) || 'null');
      sessionStorage.removeItem(FLASH_KEY);
    } catch (e) {
      sessionStorage.removeItem(FLASH_KEY);
    }
    if (!flash || !flash.task) return '';
    var snippet = taskToJsonSnippet(flash.task);
    return '<div class="task-create-flash" id="task-create-flash">' +
        '<strong>Task created: ' + escapeHtml(flash.task.id) + '</strong>' +
        '<p>Visible on this device now. To share with the team, append this entry to <code>tasks/tasks.json</code> in git:</p>' +
        '<pre class="task-json-snippet">' + escapeHtml(snippet) + '</pre>' +
        '<div class="task-create-flash-actions">' +
          '<button type="button" class="task-copy-json">Copy JSON</button>' +
          '<a class="task-github-edit" href="' + GITHUB_TASKS_EDIT + '" target="_blank" rel="noopener">Edit tasks.json on GitHub ↗</a>' +
        '</div>' +
      '</div>';
  }

  function bindCreateForm(data, options) {
    var toggle = document.getElementById('task-create-toggle');
    var body = document.getElementById('task-create-body');
    if (toggle && body) {
      toggle.onclick = function () {
        var open = body.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.textContent = open ? 'Hide form' : 'Add task';
      };
    }

    var meetingSelect = document.getElementById('task-create-meeting');
    var contextEl = document.getElementById('task-meeting-context');
    if (meetingSelect && contextEl) {
      meetingSelect.onchange = function () {
        contextEl.innerHTML = renderMeetingContext(data, meetingSelect.value);
      };
    }

    var form = document.getElementById('task-create-form');
    if (form) {
      form.onsubmit = function (e) {
        e.preventDefault();
        var title = (form.title.value || '').trim();
        if (!title) return;
        var meeting = (form.meeting.value || '').trim();
        var task = {
          id: nextTaskId(data, meeting),
          title: title,
          status: form.status.value || 'not_started',
          assignee: (form.assignee.value || '').trim() || 'Unassigned',
          _local: true,
          _createdAt: new Date().toISOString()
        };
        if (meeting) task.meeting = meeting;
        var notes = (form.notes.value || '').trim();
        if (notes) task.notes = notes;
        var priority = (form.priority.value || '').trim();
        if (priority) task.priority = priority;
        var deadline = (form.deadline.value || '').trim();
        if (deadline) task.deadline = deadline;
        var tags = normalizeTags(form.tags.value || '');
        if (tags.length) task.tags = tags;
        var author = (form.author && form.author.value || getStoredAuthor() || task.assignee || 'Anonymous').trim();
        setStoredAuthor(author);
        task.history = [{
          at: task._createdAt,
          type: 'created',
          status: task.status,
          by: author,
          comment: notes || undefined
        }];

        saveLocalTask(task);
        sessionStorage.setItem(FLASH_KEY, JSON.stringify({ task: task }));
        renderTaskPage(Object.assign({}, options, { showCreateForm: false }));
      };
    }

    document.querySelectorAll('.task-copy-json').forEach(function (btn) {
      btn.onclick = function () {
        var pre = btn.closest('.task-create-flash');
        var json = pre && pre.querySelector('.task-json-snippet')
          ? pre.querySelector('.task-json-snippet').textContent
          : '';
        if (!json || !navigator.clipboard || !navigator.clipboard.writeText) return;
        navigator.clipboard.writeText(json).then(function () {
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = 'Copy JSON'; }, 2000);
        });
      };
    });
  }

  function renderMeetingPanel(meetingId, containerId) {
    var el = document.getElementById(containerId || 'follow-ups-panel');
    if (!el) return;
    loadTasks().then(function (data) {
      var tasks = tasksForMeeting(data, meetingId);
      if (!tasks.length) {
        el.innerHTML = '';
        return;
      }
      var stats = completionStats(tasks);
      var meeting = data.meetings && data.meetings[meetingId];
      var sorted = tasks.slice().sort(function (a, b) {
        var order = { blocked: 0, in_progress: 1, not_started: 2, done: 3 };
        return (order[a.status] || 9) - (order[b.status] || 9);
      });
      var list = sorted.map(function (t) {
        var tags = taskTags(t);
        var taskHref = wikiTasksHref('task=' + encodeURIComponent(t.id));
        return '<li>' +
          '<span class="' + pillClass(t.status) + '">' + escapeHtml(statusLabel(data, t.status)) + '</span>' +
          '<span class="task-title"><a class="task-open-link" href="' + escapeHtml(taskHref) + '">' + escapeHtml(t.title) + '</a>' +
            (tags.length ? '<span class="task-tags-inline">' + renderTagsHtml(tags, { filterable: true }) + '</span>' : '') +
          '</span>' +
          '<span class="task-meta">Assigned: <strong>' + escapeHtml(t.assignee || 'Unassigned') + '</strong>' +
          (t.deadline ? ' · Due: <strong class="' + (isDeadlineOverdue(t.deadline, t.status) ? 'task-deadline-overdue' : '') + '">' + escapeHtml(formatDeadline(t.deadline)) + '</strong>' : '') +
          (t.notes ? ' · ' + escapeHtml(t.notes) : '') +
          ' · <a class="task-update-link" href="' + escapeHtml(taskHref) + '">Update</a></span>' +
          '</li>';
      }).join('');

      var tasksPage = wikiTasksHref('');
      var addTaskHref = wikiTasksHref('new=1&createMeeting=' + encodeURIComponent(meetingId));

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
            (meeting ? ' · <a href="' + addTaskHref + '">Add follow-up</a>' : '') +
            (meeting ? ' · <a href="' + wikiTasksHref('meeting=' + encodeURIComponent(meetingId)) + '">Filter in wiki</a>' : '') +
          '</div>' +
        '</div>';
    });
  }

  function renderTaskPage(options) {
    options = options || {};
    var root = document.getElementById('tasks-root');
    if (!root) return;

    loadTasks().then(function (data) {
      var filterStatus = options.status || '';
      var filterMeeting = options.meeting || '';
      var filterAssignee = options.assignee || '';
      var filterTag = options.tag || '';

      var params = new URLSearchParams(location.search);
      if (!filterMeeting && params.get('meeting')) filterMeeting = params.get('meeting');
      if (!filterStatus && params.get('status')) filterStatus = params.get('status');
      if (!filterTag && params.get('tag')) filterTag = params.get('tag');
      if (!options.createMeeting && params.get('createMeeting')) {
        options.createMeeting = params.get('createMeeting');
      }
      if (options.showCreateForm == null) {
        if (params.get('new') === '1') options.showCreateForm = true;
        var hashOpts = parseTasksHash();
        if (hashOpts.newTask) options.showCreateForm = true;
        if (hashOpts.createMeeting) options.createMeeting = hashOpts.createMeeting;
      }
      if (!options.createMeeting && filterMeeting) {
        options.createMeeting = filterMeeting;
      }
      var hashOptsEarly = parseTasksHash();
      if (!filterTag && hashOptsEarly.tag) filterTag = hashOptsEarly.tag;

      var viewTaskId = options.task || hashOptsEarly.task || params.get('task') || '';

      if (viewTaskId) {
        var detailTask = findTaskById(data, viewTaskId);
        if (!detailTask) {
          root.innerHTML = '<div class="tasks-empty">Task <code>' + escapeHtml(viewTaskId) + '</code> not found. <a href="' + escapeHtml(wikiTasksHref('')) + '">Back to list</a></div>';
          return;
        }
        root.innerHTML = renderTaskDetail(data, detailTask, options);
        bindTaskDetail(data, viewTaskId, options);
        history.replaceState(null, '', '#tasks?task=' + encodeURIComponent(viewTaskId));
        return;
      }

      var all = data.tasks || [];
      var stats = completionStats(all);
      var assignees = [];
      all.forEach(function (t) {
        if (t.assignee && assignees.indexOf(t.assignee) < 0) assignees.push(t.assignee);
      });
      assignees.sort();

      var allTags = collectAllTags(all);
      var tagOptions = allTags.map(function (tag) {
        return '<option value="' + escapeHtml(tag) + '"' + (filterTag === tag ? ' selected' : '') + '>' +
          escapeHtml('#' + tag) + '</option>';
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
        return (a.id || '').localeCompare(b.id || '');
      });

      var meetingOptions = Object.keys(data.meetings || {}).map(function (id) {
        var m = data.meetings[id];
        return '<option value="' + escapeHtml(id) + '"' + (filterMeeting === id ? ' selected' : '') + '>' +
          escapeHtml(m.title) + ' (' + escapeHtml(m.date) + ')</option>';
      }).join('');

      var assigneeOptions = assignees.map(function (a) {
        return '<option value="' + escapeHtml(a) + '"' + (filterAssignee === a ? ' selected' : '') + '>' +
          escapeHtml(a) + '</option>';
      }).join('');

      var rows = filtered.map(function (t) {
        var m = data.meetings && data.meetings[t.meeting];
        var meetLabel = m ? m.title + ' · ' + m.date : (t.meeting || '—');
        var meetHref = t.meeting ? meetingLink(t.meeting, data) : '';
        var meetCell = meetHref
          ? '<a href="' + meetHref + '">' + escapeHtml(meetLabel) + '</a>'
          : escapeHtml(meetLabel);
        var draft = t._local ? ' <span class="task-pill task-pill-draft" title="Saved on this device — add to tasks.json to share">Draft</span>' : '';
        if (t._localEdits) draft += ' <span class="task-pill task-pill-edited" title="Local progress not yet in git">Edited</span>';
        var tags = taskTags(t);
        var taskHref = wikiTasksHref('task=' + encodeURIComponent(t.id));
        return '<tr class="task-row-clickable" data-task-id="' + escapeHtml(t.id) + '">' +
          '<td class="task-id">' + escapeHtml(t.id) + draft + '</td>' +
          '<td><a class="task-open-link" href="' + escapeHtml(taskHref) + '">' + escapeHtml(t.title) + '</a>' +
            (t.notes ? '<div style="font-size:11px;color:var(--text-3);margin-top:2px">' + escapeHtml(t.notes) + '</div>' : '') +
          '</td>' +
          '<td class="task-tags-col">' + renderTagsHtml(tags, { filterable: true }) + '</td>' +
          '<td><span class="' + pillClass(t.status) + '">' + escapeHtml(statusLabel(data, t.status)) + '</span></td>' +
          '<td>' + escapeHtml(t.assignee || 'Unassigned') + '</td>' +
          '<td class="task-deadline-col">' + renderDeadlineCell(t.deadline, t.status) + '</td>' +
          '<td>' + meetCell + '</td>' +
          '<td class="task-actions-col"><a class="task-update-link" href="' + escapeHtml(taskHref) + '">Update</a></td>' +
          '</tr>';
      }).join('');

      var byMeeting = Object.keys(data.meetings || {}).map(function (mid) {
        var mt = tasksForMeeting(data, mid);
        var st = completionStats(mt);
        var m = data.meetings[mid];
        return '<div class="tasks-by-meeting">' +
          '<h3>' + escapeHtml(m.title) + ' <span style="font-weight:400;color:var(--text-3)">· ' + st.pct + '% done</span></h3>' +
          '<div class="follow-ups-progress" style="margin:0 0 0.5rem"><div class="follow-ups-progress-bar" style="width:' + st.pct + '%"></div></div>' +
          '</div>';
      }).join('');

      root.innerHTML =
        renderFlashBanner() +
        renderCreateForm(data, options) +
        '<div class="tasks-stats">' +
          '<div class="tasks-stat"><strong>' + stats.total + '</strong><span>Total tasks</span></div>' +
          '<div class="tasks-stat"><strong style="color:var(--green)">' + stats.done + '</strong><span>Done</span></div>' +
          '<div class="tasks-stat"><strong style="color:var(--amber)">' + stats.inProgress + '</strong><span>In progress</span></div>' +
          '<div class="tasks-stat"><strong>' + stats.open + '</strong><span>Not started</span></div>' +
          '<div class="tasks-stat"><strong style="color:var(--red)">' + stats.blocked + '</strong><span>Blocked</span></div>' +
          '<div class="tasks-stat"><strong>' + stats.pct + '%</strong><span>Overall complete</span></div>' +
        '</div>' +
        '<div class="tasks-by-meeting-wrap">' + byMeeting + '</div>' +
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
            ? '<table class="tasks-table"><thead><tr><th>ID</th><th>Task</th><th>Tags</th><th>Status</th><th>Assignee</th><th>Deadline</th><th>Meeting</th><th></th></tr></thead><tbody>' + rows + '</tbody></table>'
            : '<div class="tasks-empty">No tasks match the current filters.</div>') +
        '</div>' +
        '<p class="tasks-source-note">Click a task or <strong>Update</strong> to change status and add comments. Edits save on this device; copy JSON to git to share. Login sync planned.</p>';

      bindCreateForm(data, options);

      var createBody = document.getElementById('task-create-body');

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
          tag: tg ? tg.value : '',
          showCreateForm: createBody && createBody.classList.contains('is-open')
        });
      }

      ['tasks-filter-meeting', 'tasks-filter-status', 'tasks-filter-assignee', 'tasks-filter-tag'].forEach(function (id) {
        var node = document.getElementById(id);
        if (node) node.onchange = applyFilters;
      });
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
      task: params.get('task') || '',
      newTask: params.get('new') === '1',
      createMeeting: params.get('createMeeting') || ''
    };
  }

  global.ISVTasks = {
    load: loadTasks,
    renderMeetingPanel: renderMeetingPanel,
    renderTaskPage: renderTaskPage,
    parseTasksHash: parseTasksHash,
    invalidateCache: invalidateCache,
    normalizeTags: normalizeTags,
    taskTags: taskTags,
    collectAllTags: collectAllTags,
    postTaskUpdate: postTaskUpdate
  };
})(typeof window !== 'undefined' ? window : this);
