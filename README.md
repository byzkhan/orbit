# Orbit

**Google Workspace AI Assistant for your terminal.**

Orbit connects Claude to your Google Workspace — Gmail, Calendar, Drive, Docs, Sheets, and Chat — through natural language. Ask it to check your emails, schedule meetings, create documents, or anything else across your workspace.

## CLI

### Install

```bash
curl -fsSL https://raw.githubusercontent.com/byzkhan/orbit/main/scripts/install.sh | sh
```

Then run `orbit` to start the guided setup.

### What you can do

```
orbit> how many unread emails do I have?
orbit> send an email to zaid@gmail.com asking if he's free at 2pm
orbit> what's on my calendar today?
orbit> create a google doc summarizing our Q1 goals
orbit> find the budget spreadsheet in Drive and add a new row
```

### CLI flags

```
orbit              Start Orbit (runs setup on first launch)
orbit --setup      Re-run onboarding (skips already-done steps)
orbit --reset      Clear config and re-run onboarding
orbit --version    Print version
orbit --help       Show help
```

## Desktop App

The Orbit desktop app coming soon

## Requirements

- Node.js >= 18
- An [Anthropic API key](https://console.anthropic.com/settings/keys)
- A Google Cloud project with OAuth credentials and APIs enabled (the setup wizard walks you through this)

## How it works

Orbit uses Claude as an AI agent with 35 Google Workspace tools. When you ask a question, Claude decides which tools to call — reading emails, creating events, searching Drive — and chains them together to complete your request.

Tools include:
- **Gmail** — read, send, search, label, trash messages
- **Calendar** — list, create, update, delete events
- **Drive** — list, search, create, delete files
- **Docs** — create and edit documents
- **Sheets** — read, write, and format spreadsheets
- **Chat** — send and read messages

## License

MIT
