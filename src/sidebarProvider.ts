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
