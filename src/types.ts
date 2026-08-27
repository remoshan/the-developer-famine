export type LogType = 'win' | 'blocker' | 'note';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  content: string;
}
