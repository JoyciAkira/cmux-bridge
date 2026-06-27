# App Store & Play Store Submission Metadata

## App Info

| Field | Value |
|-------|-------|
| Name | Cmux Bridge |
| Subtitle (iOS) | Control cmux from your iPhone |
| Category | Developer Tools |
| Content Rating | 4+ / Everyone |
| Price | Free |

---

## Short Description (80 chars — Play Store)

```
Control cmux terminal sessions from iPhone over Tailscale.
```

## Full Description

```
Cmux Bridge lets developers control their macOS cmux terminal sessions from iPhone or Android, over a private Tailscale network — no cloud, no compromises.

Built for developers who run long AI-agent workflows in cmux. When you leave your desk, your agents keep running. Cmux Bridge keeps you in the loop.

KEY FEATURES

• Connect to your Mac over Tailscale (100% private — no cloud relay)
• Browse all cmux workspaces and surfaces
• Full terminal output with ANSI rendering
• One-tap macros: ctrl+c, ctrl+z, esc, arrow keys
• Push notifications when your agent completes, errors, or needs input
• Face ID / Touch ID protection
• Multi-Mac support
• Open source (MIT)

REQUIREMENTS

• Mac running cmux with cmux-relay daemon
• Tailscale active on both devices
• iOS 16+ or Android 10+

HOW IT WORKS

Cmux Bridge connects directly to the cmux-relay daemon on your Mac via WebSocket over your private Tailscale mesh network. Your terminal sessions, commands, and credentials never leave your devices.

OPEN SOURCE

Cmux Bridge is free and open source. Contributions welcome at github.com/JoyciAkira/cmux-bridge
```

---

## Keywords (iOS — 100 chars max)

```
terminal,cmux,ssh,developer,remote,tailscale,coding,ai,agent,monitor
```

## Support URL

```
https://github.com/JoyciAkira/cmux-bridge/issues
```

## Privacy Policy URL

```
https://github.com/JoyciAkira/cmux-bridge/blob/main/docs/privacy-policy.md
```

---

## Screenshots Required

### iOS
- iPhone 6.9" (iPhone 16 Pro Max): 1320×2868 — **required**
- iPhone 6.5" (iPhone 14 Plus): 1284×2778 — required for older devices
- iPad Pro 13" (M4): 2064×2752 — optional

### Android
- Phone: 1080×1920 minimum
- Feature Graphic: 1024×500

### Suggested Screenshot Sequence
1. Home screen — Mac list with "connected" status
2. Workspace list — showing active cmux workspaces
3. Terminal view — live output from an AI agent session
4. Input bar — macros and command input
5. Push notification — "Agent complete" alert
6. Settings — font size, scrollback config

---

## App Review Notes (iOS)

```
This app is a remote terminal viewer for cmux (https://cmux.com), a macOS terminal multiplexer.

It connects to a local relay daemon (cmux-relay) running on the reviewer's Mac via WebSocket over a private Tailscale VPN. It does NOT execute arbitrary shell commands, does NOT provide general SSH access, and does NOT act as a standalone terminal emulator.

The app requires the user to have cmux and cmux-relay already installed and configured on their Mac. There is no server-side component — all traffic stays on the user's private Tailscale mesh.

Test account: not applicable — the app requires the reviewer's own Mac setup to test.
Demo video: https://github.com/JoyciAkira/cmux-bridge (README)
```

---

## Privacy Policy Summary

The app collects no personal data. No analytics, no telemetry, no crash reporting (v1.0). Tailscale IP addresses are stored locally in the iOS Keychain and never transmitted to any server. See `docs/privacy-policy.md`.
