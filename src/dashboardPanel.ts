import * as vscode from 'vscode';
import { LogStore } from './logStore';

export class DashboardPanel {
  private static current: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  static createOrShow(extensionUri: vscode.Uri, store: LogStore): void {
    const column = vscode.window.activeTextEditor?.viewColumn;

    if (DashboardPanel.current) {
      DashboardPanel.current.panel.reveal(column);
      DashboardPanel.current.postLogs();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'famine.dashboard',
      'developer-famine — log',
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')]
      }
    );

    DashboardPanel.current = new DashboardPanel(panel, extensionUri, store);
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    private readonly store: LogStore
  ) {
    this.panel = panel;
    this.panel.webview.html = this.getHtml(this.panel.webview);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.store.onDidChange(() => this.postLogs(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message) => {
        if (message?.type === 'deleteEntry' && typeof message.id === 'string') {
          this.store.remove(message.id);
        } else if (
          message?.type === 'editEntry' &&
          typeof message.id === 'string' &&
          typeof message.content === 'string'
        ) {
          this.store.updateContent(message.id, message.content);
        }
      },
      null,
      this.disposables
    );
  }

  private postLogs(): void {
    this.panel.webview.postMessage({ type: 'update', logs: this.store.getAll() });
  }

  private getHtml(webview: vscode.Webview): string {
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'dashboard.css'));
    const jsUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'media', 'dashboard.js'));
    const nonce = getNonce();
    const logs = JSON.stringify(this.store.getAll());

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${cssUri}" rel="stylesheet" />
  <title>developer-famine — log</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}">
    window.__FAMINE_DATA__ = ${logs};
  </script>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    DashboardPanel.current = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
