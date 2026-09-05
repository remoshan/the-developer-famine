(function () {
  const vscode = acquireVsCodeApi();
  const app = document.getElementById('app');

  const SIGN = { win: '+', blocker: '-', note: '~', todo: '*', done: 'x' };

  render(window.__FAMINE_DATA__ || []);

  window.addEventListener('message', (event) => {
    if (event.data?.type === 'update') {
      render(event.data.logs || []);
    }
  });

  function render(entries) {
    const wins = entries.filter((e) => e.type === 'win').length;
    const blockers = entries.filter((e) => e.type === 'blocker').length;
    const notes = entries.filter((e) => e.type === 'note').length;
    const todos = entries.filter((e) => e.type === 'todo' && !e.done).length;
    const done = entries.filter((e) => e.type === 'todo' && e.done).length;

    app.innerHTML = '';
    app.appendChild(buildHeader());
    app.appendChild(buildSummary(entries.length, wins, blockers, notes, todos, done));

    if (entries.length === 0) {
      app.appendChild(buildEmptyState());
      return;
    }

    for (const { label, items } of groupByDay(entries)) {
      app.appendChild(buildDayGroup(label, items));
    }
  }

  function buildHeader() {
    const header = el('div', 'term-header');
    header.appendChild(el('span', 'prompt', '$ '));
    header.appendChild(el('span', 'term-command', 'developer-famine '));
    header.appendChild(el('span', 'term-flag', '--log'));
    return header;
  }

  function buildSummary(total, wins, blockers, notes, todos, done) {
    const line = el('div', 'term-summary');
    line.appendChild(document.createTextNode(total + ' entries  '));
    line.appendChild(el('span', 'win', wins + ' win'));
    line.appendChild(document.createTextNode('  '));
    line.appendChild(el('span', 'blocker', blockers + ' blocker'));
    line.appendChild(document.createTextNode('  '));
    line.appendChild(el('span', 'todo', todos + ' todo'));
    line.appendChild(document.createTextNode('  '));
    line.appendChild(el('span', 'done', done + ' done'));
    line.appendChild(document.createTextNode('  '));
    line.appendChild(el('span', 'note', notes + ' note'));
    return line;
  }

  function buildEmptyState() {
    const wrap = el('div', 'empty-state');
    wrap.appendChild(el('div', '', '// nothing logged yet'));
    const hint = el('div', '');
    hint.appendChild(document.createTextNode('> run '));
    hint.appendChild(el('span', 'hint', '">Developer Famine: Log Entry"'));
    hint.appendChild(document.createTextNode(' or click '));
    hint.appendChild(el('span', 'hint', '$(pencil) Log'));
    hint.appendChild(document.createTextNode(' in the status bar'));
    wrap.appendChild(hint);
    return wrap;
  }

  function buildDayGroup(label, items) {
    const group = el('div', 'day-group');
    group.appendChild(el('div', 'day-comment', '// ' + label));
    items
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((entry) => group.appendChild(buildEntryRow(entry)));
    return group;
  }

  function buildEntryRow(entry) {
    const displayType = entry.type === 'todo' && entry.done ? 'done' : entry.type;
    const row = el('div', 'entry-row ' + displayType);

    row.appendChild(
      el(
        'span',
        'col-time',
        new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      )
    );
    row.appendChild(el('span', 'col-sign', SIGN[displayType] || ' '));
    row.appendChild(el('span', 'col-type', displayType));

    const content = el('span', 'col-content', entry.content);
    content.title = 'Click to edit';
    content.addEventListener('click', () => startEdit(content, entry));
    row.appendChild(content);

    const del = el('button', 'col-delete', 'rm');
    del.title = 'Delete entry';
    del.addEventListener('click', () => {
      vscode.postMessage({ type: 'deleteEntry', id: entry.id });
    });
    row.appendChild(del);

    return row;
  }

  function startEdit(span, entry) {
    const input = document.createElement('input');
    input.className = 'col-content-edit';
    input.value = entry.content;
    span.replaceWith(input);
    input.focus();
    input.select();

    let done = false;
    const finish = (shouldSave) => {
      if (done) {
        return;
      }
      done = true;
      if (shouldSave) {
        const value = input.value.trim();
        if (value && value !== entry.content) {
          vscode.postMessage({ type: 'editEntry', id: entry.id, content: value });
          return;
        }
      }
      input.replaceWith(span);
    };

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        input.blur();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      }
    });
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
