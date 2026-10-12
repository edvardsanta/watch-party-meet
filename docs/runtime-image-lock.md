# Runtime image lock and offline recovery

Watch Party continues using official Jitsi images. The imported sources are a
fallback if upstream releases become unsuitable; they are not used to rebuild
the current runtime.

## What is pinned

`docker/jitsi-core/images.lock.json` records the official web, Prosody, Jicofo,
Videobridge (`stable-10978`) and Caddy (`2-alpine`) images resolved on 2026-10-11.
It contains immutable index digests and platform-specific manifest/config
digests for Linux amd64 and arm64. These are the artifacts available at the
time of resolution, not evidence of which Caddy image an earlier server used.

- Base Compose uses literal digest references for the four Jitsi services.
- The production override reads backend and Caddy references from the lock.
- The local web Dockerfile and Compose build argument pin the official web base.
- `scripts/build-local-export-droplet.sh` renders a temporary Dockerfile with
  the locked base, including when `SOURCE_DIR` points to an older checkout.
  An unrecognized base fails instead of silently building against another image.
- No deploy command refreshes the lock. `resolve` refuses to overwrite it.

A moved upstream tag cannot change these selected image contents. A removed
upstream image causes a pull failure, which is why retaining archives matters.
The customized Watch Party web image still uses our own deployment tag and is
not an official upstream artifact.

The lock does not pin operating system packages installed on the host, npm
downloads during a new frontend build, or the unused source-build Dockerfiles
in `docker/jitsi-core`. It does not add unattended update software.

## Create and check a backup

From the repository root:

```sh
python3 scripts/runtime_images.py backup
python3 scripts/runtime_images.py verify
```

The default destination is `.runtime-images/stable-10978-linux-amd64/`, ignored
by Git and excluded from the web Docker build context. It contains five Docker
archives and `backup.json`, with a SHA-256 checksum and expected image ID for
each archive, plus a copy of `images.lock.json`. Pulls use platform manifest digests, not tags. Image IDs are
checked against the lock before archiving. An interrupted, incomplete backup
fails verification.

The backup uses Docker by default, also supporting a Docker command backed by
Podman. Use `--engine podman` if needed. For another destination/platform:

```sh
python3 scripts/runtime_images.py backup --platform linux/arm64 --directory /path/to/arm64-backup
python3 scripts/runtime_images.py verify --directory /path/to/arm64-backup
```

Copy the entire backup directory and the matching repository revision to owned
storage on another device for protection against losing the local disk. The
tool creates a local copy; it does not upload to an external storage service.
Keep a separate export of each approved custom web image too:

```sh
docker save -o /path/to/watchparty-web.tar watchparty/jitsi-web:YOUR_DEPLOY_TAG
sha256sum /path/to/watchparty-web.tar > /path/to/watchparty-web.tar.sha256
```

## Restore without upstream access

Using the matching image lock/repository revision on the destination host:

```sh
python3 scripts/runtime_images.py restore --directory /path/to/backup
```

After upgrading the repository's lock, explicitly select an older backup's
saved lock with `--lock /path/to/backup/images.lock.json` when verifying or
restoring that older version.

Restore first verifies **all** archive checksums, then loads the images and
checks their IDs. It generates `compose.offline.yml` using verified local tags
and `pull_policy: never`. Docker archives do not reliably preserve registry
digest aliases, so recovery uses these local tags instead of expecting digest
lookups to work offline.

For the Caddy-enabled production stack, apply that override last:

```sh
docker compose -f docker-compose.yml -f docker-compose.prod.yml \
  -f /path/to/backup/compose.offline.yml up -d --pull never
```

The override covers Prosody, Jicofo, JVB and Caddy. It deliberately does not
replace the customized Watch Party web image with the archived upstream web
base. Restore the separate custom web export and retain the production
`web_image` tag before starting the stack. Do not run the regular online deploy
path during offline recovery; it installs host packages and may pull images.
Local setups without Caddy should omit its entry from the generated override.

The upstream web base archive is retained for future builds. Using its restored
local tag as a build base requires an explicit reviewed build configuration;
the normal build script continues to enforce the registry digest lock.

## Deliberate upgrades

Review a replacement lock and update the literal references in base Compose,
`docker-compose.local-web.yml`, and `web/Dockerfile.local` together. Update the
legacy release validation in the Ansible playbook if changing release families.
Retain the old lock and archives, run the image-lock tests, create and verify
the new backup, and validate conferencing before deploying the new selection.
Changing source fallback snapshots is a separate decision.
