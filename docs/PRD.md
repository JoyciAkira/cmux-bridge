# Cmux Bridge — Product Requirements Document

**Version:** 1.0.0-draft  
**Status:** Active  
**Owner:** @JoyciAkira  
**Last updated:** 2026-06-27

---

## 1. Vision & Problem Statement

Cmux Bridge lets developers control their macOS `cmux` terminal sessions from an iPhone or Android device, over a private Tailscale network, without compromising security or performance.

**Problem:** AI-agent workflows in `cmux` run long tasks (code generation, test suites, deployments) that can take hours. When a developer leaves their desk, there is no native mobile interface to monitor or interact with those sessions. Termius gives SSH access but is a generic tool — it has no understanding of `cmux` workspaces, surfaces, or events. Existing solutions (web SSH, generic clients) are not built for the AI-agent monitoring use case.

**Solution:** A purpose-built mobile app that speaks the `cmux-relay` protocol natively, renders terminal output with full ANSI fidelity, delivers push notifications on agent events, and lets the developer send commands or keystrokes when intervention is needed.

---

## 2. Target Users

### Primary — Indie Developer
- Works solo on AI-assisted projects
- Runs long `claude`, `codex`, or custom agent sessions in `cmux`
- Needs to check on agents while commuting, cooking, or away from desk
- Values speed, zero friction, and a minimal UI

### Secondary — Professional Developer (team)
- Works in team environments
- May have multiple Macs (work laptop + personal machine)
- Needs per-device connection management
- Cares about audit trail and security

---

## 3. Goals (Measurable)

| # | Goal | Target | Timeframe |
|---|------|--------|-----------|
| G1 | App Store & Play Store public launch | Both stores live | v1.0 |
| G2 | Cold open → connected to cmux session | ≤ 3 seconds | v1.0 |
| G3 | Push notification delivery latency | ≤ 2 seconds p95 | v1.0 |
| G4 | Terminal render lag (output → screen) | ≤ 100 ms | v1.0 |
| G5 | Day-30 retention | ≥ 40% | 90 days post-launch |
| G6 | AppStore rating | ≥ 4.5 stars | 60 days post-launch |

---

## 4. Non-Goals (v1.0)

- No built-in Tailscale auth flow (user configures Tailscale independently)
- No file browser / file transfer
- No voice input
- No collaborative / shared sessions
- No web interface
- No Windows / Linux client

---

## 5. Features

### 5.1 Core (Must Have — v1.0)

#### F1 — Mac Connection Manager
- Add a Mac by Tailscale IP + port (default 4399)
- Optional label ("Work MacBook", "Home Studio")
- Test connection before saving
- Secure credential storage via Keychain (expo-secure-store)
- Multi-Mac support (list view, swipe to delete)

#### F2 — Workspace & Surface Browser
- List all `cmux` workspaces and surfaces from the relay
- Show status (active/idle), last activity timestamp
- Pull-to-refresh
- Tap to open terminal view

#### F3 — Terminal Renderer
- Full ANSI/VT100 escape sequence parsing
- 256-color support
- Scrollback buffer (configurable, default 500 lines)
- Pinch-to-zoom font size
- Monospace font (JetBrains Mono or SF Mono fallback)
- Copy selection support

#### F4 — Command Input
- On-screen keyboard with ctrl/alt/esc macro keys
- Send arbitrary text input via relay `send` command
- Predefined quick-send shortcuts (user-configurable)
- Send ctrl+c, ctrl+z, ctrl+d one-tap

#### F5 — Push Notifications
- APNs (iOS) and FCM (Android) integration with relay
- Notification triggers: agent completes, error detected, awaiting input
- Per-workspace notification toggle
- Deep link: tap notification → opens that workspace directly
- Background fetch for battery-efficient polling fallback

#### F6 — Biometric Unlock
- FaceID / TouchID gate on app open
- Optional: per-Mac biometric confirmation before sending commands
- Falls back to device passcode

