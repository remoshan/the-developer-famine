import * as vscode from 'vscode';
import { LogEntry, LogType } from './types';

const STORAGE_KEY = 'famine.logs';

export class LogStore implements vscode.Disposable {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {
    this.context.globalState.setKeysForSync([STORAGE_KEY]);
  }

  getAll(): LogEntry[] {
    const stored = this.context.globalState.get<LogEntry[]>(STORAGE_KEY, []);
    return Array.isArray(stored) ? stored : [];
  }

  getToday(): LogEntry[] {
    const start = startOfDay(Date.now());
    return this.getAll().filter((e) => e.timestamp >= start);
  }

  getOpenTodos(): LogEntry[] {
    return this.getAll().filter((e) => e.type === 'todo' && !e.done);
  }

  async add(type: LogType, content: string): Promise<LogEntry> {
    const entry: LogEntry = {
      id: randomId(),
      timestamp: Date.now(),
      type,
      content
    };
    const all = this.getAll();
    all.push(entry);
    await this.context.globalState.update(STORAGE_KEY, all);
    this._onDidChange.fire();
    return entry;
  }

  async remove(id: string): Promise<void> {
    const all = this.getAll().filter((e) => e.id !== id);
    await this.context.globalState.update(STORAGE_KEY, all);
    this._onDidChange.fire();
  }

  async markDone(id: string): Promise<void> {
    const all = this.getAll();
    const entry = all.find((e) => e.id === id);
    if (!entry) {
      return;
    }
    entry.done = true;
    await this.context.globalState.update(STORAGE_KEY, all);
    this._onDidChange.fire();
  }

  refresh(): void {
    this._onDidChange.fire();
  }

  dispose(): void {
    this._onDidChange.dispose();
  }
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function randomId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
