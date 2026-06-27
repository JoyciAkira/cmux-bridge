# Beta & Launch Guide

## Prerequisiti

| Strumento | Versione minima | Note |
|-----------|----------------|------|
| Node.js | 20+ | `node -v` |
| EAS CLI | 16+ | `npm install -g eas-cli` |
| Expo account | — | [expo.dev](https://expo.dev) (gratuito) |
| Apple Developer account | — | $99/anno — richiesto per TestFlight |
| Google Play Console | — | $25 una tantum — richiesto per Android |

---

## G006 — Beta Build

### 1. Login EAS

```bash
eas login
eas whoami
```

### 2. Configura il progetto EAS

```bash
cd ~/Projects/cmux-bridge
eas build:configure
```

Questo aggiorna `app.json` con `extra.eas.projectId`.

### 3. Build iOS (TestFlight)

```bash
# Build per distribuzione interna (TestFlight)
eas build --platform ios --profile preview
```

EAS gestisce automaticamente provisioning profile e certificati.
Al termine, EAS stampa un link di download. Caricalo su TestFlight da App Store Connect.

### 4. Build Android (internal track)

```bash
# Build APK per internal testing
eas build --platform android --profile preview
```

Scarica l'APK dal link EAS e caricalo su Google Play Console → Internal testing.

### 5. GitHub Actions automatico

Dopo aver aggiunto il secret `EXPO_TOKEN` nel repo GitHub:
- Settings → Secrets → Actions → `EXPO_TOKEN`

Ogni push su `main` trigghera automaticamente `.github/workflows/eas-build.yml`.

---

## G007 — Launch (App Store + Play Store)

### iOS — App Store

```bash
# Build production
eas build --platform ios --profile production

# Submit direttamente da EAS
eas submit --platform ios --profile production
```

Oppure usa il workflow GitHub Actions `eas-submit.yml` con `workflow_dispatch`.

**Secrets richiesti in GitHub:**
- `EXPO_TOKEN`
- `APPLE_ID` (es. `daniele@example.com`)
- `ASC_APP_ID` (da App Store Connect → App → ID)
- `APPLE_TEAM_ID` (da developer.apple.com → Membership)

**Review checklist Apple:**
- [ ] Privacy policy URL (richiesta per app con notifiche)
- [ ] Screenshot per iPhone 6.5" e 5.5"
- [ ] App description in inglese
- [ ] Review notes: "This app is a remote terminal viewer for cmux on macOS, connecting over a private Tailscale VPN. It does not execute arbitrary shell commands — it communicates with a local relay daemon."

### Android — Play Store

```bash
# Build production AAB
eas build --platform android --profile production

# Submit
eas submit --platform android --profile production
```

**Richiede:** `google-service-account.json` nella root del progetto (non committare — aggiungere a `.gitignore`).

**Review checklist Google:**
- [ ] Privacy policy URL
- [ ] Screenshot per phone e tablet
- [ ] Feature graphic (1024×500)
- [ ] Dichiarazione permessi: `INTERNET`, `VIBRATE`, `POST_NOTIFICATIONS`

---

## Notifiche push in produzione

Le push notifications richiedono un device fisico iOS/Android. Nel simulatore iOS le notifiche locali funzionano, ma APNs no.

Per testare su device:
1. Installa la build preview su iPhone via TestFlight
2. Apri l'app → accetta il permesso notifiche
3. Su Mac, triggera un evento agente in cmux → la notifica arriva entro ~2s

---

## Variabili d'ambiente / secrets

Non committare mai:
- `google-service-account.json`
- `.env` con credenziali
- Certificati `.p12` / `.p8`

Usa sempre EAS Secrets per le build remote:
```bash
eas secret:create --scope project --name SOME_KEY --value "value"
```
