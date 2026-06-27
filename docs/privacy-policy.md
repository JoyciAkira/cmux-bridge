# Privacy Policy — Cmux Bridge

**Effective date:** 2026-07-01  
**App:** Cmux Bridge  
**Developer:** Daniele Corrao

---

## Data We Collect

**None.** Cmux Bridge does not collect, store, transmit, or share any personal data.

Specifically:
- No analytics or usage tracking
- No crash reporting sent to external servers
- No advertising identifiers
- No account creation required

## Data Stored on Your Device

The following data is stored **locally on your device only**, never transmitted:

- Tailscale IP addresses and port numbers of your Macs (stored in the iOS Keychain / Android Keystore)
- Terminal display preferences (font size, scrollback lines, reduce motion) stored in local app storage

## Network Connections

Cmux Bridge connects **only** to the IP addresses you manually enter (your Macs' Tailscale IPs). All connections are made directly over your private Tailscale mesh network. No data is routed through any external server.

## Push Notifications

If you grant notification permission, Cmux Bridge uses Apple Push Notification Service (APNs) or Firebase Cloud Messaging (FCM) to deliver notifications. The notification payload contains only the workspace name and event type — no terminal content.

## Third-Party Services

None. Cmux Bridge uses no third-party analytics, advertising, or data collection SDKs.

## Changes

If this policy changes, the updated version will be committed to the public repository at github.com/JoyciAkira/cmux-bridge with a clear changelog entry.

## Contact

Open an issue at https://github.com/JoyciAkira/cmux-bridge/issues
