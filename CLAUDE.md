# CLAUDE.md — Cmux Bridge

This file instructs Claude (and any AI coding agent) on how to work in this repository. Read it completely before making any change.

---

## Project Summary

**Cmux Bridge** is a React Native + Expo mobile app (iOS + Android) that connects to a `cmux-relay` daemon running on a macOS machine over a private Tailscale network. It renders terminal output with full ANSI fidelity, delivers push notifications on AI-agent events, and lets developers send commands from their phone.

- **Framework:** React Native 0.85 + Expo SDK 56
- **Router:** expo-router (file-based, `app/` directory)
- **State:** Zustand
- **Language:** TypeScript (strict)
- **Styling:** StyleSheet API only — no styled-components, no Tailwind
- **Tests:** Jest + React Native Testing Library

---

## Repository Structure

```
cmux-bridge/
├── app/                    # expo-router screens
│   ├── _layout.tsx         # Root layout (providers, theme)
│   ├── index.tsx           # Entry: redirect to /tabs or /onboarding
│   ├── onboarding.tsx      # First-run setup screen
│   ├── tabs/
│   │   ├── _layout.tsx     # Tab bar layout
│   │   ├── index.tsx       # Macs list (home tab)
│   │   └── settings.tsx    # App settings
│   └── mac/
│       ├── [id].tsx        # Workspace list for a Mac
│       └── [id]/
│           └── [surfaceId].tsx  # Terminal view
├── src/
│   ├── services/
│   │   ├── relay.ts        # WebSocket client for cmux-relay
│   │   └── notifications.ts # APNs/FCM registration + handlers
│   ├── store/
│   │   ├── macs.ts         # Zustand: saved Mac connections
│   │   └── terminal.ts     # Zustand: terminal buffer per surface
│   ├── hooks/
│   │   ├── useRelay.ts     # Hook to connect/disconnect relay
│   │   └── useBiometric.ts # Hook for biometric prompt
│   ├── components/
│   │   ├── terminal/
│   │   │   ├── TerminalView.tsx   # Full terminal renderer
│   │   │   ├── TerminalBuffer.ts  # ANSI parser + line buffer
│   │   │   └── InputBar.tsx       # Keyboard + macro keys
│   │   └── ui/
│   │       ├── MacCard.tsx
│   │       ├── WorkspaceRow.tsx
│   │       └── StatusBadge.tsx
│   └── theme/
│       └── index.ts        # Colors, fonts, spacing constants
├── docs/
│   └── PRD.md
├── CLAUDE.md               # This file
└── app.json                # Expo config
```

---

## Coding Rules

### TypeScript
- `strict: true` in `tsconfig.json` — no `any`, no non-null assertions without a comment explaining why
- All switch statements over discriminated unions/enums must have a `never` exhaustiveness check in the default case
- Imports always at the top of the file — no inline imports

### React Native
- Use `StyleSheet.create()` for all styles — never inline style objects in JSX
- No `View` with hardcoded pixel sizes — use spacing from `src/theme`
- Safe area insets via `react-native-safe-area-context` — never hardcode status bar height
- Use `expo-router` `Link` and `router.push()` for navigation — no manual stack manipulation

### State (Zustand)
- One store per domain: `macs.ts` for connection state, `terminal.ts` for buffer state
- Store actions are plain functions — no async in the store itself; async logic goes in services or hooks
- Never import a store slice from another store — pass data as arguments

### Services
- `relay.ts` owns the WebSocket lifecycle: connect, disconnect, send, receive
- `relay.ts` emits typed events via a simple EventEmitter — components subscribe via `useRelay` hook
- No direct WebSocket calls outside `relay.ts`

### Security
- All sensitive data (IP, port, credentials) stored in expo-secure-store, never AsyncStorage
- Never log credentials or IP addresses — use `[REDACTED]` in debug output
- Biometric check gates: opening the app, and sending a command to a new Mac for the first time

### Performance
- Terminal scrollback buffer capped at 500 lines by default (user-configurable 100–2000)
- ANSI parsing happens off the main thread where possible (useTransition or WorkerThread)
- No re-renders of TerminalView when the buffer has not changed — use `React.memo` + stable refs

### Git
- Branch naming: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`
- Commit format: `feat: <imperative description>` (Conventional Commits)
- Never commit directly to `main` — always PR
- Commit and push after every completed milestone

---

## Protocol: cmux-relay WebSocket API

The app connects to `ws://<tailscale-ip>:4399/ws`.

All messages are JSON. The relay authenticates via the Tailscale identity (no additional token needed in v1).

### Outbound (app → relay)

```typescript
// Subscribe to a surface
{ type: "subscribe", workspaceId: string, surfaceId: string }

// Unsubscribe
{ type: "unsubscribe", workspaceId: string, surfaceId: string }

// Send input
{ type: "input", data: string }  // base64-encoded keystrokes

// List workspaces
{ type: "list" }
```

### Inbound (relay → app)

```typescript
// Terminal output chunk
{ type: "output", workspaceId: string, surfaceId: string, data: string }  // base64

// Workspace list response
{ type: "workspaces", items: WorkspaceItem[] }

// Agent event
{ type: "event", event: "agent_complete" | "agent_error" | "awaiting_input", workspaceId: string, message?: string }

// Connection acknowledged
{ type: "ack" }

// Error
{ type: "error", code: string, message: string }
```

---

## Environment Setup

```bash
# Prerequisites
# - Node.js 20+
# - Xcode 16+ (for iOS)
# - Android Studio (for Android)
# - Expo CLI: npm install -g expo-cli

# Install dependencies
npm install

# Run on iOS simulator
npm run ios

# Run on Android
npm run android

# Run tests
npm test
```

---

## Testing

- Unit tests in `__tests__/` adjacent to the file under test, or in a root `__tests__/` folder
- Test the ANSI parser (TerminalBuffer.ts) exhaustively — it is the most complex non-UI logic
- Test Zustand stores in isolation (no React rendering needed)
- Integration tests for relay connection mocked with a local WebSocket server

---

## Known Constraints

1. **cmux-relay protocol is not yet finalized.** The `type: "subscribe"` / `type: "output"` schema above is the planned v1 contract; verify against actual relay source before implementing.
2. **Push notifications on iOS require a physical device** — they do not work in the simulator.
3. **Background WebSocket on iOS is restricted** — the app uses push + background fetch as fallback when backgrounded.
4. **expo-router requires `scheme` in app.json** — set to `cmuxbridge`.

---

## What NOT To Do

- Do not add analytics or telemetry of any kind
- Do not introduce new dependencies without checking expo compatibility first (`npx expo install <pkg>`)
- Do not store IPs or credentials in AsyncStorage — use expo-secure-store
- Do not render terminal output with a `<Text>` component for each character — batch lines
- Do not use `console.log` in production paths — use a conditional debug logger
