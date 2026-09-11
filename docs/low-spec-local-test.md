# Local Test Simulating a 1 vCPU / 512 MB Droplet

This test uses a Docker Compose override to cap containers' CPU and memory and approximate a small droplet:

```text
1 vCPU
512 MB RAM
10 GB SSD
500 GB transfer
```

## Bring the environment up

Before starting it, set in `docker/jitsi-core/.env`:

```env
JICOFO_MAX_MEMORY=128m
VIDEOBRIDGE_MAX_MEMORY=128m
```

These two variables reduce the Java components' heap. They live in the local `.env`, not in the override, to avoid conflicting with `podman-compose`.

```bash
cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  -f docker-compose.low-spec.yml \
  up -d --build --force-recreate
```

## Check status

```bash
cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  -f docker-compose.low-spec.yml \
  ps
```

## Watch resource usage

```bash
docker stats
```

## View logs

```bash
cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  -f docker-compose.low-spec.yml \
  logs --tail=200
```

## Minimal functional test

1. Open `https://localhost:8443/<room>`.
2. Join with the host.
3. Open another browser/device.
4. Join the same room.
5. Start screen sharing.
6. Watch whether `jicofo` or `jvb` restart.
7. Watch `docker stats` during the share.

## Applied limits

```text
web:     0.20 CPU,  96 MB RAM
prosody: 0.15 CPU,  96 MB RAM
jicofo:  0.25 CPU, 160 MB RAM, Java heap 128 MB
jvb:     0.40 CPU, 160 MB RAM, Java heap 128 MB
```

Approximate total:

```text
CPU: 1.00
RAM: 512 MB
```

## Notes

- This profile is aggressive. Jitsi is normally much more comfortable with more RAM.
- If `jicofo` or `jvb` die from OOM, this droplet plan doesn't even work for an MVP.
- The 10 GB SSD limit isn't faithfully simulated by plain Compose. The override reduces logs to avoid local disk growth.
- The 500 GB monthly transfer can't be simulated locally; it needs to be estimated from bitrate and hours of use.

## Shut down

```bash
cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  -f docker-compose.low-spec.yml \
  down
```
