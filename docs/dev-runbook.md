# Development Runbook

How to run and test the Watchparty frontend locally, with a local Docker backend.

There are two loops:

| Loop | Use it for | Speed |
| --- | --- | --- |
| **A. Dev server + local Docker backend** | Day-to-day frontend work (React, CSS, audio/video UI) | Hot reload, seconds |
| **B. Full local image** | Checking the exact image that will be deployed | Production build, minutes |

## Do not use the default proxy target

`make dev` proxies to `https://alpha.jitsi.net` when `WEBPACK_DEV_SERVER_PROXY_TARGET` is not set. That is a public test server that ends meetings after about 5 minutes, which is useless for testing screen sharing or audio. Always point it at the local Docker stack (loop A).

## Prerequisites

- Node.js and npm, with `npm install` already done.
- Docker Compose (`docker compose`) or `podman-compose`.
- `openssl` (used by `gen-passwords.sh`).
- Two browser profiles, or a browser plus a private window, so you can join the same room twice.

## One-time setup of the backend stack

```bash
cd docker/jitsi-core
cp env.example .env
./gen-passwords.sh
```

Then edit `docker/jitsi-core/.env`:

```env
CONFIG=/home/<you>/.jitsi-meet-cfg-dev
HTTP_PORT=8000
HTTPS_PORT=8443
PUBLIC_URL=https://localhost:8443
JVB_ADVERTISE_IPS=127.0.0.1
```

Use an absolute `CONFIG` path (compose does not reliably expand `~`) and create its folders:

```bash
mkdir -p ~/.jitsi-meet-cfg-dev/{web,transcripts,prosody/config,prosody/prosody-plugins-custom,jicofo,jvb}
```

Use a dedicated `CONFIG` directory per environment. Prosody stores the user passwords there, so reusing a directory from another stack, or re-running `gen-passwords.sh` against an old one, breaks authentication.

`JVB_ADVERTISE_IPS` must be an address your browser can reach for media. `127.0.0.1` works when the browser runs on the same machine as Docker. Use the LAN IP instead if you test from another device. `.env` is local, never commit it.

## Loop A: dev server against the local backend

1. Start only the backend services (web, prosody, jicofo, jvb):

   ```bash
   cd docker/jitsi-core
   docker compose up -d
   docker compose ps
   ```

2. Start the frontend dev server from the repository root, pointing at the local stack:

   ```bash
   WEBPACK_DEV_SERVER_PROXY_TARGET=https://localhost:8443 make dev
   ```

3. Open `https://localhost:8080/<room>` and accept the self-signed certificate warning. The dev server serves the JS/CSS from your working tree and proxies everything else (BOSH/WebSocket, config) to the Docker stack.

4. Edit files under `react/`, `css/`, `lang/`. The page reloads by itself.

Notes:

- Port `8080` is the dev server. Port `8443` is the Docker stack. Visiting `8443` directly shows the **image's** frontend, not your working tree.
- If `8080` is already in use, find and stop the old dev server before starting a new one.
- Stop the dev server with `Ctrl+C`. Stop the backend with `docker compose down` in `docker/jitsi-core`.

## Loop B: build and run the full local image

The local web image copies the **compiled** `libs/` and `css/all.css` from the repository. `make compile` only writes `build/`; `make deploy` copies the result into `libs/`. Run both (or `make all`):

```bash
make compile
make deploy

cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  up -d --build --force-recreate
```

Open `https://localhost:8443/<room>`.

For resource-limited variants see [low-spec-local-test.md](low-spec-local-test.md) and [small-prod-local-test.md](small-prod-local-test.md).

`make compile` wipes `build/` and `make deploy` recreates `libs/`. Do not run them while a dev server is running.

## Working in a git worktree

A worktree has its own `libs/` and `docker/` context, so loop B builds what is checked out in that worktree. A fresh worktree has no `node_modules`: run `npm install` there, or link the main checkout's (`ln -s ../../node_modules node_modules`) and do not commit the link.

Also create the worktree from `fork/master`, not the local `master`, which can be behind.

## Checks before committing

```bash
npm run tsc:web
npm run tsc:native
npm run lint:ci
npm run lint:lang
```

- `tsc:native` currently reports one error in `react/features/base/user-interaction/middleware.ts` (`EventListener`) that is unrelated to feature work.
- `lint:ci` ignores files inside dot-directories such as `.worktrees/`. From a worktree, lint the changed files with `npx eslint --no-ignore <files>`.

## Manual test: screen share audio

1. Join a room with two browsers, A and B.
2. In A, share a **tab or screen with audio** (tick the audio option in the browser picker). On Linux, sharing a whole screen or window often offers no audio; share a browser tab playing sound.
3. In A, hover your own tile, open its `...` menu and use **Shared screen audio level**. This is the level of the shared audio relative to your microphone in what others hear.
4. In B, check that A's voice and the shared audio are both audible, and that moving the slider in A changes the balance live.
5. Stop and restart the share in A, then confirm the slider disappears and reappears, and audio still works.
6. In B, open A's tile menu and check the per-participant volume slider. It scales A's whole audio (voice plus shared audio) on B's side only.

The shared-screen audio is mixed into A's microphone track before it is sent, so B cannot adjust voice and shared audio separately.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Meeting ends after about 5 minutes | Dev server is proxying to `alpha.jitsi.net`. Set `WEBPACK_DEV_SERVER_PROXY_TARGET`. |
| Jicofo logs `SASLError ... not-authorized` and Prosody logs `User exists` | `CONFIG` holds users from an older stack with different passwords. Point `CONFIG` at a fresh directory (or wipe it), then `docker compose down && up -d`. A few such errors right after `up` are a normal start-up race. |
| Joined, but no audio or video between browsers | `JVB_ADVERTISE_IPS` is wrong, or UDP `10000` is blocked. Check `docker compose logs jvb`. |
| Certificate warning | Expected with the self-signed certificate. |
| No screen-share audio option | The browser did not offer audio for that capture source. Share a tab with audio. |
| No "Shared screen audio level" slider | It only shows while audio is being shared, in the `...` menu of your own tile. |
| Change not visible | You opened `8443` (image) instead of `8080` (dev server), or the image was not rebuilt in loop B. |
| Files return 403 in the browser (loop B) | Restrictive host file permissions; the Dockerfile normally fixes this, rebuild with `--build`. |
| `Cannot find name 'AudioContext'` in native tsc | DOM types are not available to native; keep DOM-only code typed loosely or in `.web` files. |

## Shut down

```bash
cd docker/jitsi-core
docker compose down
```