#### F7 — Theme & Accessibility
- Dark mode only (v1.0)
- Dynamic Type support (iOS)
- High-contrast mode
- Reduced motion support

### 5.2 Nice to Have (v1.1+)

- Siri Shortcuts / iOS Shortcuts integration
- Apple Watch companion (glance view, approve/reject)
- Split-screen iPad layout
- Widget (last session status)
- SSH fallback when relay is unreachable
- Android wear OS companion

---

## 6. Technical Architecture

### Platform
- **Framework:** React Native 0.85 + Expo SDK 56
- **Routing:** expo-router (file-based)
- **State:** Zustand (lightweight, no boilerplate)
- **Storage:** expo-secure-store (credentials), AsyncStorage (preferences)
- **Notifications:** expo-notifications (APNs + FCM)
- **Biometrics:** expo-local-authentication

### Transport Layer
- Primary: WebSocket to `cmux-relay` (port 4399) over Tailscale
- The relay exposes `/ws` endpoint — app connects directly
- All traffic stays within the private Tailscale mesh (no cloud relay)
- Reconnect with exponential backoff (1s → 2s → 4s → max 30s)

### cmux-relay Protocol (v0.1)
The app communicates with `cmux-relay` using JSON messages over WebSocket:

```
// Subscribe to a surface
{ "type": "subscribe", "workspaceId": "...", "surfaceId": "..." }

// Receive terminal output
{ "type": "output", "data": "<base64-encoded pty output>" }

// Send input
{ "type": "input", "data": "<base64-encoded keystrokes>" }

// Event stream (agent events for push notifications)
{ "type": "event", "event": "agent_complete" | "agent_error" | "awaiting_input", "workspace": "..." }
```

### Security
- All connections over Tailscale (private mesh, not internet)
- Credentials stored in iOS Keychain / Android Keystore via expo-secure-store
- Biometric gate on sensitive operations
- No telemetry, no analytics, no cloud

---

## 7. Unique Differentiator

> **"The only mobile app built specifically for AI-agent workflows in cmux — with native push notifications on agent events and a UI optimized for monitoring and intervening in long-running sessions."**

No other app:
1. Understands cmux workspaces/surfaces natively
2. Delivers push notifications on agent events (not just SSH disconnects)
3. Provides one-tap intervention (ctrl+c, send command) from the lock screen

---

## 8. Open Source Model

- License: **MIT**
- Contributions welcome via GitHub Issues and PRs
- No paid tier in v1.0
- Monetization (v2+): optional "Pro" tier for teams, not yet defined

---

## 9. Success Metrics

| Metric | v1.0 Target |
|--------|------------|
| GitHub stars (60 days) | ≥ 200 |
| App downloads (60 days) | ≥ 500 |
| Active installs (Day 30) | ≥ 200 |
| Crash-free sessions | ≥ 99.5% |
| Avg session duration | ≥ 3 min |

---

## 10. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| cmux-relay protocol changes break app | Medium | High | Version the protocol; test against relay changes |
| Apple App Store rejection (terminal emulation) | Low | High | App is a remote viewer, not a shell; clearly document in review notes |
| Tailscale not installed / misconfigured | High | Medium | Clear onboarding checklist with deep links to Tailscale docs |
| WebSocket connection drops on iOS background | High | Medium | Background fetch fallback + push notification delivery path |
| React Native terminal rendering performance | Medium | High | Use FlashList + direct canvas drawing for hot path |

---

## 11. Milestones

| Milestone | Description | Target |
|-----------|-------------|--------|
| M1 — Scaffold | Repo, RN project, CI | Week 1 |
| M2 — Connect | Relay connection, workspace list | Week 2 |
| M3 — Render | Terminal renderer, input | Week 3-4 |
| M4 — Notify | Push notifications, biometrics | Week 5 |
| M5 — Polish | Theme, accessibility, performance | Week 6-7 |
| M6 — Beta | TestFlight + internal Android build | Week 8 |
| M7 — Launch | App Store + Play Store submission | Week 10 |
