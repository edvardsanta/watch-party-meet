# Jitsi Docker Core

This directory vendors the core runtime from `docker-jitsi-meet` inside this repository.

It intentionally keeps only the services needed for the watch-party stack:

- `web`
- `prosody`
- `jicofo`
- `jvb`
- `base`
- `base-java`

Optional services such as Jibri, Jigasi, Etherpad, monitoring, recording, transcription and whiteboard are not included here.

## Local Run

From this directory:

```bash
cp env.example .env
./gen-passwords.sh
mkdir -p "${CONFIG:-$HOME/.jitsi-meet-cfg}/prosody/prosody-plugins-custom"
cp prosody/prosody-plugins-custom/*.lua "${CONFIG:-$HOME/.jitsi-meet-cfg}/prosody/prosody-plugins-custom/"
docker compose up -d
```

The `prosody` service loads custom plugins (including the room-lock passphrase
in `mod_muc_default_password.lua`) from `${CONFIG}/prosody/prosody-plugins-custom`,
which is an external, persistent volume - not something the image copies from
this repo automatically. Re-run the `cp` above whenever you change a plugin
file locally. (The `infra/ansible` production playbook does this same sync
automatically on every deploy.)

For local HTTPS testing, set these values in `.env`:

```env
CONFIG=~/.jitsi-meet-cfg
HTTP_PORT=8000
HTTPS_PORT=8443
PUBLIC_URL=https://localhost:8443
ENABLE_WELCOME_PAGE=0
ENABLE_PREJOIN_PAGE=1
DISABLE_HTTPS=0
ENABLE_XMPP_WEBSOCKET=0
BOSH_RELATIVE=1
XMPP_MUC_MODULES=muc_default_password
WATCHPARTY_ROOM_PASSWORD=changeme
WATCHPARTY_APP_NAME=YourAppName
JITSI_IMAGE_VERSION=stable-10978
```

The room password is applied automatically to every room as soon as it's created,
by `prosody-plugins-custom/mod_muc_default_password.lua` (hooked into
`muc-room-created`). To change it later without stopping the stack, use
`./scripts/set-room-password.sh --prompt`.

`interface_config.js` ships with `APP_NAME`/`PROVIDER_NAME` set to the
placeholder `{NAME HERE}` - no brand name is committed. Setting
`WATCHPARTY_APP_NAME` fills it in at boot (see
`web/rootfs/etc/cont-init.d/05-watchparty-config`).

Then open:

```text
https://localhost:8443/watch
```

Use `localhost` exactly. The generated `config.js` derives the BOSH and XMPP
WebSocket URLs from `PUBLIC_URL`; opening the room as
`https://127.0.0.1:8443/watch` while `PUBLIC_URL` is set to
`https://localhost:8443` can make the web UI load but fail the conference
connection with a “You have been disconnected” message.

## Local Frontend Work

The Docker core can run with official images while the frontend is being customized in the repository root.

To test the local `jitsi-meet` frontend inside the Docker stack, build the web assets from the repository root:

```bash
npm install
make compile deploy
```

Then run the stack from this directory with the local web override:

```bash
docker compose -f docker-compose.yml -f docker-compose.local-web.yml up -d --build
```

Open:

```text
https://localhost:8443/watch
```

If the browser shows a disconnected/reconnecting message, first confirm the page
URL uses the same host as `PUBLIC_URL` in `.env`. For the default local setup,
that means `https://localhost:8443/watch`, not `https://127.0.0.1:8443/watch`.
The local stack disables XMPP WebSocket and uses relative BOSH (`/http-bind`) to
avoid Firefox rejecting the self-signed certificate on `wss://localhost:8443`.

The override builds `watchparty/jitsi-web:local` from the official Jitsi `web` image and replaces only the static web assets compiled from this repository. Runtime meeting config still comes from Docker env/config files and optional `/config/web/custom-config.js`.

The default image version is pinned to `stable-10978` for `web`, `prosody`, `jicofo` and `jvb`. Change `JITSI_IMAGE_VERSION` deliberately when we decide to upgrade the base stack.
