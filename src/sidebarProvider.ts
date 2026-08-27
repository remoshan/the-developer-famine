import * as vscode from 'vscode';
import { LogStore } from './logStore';
import { LogEntry, LogType } from './types';

const TYPE_ICON: Record<LogType, vscode.ThemeIcon> = {
  win: new vscode.ThemeIcon('check', new vscode.ThemeColor('charts.green')),
  blocker: new vscode.ThemeIcon('warning', new vscode.ThemeColor('charts.red')),
  note: new vscode.ThemeIcon('note', new vscode.ThemeColor('charts.blue'))
};

class LogTreeItem extends vscode.TreeItem {
  constructor(public readonly entry: LogEntry) {
    super(entry.content, vscode.TreeItemCollapsibleState.None);
    this.description = new Date(entry.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    this.iconPath = TYPE_ICON[entry.type];
    this.contextValue = 'famine.logEntry';
    this.tooltip = `${entry.type.toUpperCase()} · ${new Date(entry.timestamp).toLocaleString()}`;
  }
}

export class TodayLogProvider implements vscode.TreeDataProvider<LogTreeItem> {
  private readonly _onDidChangeTreeData = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private readonly store: LogStore) {
    this.store.onDidChange(() => this._onDidChangeTreeData.fire());
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
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

  const section = (title: string, items: LogEntry[]) =>
    items.length ? `**${title}**\n${items.map((i) => `- ${i.content}`).join('\n')}\n` : '';

  return [section('Wins', wins), section('Blockers', blockers), section('Notes', notes)]
    .filter(Boolean)
    .join('\n')
    .trim();
}
