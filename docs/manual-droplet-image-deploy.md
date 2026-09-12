# Manual Droplet Deploy with a Prebuilt Image

This is the simple path for now: the build happens locally, the ready Docker image is sent to the droplet over SSH, and the droplet just runs `docker compose`.

Doesn't use a registry, GitHub Actions, Terraform, or Ansible.

## 1. Prepare the droplet once

On the Ubuntu droplet:

```bash
apt-get update
apt-get install -y docker.io docker-compose-plugin rsync
systemctl enable --now docker
```

Create the app directory:

```bash
mkdir -p /opt/watchparty
```

## 2. Copy runtime files to the droplet

From your local machine:

```bash
rsync -av \
  --exclude '.env' \
  --exclude '.env.*' \
  docker/jitsi-core/ \
  root@<droplet-host>:/opt/watchparty/docker-jitsi-core/
```

The production `.env` should be created on the droplet, not copied from the local environment.

## 3. Create `.env` on the droplet

On the droplet:

```bash
cd /opt/watchparty/docker-jitsi-core
cp env.example .env
```

Edit at least:

```env
CONFIG=/opt/watchparty/config
HTTP_PORT=80
HTTPS_PORT=443
PUBLIC_URL=https://<domain-or-ip>
JVB_ADVERTISE_IPS=<droplet-public-ip>
ENABLE_P2P=0
ENABLE_LETSENCRYPT=1
LETSENCRYPT_DOMAIN=<domain>
LETSENCRYPT_EMAIL=<email>
JICOFO_AUTH_PASSWORD=<strong-password>
JVB_AUTH_PASSWORD=<strong-password>
JIGASI_XMPP_PASSWORD=<strong-password>
JIGASI_TRANSCRIBER_PASSWORD=<strong-password>
JIBRI_RECORDER_PASSWORD=<strong-password>
JIBRI_XMPP_PASSWORD=<strong-password>
XMPP_MUC_MODULES=muc_default_password
WATCHPARTY_ROOM_PASSWORD=<shared-passphrase>
```

If using an IP without a domain, disable Let's Encrypt and keep a port/certificate appropriate for the test.

## 4. Build and send the web image

From your local machine:

```bash
DROPLET_HOST=<droplet-host> ./scripts/build-local-export-droplet.sh
```

With a specific SSH key:

```bash
SSH_KEY_PATH=~/.ssh/id_ed25519 DROPLET_HOST=<droplet-host> ./scripts/build-local-export-droplet.sh
```

For an ARM64 droplet:

```bash
PLATFORM=linux/arm64 DROPLET_HOST=<droplet-host> ./scripts/build-local-export-droplet.sh
```

To only build locally:

```bash
SAVE_IMAGES_ONLY=true ./scripts/build-local-export-droplet.sh
```

The script prints the generated image:

```text
WEB_IMAGE=watchparty/jitsi-web:<tag>
```

## 5. Start the droplet with the prebuilt image

On the droplet:

```bash
cd /opt/watchparty/docker-jitsi-core
WEB_IMAGE=watchparty/jitsi-web:<tag> docker compose -f docker-compose.yml -f docker-compose.prebuilt.yml up -d --force-recreate
```

Check status:

```bash
docker compose -f docker-compose.yml -f docker-compose.prebuilt.yml ps
```

Logs:

```bash
docker compose -f docker-compose.yml -f docker-compose.prebuilt.yml logs --tail=200
```

## 6. Update to a new version

On your local machine:

```bash
TAG=$(git rev-parse --short HEAD) DROPLET_HOST=<droplet-host> ./scripts/build-local-export-droplet.sh
```

On the droplet:

```bash
cd /opt/watchparty/docker-jitsi-core
WEB_IMAGE=watchparty/jitsi-web:<tag> docker compose -f docker-compose.yml -f docker-compose.prebuilt.yml up -d --force-recreate web
```

## 7. Firewall ports

Open on the DigitalOcean firewall:

```text
22/tcp      SSH, restricted to your IP when possible
80/tcp      HTTP/Let's Encrypt
443/tcp     HTTPS
10000/udp   JVB media
```

## Notes

- The droplet doesn't build the frontend.
- The droplet needs enough disk space to receive `docker save | docker load`.
- The production `.env` stays on the droplet and must not be committed.
- The next professional step is to replace this flow with registry + CI/CD.
