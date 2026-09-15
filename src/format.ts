import { LogEntry, LogType } from './types';

export function parseLogInput(raw: string): { type: LogType; content: string } {
  const winMatch = raw.match(/^\/win(?:\s+(.*))?$/i);
  if (winMatch) {
    return { type: 'win', content: (winMatch[1] ?? '').trim() };
  }
  const blockMatch = raw.match(/^\/block(?:er)?(?:\s+(.*))?$/i);
  if (blockMatch) {
    return { type: 'blocker', content: (blockMatch[1] ?? '').trim() };
  }
  const todoMatch = raw.match(/^\/todo(?:\s+(.*))?$/i);
  if (todoMatch) {
    return { type: 'todo', content: (todoMatch[1] ?? '').trim() };
  }
  return { type: 'note', content: raw.trim() };
}

export function formatStandupMarkdown(entries: LogEntry[]): string {
  const wins = entries.filter((e) => e.type === 'win');
  const blockers = entries.filter((e) => e.type === 'blocker');
  const notes = entries.filter((e) => e.type === 'note');
  const openTodos = entries.filter((e) => e.type === 'todo' && !e.done);
  const doneTodos = entries.filter((e) => e.type === 'todo' && e.done);

  const section = (title: string, items: LogEntry[]) =>
    items.length ? `**${title}**\n${items.map((i) => `- ${i.content}`).join('\n')}\n` : '';

  return [
    section('Wins', wins),
    section('Blockers', blockers),
    section('Todos', openTodos),
    section('Done', doneTodos),
    section('Notes', notes)
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}

export function formatFullHistoryMarkdown(entries: LogEntry[]): string {
  const groups = groupByDay(entries);
  return groups
    .map(({ label, items }) => `## ${label}\n\n${formatStandupMarkdown(items)}`)
    .join('\n\n')
    .trim();
}

function groupByDay(entries: LogEntry[]): { label: string; items: LogEntry[] }[] {
  const map = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.timestamp).toDateString();
    const list = map.get(key) ?? [];
    list.push(entry);
    map.set(key, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([key, items]) => ({ label: formatDayLabel(key), items }));
}

function formatDayLabel(dateString: string): string {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}
