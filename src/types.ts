export type LogType = 'win' | 'blocker' | 'note' | 'todo';

export interface LogEntry {
  id: string;
  timestamp: number;
  type: LogType;
  content: string;
  done?: boolean;
}
