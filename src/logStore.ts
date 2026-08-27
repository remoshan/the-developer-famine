import * as vscode from 'vscode';
import { LogEntry, LogType } from './types';

const STORAGE_KEY = 'famine.logs';

export class LogStore {
  private readonly _onDidChange = new vscode.EventEmitter<void>();
  readonly onDidChange = this._onDidChange.event;

  constructor(private readonly context: vscode.ExtensionContext) {}

  getAll(): LogEntry[] {
    return this.context.globalState.get<LogEntry[]>(STORAGE_KEY, []);
  }

  getToday(): LogEntry[] {
    const start = startOfDay(Date.now());
    return this.getAll().filter((e) => e.timestamp >= start);
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
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function randomId(): string {
  // crypto.randomUUID is available in the Node runtime VS Code ships with,
  // avoiding a dependency on the `uuid` package for boilerplate this small.
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function parseLogInput(raw: string): { type: LogType; content: string } {
  const winMatch = raw.match(/^\/win\s+(.*)$/i);
  if (winMatch) {
    return { type: 'win', content: winMatch[1].trim() };
  }
  const blockMatch = raw.match(/^\/block(?:er)?\s+(.*)$/i);
  if (blockMatch) {
    return { type: 'blocker', content: blockMatch[1].trim() };
  }
  return { type: 'note', content: raw.trim() };
}
