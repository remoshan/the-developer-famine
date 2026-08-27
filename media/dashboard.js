(function () {
  const vscode = acquireVsCodeApi();
  const data = window.__FAMINE_DATA__ || [];
  const app = document.getElementById('app');

  render(data);

  function render(entries) {
    const wins = entries.filter((e) => e.type === 'win').length;
    const blockers = entries.filter((e) => e.type === 'blocker').length;

    app.innerHTML = '';
    app.appendChild(buildHero());
    app.appendChild(buildStats(wins, blockers, entries.length));

    if (entries.length === 0) {
      app.appendChild(buildEmptyState());
      return;
    }

    const groups = groupByDay(entries);
    for (const { label, items } of groups) {
      app.appendChild(buildDayGroup(label, items));
    }
  }

  function buildHero() {
    const hero = el('div', 'hero');
    hero.appendChild(el('p', 'hero-eyebrow', 'The Developer Famine'));
    hero.appendChild(el('h1', 'hero-title', 'Dashboard'));
    hero.appendChild(el('p', 'hero-subtitle', 'Every win, every blocker — one quiet ledger.'));
    return hero;
  }

  function buildStats(wins, blockers, total) {
    const row = el('div', 'stats-row');
    row.appendChild(statCard(String(total), 'Total entries'));
    row.appendChild(statCard(String(wins), 'Wins', 'win'));
    row.appendChild(statCard(String(blockers), 'Blockers', 'blocker'));
    return row;
  }

  function statCard(value, label, accent) {
    const card = el('div', 'stat-card');
    card.appendChild(el('div', 'stat-value' + (accent ? ' ' + accent : ''), value));
    card.appendChild(el('div', 'stat-label', label));
    return card;
  }

  function buildEmptyState() {
    const wrap = el('div', 'empty-state');
    wrap.appendChild(el('div', 'empty-state-title', 'Nothing logged yet'));
    wrap.appendChild(el('div', '', 'Run "Famine: Log Entry" from the Command Palette to get started.'));
    return wrap;
  }

  function buildDayGroup(label, items) {
    const group = el('div', 'day-group');
    group.appendChild(el('h2', 'day-heading', label));
    const list = el('div', 'entry-list');
    items
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((entry) => list.appendChild(buildEntryCard(entry)));
    group.appendChild(list);
    return group;
  }

  function buildEntryCard(entry) {
    const card = el('div', 'entry-card');

    const tag = el('span', 'entry-tag ' + entry.type, entry.type);
    card.appendChild(tag);

    const body = el('div', 'entry-body');
    body.appendChild(el('div', 'entry-content', entry.content));
    body.appendChild(
      el(
        'div',
        'entry-time',
        new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      )
    );
    card.appendChild(body);

    const del = el('button', 'entry-delete', '✕');
    del.title = 'Delete entry';
    del.addEventListener('click', () => {
      vscode.postMessage({ type: 'deleteEntry', id: entry.id });
    });
    card.appendChild(del);

    return card;
  }

  function groupByDay(entries) {
    const map = new Map();
    for (const entry of entries) {
      const key = new Date(entry.timestamp).toDateString();
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
      .map(([key, items]) => ({ label: formatDayLabel(key), items }));
  }

  function formatDayLabel(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
})();
