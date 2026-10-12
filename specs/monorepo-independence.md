# Watch Party: infrastructure independence

## Objective and baseline

Own the source and deployment artifacts needed for self-hosted watch parties
without a vendor-imposed meeting duration limit. Use the existing repository as
the monorepo, retaining the frontend layout and centralizing our specifications
and deployment configuration here.

The selected operating model keeps official images while they suit the project.
Local sources are a fallback if upstream images become incompatible with our
needs. Building the entire stack ourselves is a contingency, not a prerequisite
for current deployments. Official image digests and local archive recovery are
documented in `docs/runtime-image-lock.md`.

## Contingency activation

This change is held as a draft PR for future use, not an immediate production
migration. Revisit it if upstream images introduce incompatible restrictions,
approved artifacts become unavailable, or an explicit decision is made to
activate image retention and digest locking. Before merging, review changes to
the deployment since this branch was created, verify the retained archives,
rerun the checks and validate the resulting stack. Do not assume the recorded
versions remain suitable indefinitely or refresh them automatically.

The initial backend source baseline is the `stable/jitsi-meet_10978` tags,
matching the selected Docker release family. lib-jitsi-meet is imported at the
commit referenced by the existing frontend package dependency. Exact revisions
and import hashes live in `components/sources.lock.json`. These tags establish
source provenance, not proof that a local build reproduces an official image.

## Current dependency inventory

| Area | Current state | Remaining work |
| --- | --- | --- |
| Frontend and Docker configuration | Already in this repository | Build and publish owned artifacts |
| Jicofo, Videobridge, lib-jitsi-meet, tpl | Source imported with licenses and fixed SHAs | Build from local source and integrate outputs |
| Jitsi Prosody plugins | Already in `resources/prosody-plugins` | Package local plugins instead of extracting an upstream Debian package |
| Runtime images | Official Jitsi and Caddy images pinned by digest; Linux amd64 archives retained locally; custom web image built on the pinned official web base | Copy archives to independent owned storage; source builds remain a fallback |
| Debian packages | Dockerfiles download from `download.jitsi.org` | Build/package Jitsi components locally; remove this repository from owned images |
| Java dependencies | Maven artifacts include Jitsi libraries and third-party dependencies | Inventory exact versions, retain artifacts, import required Jitsi library sources |
| Frontend dependencies | npm registry and Jitsi GitHub releases, including the existing lib-jitsi-meet tarball | Build the imported library, lock its produced package, retain remaining packages |
| Configuration renderer | Docker base downloads tpl from a Jitsi release | Build the imported tpl source and copy its binary into the image |
| JVB address discovery | Production template now sets `JVB_DISABLE_STUN=1` alongside explicit `JVB_ADVERTISE_IPS` | Verify rendered config and connectivity on the deployed host |
| Browser P2P STUN | Upstream defaults reference Jitsi STUN; production example disables P2P | Supply owned STUN/TURN before enabling P2P; audit browser network requests |
| Prosody, OS and toolchains | External non-Jitsi software | Pin and retain packages as required; outside this initial Jitsi source import |

## Configuration ownership

Production settings are rendered from `infra/ansible/templates/env.prod.j2`
and `docker/jitsi-core/*/rootfs/defaults/`. Local secrets remain outside Git.
The production profile provides the advertised bridge IP explicitly, so it
does not need Jitsi STUN to discover that address. Local development profiles
have not been changed and may still use upstream STUN defaults.

The current production module list does not activate `time_restricted`.
The desired own-build profile has no meeting expiry plugin enabled. A visible
frontend countdown is separate from server-enforced destruction of a room.

## Build migration acceptance criteria

1. Build each core artifact from a recorded source revision and record toolchain
   versions, package locks, checksums, licenses and build commands.
2. Replace upstream downloads with local outputs or retained artifacts. Cover
   transitive Java/JavaScript dependencies, not only the four imported projects.
3. Publish or export all required images under our control, pinned by digest.
   A new machine must deploy from those artifacts without contacting Jitsi's
   image namespace, package repository or GitHub release endpoints.
4. Render and inspect Prosody/JVB/web configurations. Verify that no time-limit
   plugin is loaded and that production discovery does not call Jitsi STUN.
5. Validate a multi-participant session, screen and audio sharing, reconnects,
   and a meeting lasting beyond 95 minutes before replacing production images.
6. Demonstrate rollback using retained known-working images.

## Initial delivery validation

The source-import verifier checks content integrity and license presence.
No Java/Go/backend image rebuild or long-running conference has been validated
by this source-import step. No remote deployment is part of this change.
