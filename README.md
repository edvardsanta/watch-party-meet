# <p align="center">Watch Party</p>

<p align="center">Share a screen with sound and watch it together, in a private room.</p>

<hr />

Watch Party is a self-hosted web app for watching something together over a call.
One person shares a screen (or a browser tab) with its audio, the other person
watches it live, and you talk over it with your microphone, camera and chat. It is
built for small private rooms, mainly two people.

It is built on the [Jitsi](https://jitsi.org) stack and derived from
[Jitsi Meet](https://github.com/jitsi/jitsi-meet). See [Credits](#credits).

## How it works

Watch Party is a live screen and audio share over WebRTC, not a synchronized
player. Everyone sees whatever is playing on the sharer's screen, so there is
nothing to keep in sync: the sharer presses play and the others see it.

## Features

- **Screen share with audio.** Share a screen or tab together with its sound.
  Frame-rate and bitrate ceilings are raised so that video playback stays smooth.
- **Audio mix control.** The sharer can adjust the level of the shared audio
  against their microphone, and shared audio is attenuated by default so it does
  not bury the voice.
- **Session status.** The room says what it is waiting for (the other person, or
  a screen share) and explains when sharing was interrupted or no audio was
  captured.
- **Automatic room passphrase.** Every room is locked with a shared passphrase as
  soon as it is created, so a room is never reachable without it.
- **A reduced interface.** The toolbar is limited to microphone, camera, screen
  share, share audio, chat, participants, tile view, settings and hang up. Polls,
  reactions, the welcome page, deep linking and the self-view tile are turned
  off, and the filmstrip is disabled. Tile view is available.
- **Camera off by default**, with the microphone on.
- **Chat and a participants panel.**
- **Configurable name.** The app name shown in the UI is set at container start
  with `WATCHPARTY_APP_NAME`; it is not hard-coded.

### Limitations

- **The two-person limit is not enforced.** The session screen tells you when
  more than two people are in the room, but the server does not block anyone.
- **Audio capture depends on the browser and on what you share.** When no audio
  track is present, the app says so.
- **Web only.** The Docker and infrastructure code here builds and deploys the
  web client. The repository still contains upstream's React Native code, which
  is not built or supported.

## Running it

- **Local development:** [`docs/dev-runbook.md`](docs/dev-runbook.md) covers the
  dev server with a local Docker backend, and building the full local image.
- **Production:** [`docs/terraform-ansible-runbook.md`](docs/terraform-ansible-runbook.md)
  goes from provisioning a server with Terraform to deploying with Ansible.
- **Smaller machines and home networks:**
  [`docs/low-spec-local-test.md`](docs/low-spec-local-test.md),
  [`docs/small-prod-local-test.md`](docs/small-prod-local-test.md) and
  [`docs/router-local-test.md`](docs/router-local-test.md).
- **Product background:** [`docs/watch-party-context.md`](docs/watch-party-context.md).

For anything at the Jitsi platform level that this project does not change
(XMPP, Jicofo, Videobridge, Prosody), the
[Jitsi handbook](https://jitsi.github.io/handbook/docs/devops-guide/) is the
reference.

## Repository layout

| Path | What it is |
| --- | --- |
| `react/`, `modules/`, `css/`, `conference.js`, `config.js`, `interface_config.js` | The web client (Jitsi Meet, modified) |
| `docker/jitsi-core/` | Docker Compose stack and image configuration: web, Prosody, Jicofo, Jitsi Videobridge |
| `infra/terraform/`, `infra/ansible/` | DigitalOcean provisioning and deployment |
| `docs/` | Runbooks and notes |

## Security

- Rooms are locked with a passphrase set automatically when the room is created
  (`docker/jitsi-core/prosody/prosody-plugins-custom/mod_muc_default_password.lua`).
- The production example sets `enable_p2p: false`, so media goes through your own
  Jitsi Videobridge rather than directly between participants.
- Beyond that, the security model is Jitsi's. See
  [Jitsi's security overview](https://jitsi.org/security) and its
  [E2EE whitepaper](https://jitsi.org/e2ee-whitepaper/).

`SECURITY.md` is inherited from upstream and sends reports to the Jitsi security
team. That is the right place for a vulnerability in Jitsi's own components. For a
vulnerability in this project's changes, such as the room passphrase or the
deployment code, contact the maintainer ([@edvardsanta](https://github.com/edvardsanta))
directly instead of the Jitsi channels, and please do not post details publicly first.

## Credits

Watch Party would not exist without Jitsi Meet, Jicofo, Jitsi Videobridge,
lib-jitsi-meet and docker-jitsi-meet, created and maintained by the Jitsi team at
[8x8](https://8x8.com) and the Jitsi community. [CREDITS.md](CREDITS.md) lists
every upstream project, the revisions we use, the copyright holders, what we
changed, and the trademark notice.

This is an independent project. It is not affiliated with, sponsored by, or
endorsed by 8x8, Inc. or the Jitsi project.

## License

Apache License 2.0. See [LICENSE](LICENSE). Upstream components and bundled
third-party code keep their own licenses; see [CREDITS.md](CREDITS.md).

## Contributing

Issues and pull requests are welcome. Commits follow
[Conventional Commits](https://www.conventionalcommits.org) with a scope, for
example `fix(screen-share): …`. Before opening a PR, run `npm run lint:ci` and
`npm run tsc:web`.

`CONTRIBUTING.md` is inherited from upstream and describes contributing to Jitsi
Meet itself, not this project.
