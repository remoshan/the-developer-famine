import * as vscode from 'vscode';
import { LogStore } from './logStore';
import { LogEntry, LogType } from './types';

const TYPE_ICON: Record<LogType, vscode.ThemeIcon> = {
  win: new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green')),
  blocker: new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red')),
  note: new vscode.ThemeIcon('note', new vscode.ThemeColor('charts.blue')),
  todo: new vscode.ThemeIcon('checklist', new vscode.ThemeColor('charts.yellow'))
};

const DONE_ICON = new vscode.ThemeIcon('pass', new vscode.ThemeColor('charts.green'));

export class LogTreeItem extends vscode.TreeItem {
  constructor(public readonly entry: LogEntry) {
    super(entry.content, vscode.TreeItemCollapsibleState.None);
    this.description = new Date(entry.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    const isDoneTodo = entry.type === 'todo' && entry.done;
    this.iconPath = isDoneTodo ? DONE_ICON : TYPE_ICON[entry.type];
    const label = isDoneTodo ? 'DONE' : entry.type.toUpperCase();
    this.tooltip = `${label} · ${new Date(entry.timestamp).toLocaleString()}`;
    this.contextValue = 'famine.logEntry';
  }
}

export class TodayLogProvider implements vscode.TreeDataProvider<LogTreeItem>, vscode.Disposable {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;
  private readonly storeSubscription: vscode.Disposable;

  constructor(private readonly store: LogStore) {
    this.storeSubscription = this.store.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  dispose(): void {
    this.storeSubscription.dispose();
    this._onDidChangeTreeData.dispose();
  }

  getTreeItem(element: LogTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): LogTreeItem[] {
    return this.store
      .getToday()
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((entry) => new LogTreeItem(entry));
  }
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
