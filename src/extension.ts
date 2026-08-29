import * as vscode from 'vscode';
import { LogStore, parseLogInput } from './logStore';
import { TodayLogProvider, formatStandupMarkdown } from './sidebarProvider';
import { DashboardPanel } from './dashboardPanel';

export function activate(context: vscode.ExtensionContext): void {
  const store = new LogStore(context);
  const treeProvider = new TodayLogProvider(store);

  vscode.window.registerTreeDataProvider('famine.todayView', treeProvider);

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = '$(pencil) Log';
  statusBarItem.tooltip = 'Developer Famine: Log a win, blocker, note, or todo';
  statusBarItem.command = 'famine.logEntry';
  statusBarItem.show();

  context.subscriptions.push(store, treeProvider, statusBarItem, scheduleMidnightRefresh(store));

  context.subscriptions.push(
    vscode.commands.registerCommand('famine.logEntry', async () => {
      const raw = await vscode.window.showInputBox({
        title: 'Log a win, blocker, note, or todo',
        placeHolder: '/win ...   ·   /block ...   ·   /todo ...   ·   /done   ·   anything else = note',
        ignoreFocusOut: true
      });

      if (!raw || !raw.trim()) {
        return;
      }

      if (/^\/done\s*$/i.test(raw)) {
        const openTodos = store.getOpenTodos();
        if (openTodos.length === 0) {
          vscode.window.showInformationMessage('Famine: no open todos to complete.');
          return;
        }
        const picked = await vscode.window.showQuickPick(
          openTodos.map((t) => ({ label: t.content, id: t.id })),
          { title: 'Mark a todo as done', placeHolder: 'Select or type to filter…' }
        );
        if (picked) {
          await store.markDone(picked.id);
          vscode.window.setStatusBarMessage('$(check) Famine: todo marked done', 2500);
        }
        return;
      }

      const { type, content } = parseLogInput(raw);
      if (!content) {
        vscode.window.showWarningMessage('Famine: entry was empty after the prefix, nothing logged.');
        return;
      }

      await store.add(type, content);
      vscode.window.setStatusBarMessage(`$(check) Famine: logged ${type}`, 2500);
    }),

    vscode.commands.registerCommand('famine.copyStandup', async () => {
      const today = store.getToday();
      if (today.length === 0) {
        vscode.window.showInformationMessage('Famine: nothing logged today yet.');
        return;
      }
      const markdown = formatStandupMarkdown(today);
      await vscode.env.clipboard.writeText(markdown);
      vscode.window.showInformationMessage('Famine: standup copied to clipboard.');
    }),

    vscode.commands.registerCommand('famine.openDashboard', () => {
      DashboardPanel.createOrShow(context.extensionUri, store);
    }),

    vscode.commands.registerCommand('famine.refreshView', () => {
      treeProvider.refresh();
    })
  );
}

function scheduleMidnightRefresh(store: LogStore): vscode.Disposable {
  let timer: ReturnType<typeof setTimeout>;

  const scheduleNext = () => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
    timer = setTimeout(() => {
      store.refresh();
      scheduleNext();
    }, nextMidnight.getTime() - now.getTime());
  };

  scheduleNext();
  return new vscode.Disposable(() => clearTimeout(timer));
}

export function deactivate(): void {}
