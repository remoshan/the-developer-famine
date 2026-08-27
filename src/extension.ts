import * as vscode from 'vscode';
import { LogStore, parseLogInput } from './logStore';
import { TodayLogProvider, formatStandupMarkdown } from './sidebarProvider';
import { DashboardPanel } from './dashboardPanel';

export function activate(context: vscode.ExtensionContext): void {
  const store = new LogStore(context);
  const treeProvider = new TodayLogProvider(store);

  vscode.window.registerTreeDataProvider('famine.todayView', treeProvider);

  context.subscriptions.push(
    vscode.commands.registerCommand('famine.logEntry', async () => {
      const raw = await vscode.window.showInputBox({
        title: 'Log a win, blocker, or note',
        placeHolder: '/win Fixed the memory leak   ·   /block Waiting on AWS keys   ·   anything else = note',
        ignoreFocusOut: true
      });

      if (!raw || !raw.trim()) {
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

export function deactivate(): void {}
