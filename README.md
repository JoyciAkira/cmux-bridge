# Cmux Bridge

> Control your macOS `cmux` terminal sessions from iPhone or Android, over a private Tailscale network.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-blue.svg)]()
[![Built with Expo](https://img.shields.io/badge/built%20with-Expo%20SDK%2056-000.svg?logo=expo)](https://expo.dev)

---

## What is Cmux Bridge?

Cmux Bridge is a purpose-built mobile app for developers who run long AI-agent workflows in [cmux](https://cmux.com). When you leave your desk, your agents keep running — Cmux Bridge lets you monitor them, receive push notifications on events, and send commands from your phone.

**Key features:**

- Connect to your Mac over Tailscale (no cloud relay, fully private)
- List all cmux workspaces and surfaces
- Full terminal renderer with ANSI support
- One-tap macros: ctrl+c, ctrl+z, esc, arrow keys
- Push notifications on agent events: `agent_complete`, `agent_error`, `awaiting_input`
- Biometric unlock (Face ID / Touch ID)
- Multi-Mac support
- MIT open source

---

## Prerequisites

On your Mac:

1. [cmux](https://cmux.com) installed and running
2. [cmux-relay](https://github.com/NewTurn2017/cmux-remote) compiled and running (`launchd` service recommended)
3. [Tailscale](https://tailscale.com) active on both your Mac and your phone

In `~/.config/cmux/cmux.json`:

```json
{
  "automation": {
    "socketControlMode": "password",
    "socketPassword": "<your-password>"
  }
}
```

---

## Getting Started (Development)

```bash
# 1. Clone
git clone https://github.com/JoyciAkira/cmux-bridge
cd cmux-bridge

# 2. Install dependencies
npm install

# 3. Run on iOS simulator
npm run ios

# 4. Run on Android
npm run android
```

> Push notifications require a physical device (iOS simulator does not support APNs).

---

## Project Structure

```
app/               expo-router screens
src/
  services/        relay.ts (WebSocket client), notifications.ts
  store/           macs.ts, terminal.ts (Zustand)
  hooks/           useRelay.ts, useBiometric.ts
  components/      terminal/, ui/
  theme/           colors, spacing, fonts
docs/
  PRD.md           Full product requirements document
CLAUDE.md          Instructions for AI coding agents
```

---

## Architecture

```
iPhone (Cmux Bridge)
      │  WebSocket ws://<tailscale-ip>:4399/ws
      ▼
cmux-relay (Swift daemon on Mac)
      │  Unix socket
      ▼
cmux.app (terminal multiplexer)
```

All traffic stays within the private Tailscale mesh. No data leaves your devices.

---

## Contributing

PRs and issues welcome. Please read `CLAUDE.md` before contributing — it contains the coding standards, architecture constraints, and protocol documentation.

---

## License

MIT © 2026 — see [LICENSE](LICENSE)
