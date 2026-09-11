# Deploy and Migration

This document describes a more professional approach to operating and migrating the Watchparty/Jitsi Meet stack using Terraform, Ansible, Docker Compose, and CI/CD.

## Goal

Separate responsibilities:

- Terraform provisions infrastructure.
- Ansible configures servers and applies the deploy.
- CI/CD builds images, publishes to the registry, and triggers the deploy.
- Docker Compose runs the Jitsi services on the host.

With this separation, migrating to another server becomes a repeatable process: provision infra, apply configuration, and point DNS.

## Recommended Architecture

```text
GitHub
  push main
    |
    v
GitHub Actions
  build custom web image
  push ghcr.io/org/watchparty-jitsi-web:<sha>
    |
    v
Ansible
  update .env/compose
  docker compose pull
  docker compose up -d --force-recreate
    |
    v
Server
  web + prosody + jicofo + jvb
```

## Terraform

Use Terraform to create or change infrastructure resources:

- VM/VPS.
- Fixed public IP.
- Firewall/security groups.
- DNS.
- Persistent volume.
- Optionally registry, secrets manager, and load balancer.

Important ports:

- `80/tcp` and `443/tcp` for HTTP/HTTPS, or `8443/tcp` if keeping the current mode.
- `10000/udp` for JVB media.
- `22/tcp` for restricted SSH only.

Useful Terraform outputs:

- Server public IP.
- Hostname/DNS.
- Persistent volume path.

## Ansible

Use Ansible to prepare and maintain the server:

- Install Docker or Podman.
- Install `docker compose`.
- Create a deploy user.
- Create directories under `/opt/watchparty`.
- Render `.env` from a template.
- Render `docker-compose.prod.yml`.
- Log in to the registry.
- Run `docker compose pull`.
- Run `docker compose up -d --force-recreate`.
- Configure logrotate, backup, and maintenance tasks.

The deploy should be idempotent: running it twice in a row shouldn't break anything or recreate resources unnecessarily.

## Production Docker Compose

The server shouldn't compile the app. It should only pull already-published images.

Override example:

```yaml
services:
  web:
    image: ghcr.io/your-org/watchparty-jitsi-web:${WEB_IMAGE_TAG}
    read_only: false

  prosody:
    read_only: false

  jicofo:
    read_only: false

  jvb:
    read_only: false
```

The base compose stays Jitsi's own:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

To update only the frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull web
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate web
```

## CI/CD

The pipeline should:

1. Check out the repository.
2. Build the custom `web` image.
3. Publish the image to the registry with an immutable tag, preferably the commit SHA.
4. Call Ansible to apply the deploy.

Avoid depending only on `latest`. Use SHA-based tags:

```text
ghcr.io/your-org/watchparty-jitsi-web:2f4c9ab
```

Example flow:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  build-web:
    runs-on: ubuntu-latest

    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          context: .
          file: docker/jitsi-core/web/Dockerfile.local
          push: true
          tags: |
            ghcr.io/your-org/watchparty-jitsi-web:${{ github.sha }}
          build-args: |
            JITSI_IMAGE_REPO=docker.io/jitsi
            JITSI_IMAGE_VERSION=stable-10978

  deploy:
    needs: build-web
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run Ansible deploy
        env:
          WEB_IMAGE_TAG: ${{ github.sha }}
        run: |
          ansible-playbook \
            -i infra/ansible/inventory.ini \
            infra/ansible/playbook.yml \
            --extra-vars "web_image_tag=${WEB_IMAGE_TAG}"
```

## Suggested Structure

```text
infra/
  terraform/
    main.tf
    variables.tf
    outputs.tf

  ansible/
    inventory.ini
    playbook.yml
    group_vars/
      production.yml
    templates/
      docker-compose.prod.yml.j2
      env.j2

.github/
  workflows/
    deploy.yml
```

## Secrets

Never commit:

- The room passphrase.
- Prosody/Jicofo/JVB passwords.
- SSH keys.
- Registry tokens.
- Private certificates.

Use GitHub Secrets, Ansible Vault, or a secrets manager.

Secrets expected in CI:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- Registry credentials, if not using GHCR with `GITHUB_TOKEN`

## Persistence and Backup

Jitsi's `${CONFIG}` directory must be persistent and migratable.

Minimum backup:

- `${CONFIG}/web`
- `${CONFIG}/prosody`
- `${CONFIG}/jicofo`
- `${CONFIG}/jvb`
- `.env` or a secure source for its variables

Before migrating:

1. Stop writes on the old host, if possible.
2. Back up `${CONFIG}`.
3. Restore it on the new host.
4. Apply Ansible.
5. Point DNS to the new IP.
6. Validate the room, audio, video, and screen share.

## Rollback

Rollback should be a tag swap, not a manual rebuild.

Example:

```bash
WEB_IMAGE_TAG=<previous-sha> docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate web
```

For rollback via Ansible, pass the previous SHA as a variable:

```bash
ansible-playbook \
  -i infra/ansible/inventory.ini \
  infra/ansible/playbook.yml \
  --extra-vars "web_image_tag=<previous-sha>"
```

## Migration Checklist

- Terraform created the VM, firewall, and DNS.
- Ansible installed Docker/Podman and Compose.
- `${CONFIG}` was restored on the new host.
- `.env` was rendered with the correct secrets.
- The custom `web` image was published to the registry.
- `docker compose ps` shows `web`, `prosody`, `jicofo`, and `jvb` as `Up`.
- Port `10000/udp` is open.
- The room opens over HTTPS and asks for the passphrase.
- Two participants can join.
- Screen share works on desktop and mobile.
- Fullscreen works.
- The filmstrip doesn't appear.
