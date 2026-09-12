# Watchparty - Local Context

This repo is being customized as a two-person watch-party experience, using Jitsi Meet as the base.

## Goal

- Create a private room for friends/couples.
- Prioritize screen and audio sharing.
- Keep the camera off/hidden by default.
- Keep a simple chat available.
- Reduce the interface to the watch-together flow.
- Work mostly on the frontend, keeping `prosody`, `jicofo`, and `jvb` official.

## Current local stack

The `docker-jitsi-meet` core was brought into:

```text
docker/jitsi-core/
```

The main compose file lives at:

```text
docker/jitsi-core/docker-compose.yml
```

The override to use the local frontend lives at:

```text
docker/jitsi-core/docker-compose.local-web.yml
```

Services used:

- `web`: local image `watchparty/jitsi-web:local`
- `prosody`: `docker.io/jitsi/prosody:stable-10978`
- `jicofo`: `docker.io/jitsi/jicofo:stable-10978`
- `jvb`: `docker.io/jitsi/jvb:stable-10978`

Pinned version:

```text
stable-10978
```

## How to bring it up

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml up -d --build
```

Local URL:

```text
https://localhost:8443/<room>
```

Use `localhost`, not `127.0.0.1`, because the local `PUBLIC_URL` is set to `https://localhost:8443`.

## How to stop it

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml down
```

## Room access

Access is gated by a passphrase, applied automatically to every room as soon as it's created (see `docker/jitsi-core/prosody/prosody-plugins-custom/mod_muc_default_password.lua`), driven by:

```text
XMPP_MUC_MODULES=muc_default_password
WATCHPARTY_ROOM_PASSWORD=<shared passphrase>
```

To change it without restarting the whole stack:

```bash
cd docker/jitsi-core
./scripts/set-room-password.sh --prompt
docker compose -f docker-compose.yml -f docker-compose.local-web.yml restart prosody
```

There used to be an nginx Basic Auth layer here instead; it was removed because it doesn't survive WebSocket reconnects on mobile Safari/Chrome-iOS (repeated 401s on `/xmpp-websocket`, causing constant re-prompts and dropped calls).

## Changes already made to the product

### `config.js`

- Simplified flow for watch party.
- `disablePolls`, `disableReactions`, `disableSelfView`, and `disableSelfViewSettings` on.
- `startLowBandwidthMode=false`.
- `startWithAudioMuted=false`.
- `startWithVideoMuted=true`.
- `enableWelcomePage=false`.
- Toolbar reduced to microphone, screen share, audio share, chat, participants, settings, and hang up.
- Minimized prejoin.

### `interface_config.js`

- `APP_NAME`/`PROVIDER_NAME` ship as the placeholder `{NAME HERE}`; the real brand name is supplied at container boot via the `WATCHPARTY_APP_NAME` env var, never committed.
- Welcome page, footer, recent list, mobile promo, and watermark reduced.
- `SETTINGS_SECTIONS` trimmed down.
- `HIDE_INVITE_MORE_HEADER=true`.

### Auth/UI

- `PasswordRequiredPrompt.web.tsx` (the native Jitsi room-lock dialog) was reskinned as a dedicated room-unlock screen.
- `LoginDialog.tsx`/`WaitForOwnerDialog.tsx` (real account-based auth, currently unused since `ENABLE_AUTH=0`) got the same visual treatment for consistency, in case that flow gets enabled later.

### Two-person flow

- A session-status component shows states for:
  - waiting for the guest;
  - waiting for screen sharing;
  - a visual two-person limit;
  - chat open.

This limit is still visual/UX only. Real blocking of a third person still needs to be implemented via Prosody/moderation/lobby.

## Build/tests done

Commands that have passed:

```bash
npm run tsc:web -- --pretty false
make compile deploy
```

Note: the full `tsc:ci` still has native typing errors unrelated to the current web flow.

## Likely next tasks

- Turn the two-person limit into a real server-side rule.
- Improve the main screen to feel like a watch-together experience, not a generic call.
- Adjust room states: host waiting for guest, guest waiting for host, watching, disconnected.
- Build more watch-party-specific controls.
- Remove more corporate Jitsi surfaces that still show up in the UI.
