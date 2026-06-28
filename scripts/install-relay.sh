#!/usr/bin/env bash
# cmux-bridge relay installer
# Usage: curl -fsSL https://raw.githubusercontent.com/your-org/cmux-bridge/main/scripts/install-relay.sh | bash

set -euo pipefail

RELAY_BIN="$HOME/.cmuxremote/bin/cmux-relay"
RELAY_CONFIG="$HOME/.cmuxremote/relay.json"
LAUNCH_PLIST="$HOME/Library/LaunchAgents/com.cmuxbridge.relay.plist"

# ── Check cmux-relay exists ────────────────────────────────────────────────
if [[ ! -f "$RELAY_BIN" ]]; then
  echo "❌  cmux-relay not found at $RELAY_BIN"
  echo "    Install cmux (https://cmuxapp.com) first, then re-run this script."
  exit 1
fi

# ── Write default config if missing ───────────────────────────────────────
if [[ ! -f "$RELAY_CONFIG" ]]; then
  mkdir -p "$(dirname "$RELAY_CONFIG")"
  TAILSCALE_EMAIL=$(tailscale status --json 2>/dev/null | python3 -c "import sys,json; s=json.load(sys.stdin); print(s.get('Self',{}).get('UserID',''))" 2>/dev/null || echo "")
  cat > "$RELAY_CONFIG" <<JSON
{
  "listen":      "0.0.0.0:4399",
  "default_fps": 15,
  "idle_fps":    5,
  "allow_login": ["${TAILSCALE_EMAIL:-YOUR_TAILSCALE_EMAIL}"]
}
JSON
  echo "✅  Config written to $RELAY_CONFIG"
  echo "    Edit allow_login with your Tailscale email if needed."
fi

# ── Set cmux socket to full open access ────────────────────────────────────
defaults write com.cmuxterm.app socketControlMode -string "allowAll"
echo "✅  cmux Socket Control Mode set to Full open access"

# ── Install launchd plist that launches relay from inside cmux env ─────────
# Note: relay must run as a child of a cmux process.
# The plist uses cmux's own shell wrapper to inherit the right environment.
mkdir -p "$(dirname "$LAUNCH_PLIST")"
cat > "$LAUNCH_PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.cmuxbridge.relay</string>
  <key>ProgramArguments</key>
  <array>
    <string>${RELAY_BIN}</string>
    <string>serve</string>
    <string>--config</string>
    <string>${RELAY_CONFIG}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
  <key>StandardErrorPath</key>
  <string>${HOME}/.cmuxremote/log/stderr.log</string>
  <key>StandardOutPath</key>
  <string>${HOME}/.cmuxremote/log/stdout.log</string>
</dict>
</plist>
PLIST

mkdir -p "$HOME/.cmuxremote/log"

# ── Unload any existing relay plist ───────────────────────────────────────
launchctl unload "$LAUNCH_PLIST" 2>/dev/null || true
for old in com.genie.cmuxremote com.cmuxremote.relay; do
  launchctl unload "$HOME/Library/LaunchAgents/${old}.plist" 2>/dev/null || true
done

echo ""
echo "⚠️   cmux-relay requires 'Full open access' in cmux Settings to work as a"
echo "    background service. The installer set this via defaults, but you may need"
echo "    to confirm it in cmux → Settings → Socket Control Mode → Full open access."
echo ""
echo "    To start relay now, open a terminal in cmux and run:"
echo "    $RELAY_BIN serve --config $RELAY_CONFIG"
echo ""
echo "    The launchd plist is installed at:"
echo "    $LAUNCH_PLIST"
echo "    Load it with: launchctl load $LAUNCH_PLIST"
echo ""
echo "✅  cmux-bridge relay setup complete."
