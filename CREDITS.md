# Credits and notices

Watch Party stands on the work of the Jitsi project. Almost everything that makes
it work (WebRTC signaling, the media bridge, the conference focus, the web client)
is Jitsi software written by the Jitsi team, its contributors, and the companies
that have sponsored it. This file records what we took, from where, and under
which terms.

Watch Party is an independent project. It is **not affiliated with, sponsored by,
or endorsed by 8x8, Inc. or the Jitsi project.**

## Upstream projects

| Component | Where it lives here | Upstream | Revision | License |
| --- | --- | --- | --- | --- |
| Jitsi Meet (web client) | repository root (`react/`, `modules/`, `css/`, `conference.js`, …) | [jitsi/jitsi-meet](https://github.com/jitsi/jitsi-meet) | Derived from upstream; the most recent upstream commit in this history is `4c42af28c` (2026-08-13). Modified. | Apache-2.0 |
| lib-jitsi-meet | npm dependency in `package.json`, not vendored | [jitsi/lib-jitsi-meet](https://github.com/jitsi/lib-jitsi-meet) | release `v2188.0.0+28875bfa` | Apache-2.0 |
| Jicofo | not in this repository; runs from the official `jitsi/jicofo` image | [jitsi/jicofo](https://github.com/jitsi/jicofo) | `stable-10978` release (source tag `stable/jitsi-meet_10978`) | Apache-2.0 |
| Jitsi Videobridge | not in this repository; runs from the official `jitsi/jvb` image | [jitsi/jitsi-videobridge](https://github.com/jitsi/jitsi-videobridge) | `stable-10978` release (source tag `stable/jitsi-meet_10978`) | Apache-2.0 |
| tpl | binary downloaded at image build time by `docker/jitsi-core/base/Dockerfile` | [jitsi/tpl](https://github.com/jitsi/tpl) | `v1.5.0` | Apache-2.0 |
| docker-jitsi-meet | `docker/jitsi-core` (vendored, trimmed and modified) | [jitsi/docker-jitsi-meet](https://github.com/jitsi/docker-jitsi-meet) | `stable-10978` release family; the exact upstream commit was not recorded | Apache-2.0 (`docker/jitsi-core/LICENSE`) |
| Jitsi Prosody plugins | `resources/prosody-plugins` | part of jitsi/jitsi-meet | same as the web client | Apache-2.0, except files carrying their own header (see below) |

### Runtime images

The deployed stack runs the official Jitsi images
`docker.io/jitsi/{web,prosody,jicofo,jvb}:stable-10978`. They are pulled, not
redistributed from this repository. The Watch Party web image is built `FROM`
the official `jitsi/web` image with this project's client and configuration
copied over it (`docker/jitsi-core/web/Dockerfile.local`).

## Copyright holders

These are the holders named in the file headers that this repository retains:

- **8x8, Inc.** — the large majority of the Jitsi Meet client headers
  (`Copyright @ 2015–present 8x8, Inc.` and variants).
- **Individual contributors** — the upstream commit history is preserved in this
  repository (`git log`) and credits every upstream author.

## Third-party code that carries its own notice

These files keep the license and copyright header they arrived with.

| File | Author(s) | Terms stated in the header |
| --- | --- | --- |
| `docker/jitsi-core/prosody/rootfs/prosody-plugins/mod_auth_cyrus.lua` | Matthew Wild, Waqas Hussain (Prosody IM) | MIT/X11 |
| `docker/jitsi-core/prosody/rootfs/prosody-plugins/mod_muc_moderation.lua` | Kim Alvefur | MIT |
| `docker/jitsi-core/prosody/rootfs/prosody-plugins/sasl_cyrus.lua` | Tobias Markmann | BSD-style, see file header |
| `resources/prosody-plugins/mod_roster_command.lua` | Matthew Wild, Adam Nielsen | MIT/X11 |

The XMPP server itself, [Prosody IM](https://prosody.im), is not part of this
repository; it comes from the upstream Jitsi `prosody` image.

## Modifications

Apache License 2.0, section 4, asks us to say what we changed and to keep the
original notices.

- **Files are modified.** Files derived from Jitsi Meet and from docker-jitsi-meet
  have been changed by this project. The record of every change is this
  repository's git history, which continues upstream's: the first Watch Party
  commit is `7ffc62e40` (2026-08-17), made on top of upstream `63e649aee`
  (2026-07-23), and the newest upstream commit included is `4c42af28c`
  (2026-08-13).
- **Notices are retained.** Original copyright, license and attribution headers
  have been left in place in every file we modified.
- **Files we added** are licensed under Apache-2.0 like the rest of the project
  unless a file header says otherwise.
- **No NOTICE file.** None of the upstream projects listed above ships a
  `NOTICE` file in the revisions we use, so there is none to reproduce.

Main areas where Watch Party differs from upstream Jitsi Meet:

- Client configuration and UI (`config.js`, `interface_config.js`, the reduced
  toolbar, the watch-session status screen, the room-unlock screen).
- Screen-share audio handling (level slider and attenuation in the audio mix,
  higher frame-rate and bitrate ceilings, messages for interrupted sharing).
- A Prosody plugin, `mod_muc_default_password.lua`, that locks every room with a
  passphrase as soon as it is created.
- `docker/jitsi-core`: reduced to the services this project uses (web, prosody,
  jicofo, jvb) and adapted for it.
- `infra/`: Terraform and Ansible deployment, which is original to this project.

## Trademarks

"Jitsi" and "Jitsi Meet", and the Jitsi logo, are the Jitsi project's names and
marks, associated with 8x8, Inc. The Apache License does not grant permission to
use them (section 6) beyond describing where this work comes from, and we make
no claim to them.

The repository still contains upstream branding assets such as
`images/jitsilogo.png` and `images/watermark.svg`. They are not displayed in
Watch Party: `interface_config.js` sets `SHOW_JITSI_WATERMARK` and
`SHOW_BRAND_WATERMARK` to `false`. Anyone redistributing this code under their
own name should replace or remove them.

## Other third-party software

This list is not exhaustive. Watch Party also depends on:

- npm packages (see `package.json` and `package-lock.json`).
- Binary and model assets that the build deploys next to the client:
  `@jitsi/rnnoise-wasm` (noise suppression), `@matrix-org/olm` (end-to-end
  encryption), `@tensorflow/tfjs-backend-wasm` and the bundled TFLite runtime
  and models, `@mediapipe/selfie_segmentation`, `@jitsi/excalidraw` fonts, and
  `@vladmandic/human-models`.
- Operating-system packages inside the Docker images.

Each of these keeps its own license, shipped with the package. They are not
relicensed by this project.
