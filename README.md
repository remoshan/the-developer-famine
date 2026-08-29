# Developer Famine

A frictionless developer bragging ledger and standup architect for VS Code. Log your wins and blockers without leaving your IDE, and turn them into a standup update or a running history in one click.

## Features

- **One-line logging** — a single Quick Input box accepts `/win`, `/block` (or `/blocker`), `/todo`, or plain text, and files the entry as the right type automatically.
- **Completable todos** — `/todo <task>` logs a task; `/done` opens a filterable picker of your open todos so you can mark one complete.
- **Today's Log sidebar** — an Activity Bar view showing everything you've logged today, with color-coded icons per type, updating live as you log or delete.
- **Copy Standup to Clipboard** — formats today's wins, blockers, open todos, completed todos, and notes into a Markdown bulleted list, ready to paste into Slack, a PR description, or a standup doc.
- **Dashboard** — a full-screen webview showing your entire history, grouped by day, styled like a terminal log (`+ win`, `- blocker`, `* todo`, `x done`, `~ note`) using your actual editor font and your color theme's terminal colors.
- **100% local** — everything is stored in VS Code's own local storage on your machine. No servers, no accounts, no network calls. See [Data & Privacy](#data--privacy) below.

## Installation

This extension isn't published to the Marketplace yet. Until then, install it from source:

```bash
git clone https://github.com/remoshan/the-developer-famine.git
cd the-developer-famine
npm install
npm run compile
npx vsce package
code --install-extension the-developer-famine-1-1-1.2.1.vsix
```

Once published, this section will be replaced with a direct Marketplace link.

## Usage

### Logging an entry

Open the log input any of these ways:

| Method | How |
|---|---|
| Command Palette | `Ctrl+Shift+P` → type `developer famine` → select **Developer Famine: Log Entry** |
| Keybinding | `Ctrl+Alt+L` (`Cmd+Alt+L` on macOS) |
| Status bar | Click **$(pencil) Log** in the bottom-left status bar |

Then type one of:

```
/win Fixed the memory leak
/block Waiting on AWS keys
/blocker Waiting on AWS keys
/todo Write unit tests for the parser
Just a plain note, no prefix needed
```

`/win`, `/block`/`/blocker`, or `/todo` typed alone with nothing after it is rejected with a warning — it won't log an empty or literal `/win` entry.

### Completing a todo

Type `/done` (nothing after it) into the same log input. A picker opens listing every open todo — either click one directly, or type a few characters to filter the list (VS Code's built-in Quick Pick filtering), then press Enter. The selected todo flips to a `done` state everywhere it's shown (dashboard, sidebar, and standup output) — it isn't deleted, just marked complete. If there are no open todos, you'll get a message instead of an empty picker.

> **Why can't I just type `/developer-famine <message>` into VS Code's global search bar?**
> VS Code's built-in Command Palette and Quick Open are fixed, closed components — extensions cannot make them accept trailing free text as an argument to a command. Selecting a command from the Palette must always open a *new* Quick Input for further text, which is exactly what "Log Entry" does. This is true for every VS Code extension (Git, GitLens, etc.), not a limitation specific to this one.

### Commands

| Command | Keybinding |
|---|---|
| Developer Famine: Log Entry | `Ctrl+Alt+L` / `Cmd+Alt+L` |
| Developer Famine: Copy Standup to Clipboard | — |
| Developer Famine: Open Dashboard | — |
| Developer Famine: Refresh | — |

All four are also available as buttons in the sidebar's view title bar.

## Data & Privacy

Every entry is stored exclusively in VS Code's `ExtensionContext.globalState`, persisted locally on your machine (VS Code's per-profile `globalStorage` folder). This extension makes no network requests of any kind, and the dashboard webview's Content-Security-Policy blocks it from making any even if it tried.

If you use VS Code Settings Sync, your log data is included (opted in via `setKeysForSync`) and can follow you to other machines signed into the same account. If you don't use Settings Sync, your data stays on this one machine.

## Known Limitations

- **Multiple windows**: if you have two VS Code windows open at once and log an entry in both around the same time, the second write can silently overwrite the first (a structural limit of `globalState` — it has no cross-process transactions). Logging from a single window at a time avoids this entirely.
- **VS Code Profiles**: each Profile has isolated storage. Switching profiles will show an empty log — your data isn't deleted, just under the other profile.
- **No export/backup command yet**: there's currently no way to export your history to a file as a safety net.

## Development

```bash
git clone https://github.com/remoshan/the-developer-famine.git
cd the-developer-famine
npm install
```

Press **F5** in VS Code (or Run → Start Debugging) to compile and launch an Extension Development Host window with the extension loaded. Use `npm run watch` in a terminal while iterating, then reload the Extension Development Host window (`Ctrl+R`) to pick up TypeScript changes; CSS/JS changes in `media/` apply on the next time the dashboard panel is opened.

### Project structure

```
src/
  extension.ts       entry point — registers commands, status bar item, midnight refresh
  logStore.ts         globalState-backed storage + /win /block /todo parser + todo completion
  sidebarProvider.ts   TreeDataProvider for the "Today's Log" view + standup formatter
  dashboardPanel.ts    webview panel host (CSP, data injection, delete round-trip)
media/
  dashboard.css        dashboard styling
  dashboard.js          dashboard rendering logic
resources/
  icon.svg              Activity Bar icon
```

## Contributing

Issues and pull requests are welcome at the [GitHub repository](https://github.com/remoshan/the-developer-famine).

## License

[MIT](LICENSE)
