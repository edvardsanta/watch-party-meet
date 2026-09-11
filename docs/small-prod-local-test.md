# Local Test Simulating a 1 vCPU / 1 GB Droplet

The 512 MB profile boots, but fails when a second participant joins because Jicofo/JVB get pinned to the memory ceiling and Colibri allocation stalls until it times out.

This profile simulates a still-small droplet, but with realistic headroom for two people:

```text
1 vCPU
1 GB RAM
```

## Recommended `.env` variables

In `docker/jitsi-core/.env`:

```env
JICOFO_MAX_MEMORY=192m
VIDEOBRIDGE_MAX_MEMORY=384m
ENABLE_P2P=0
```

## Bring it up

```bash
cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  -f docker-compose.small-prod.yml \
  up -d --build --force-recreate
```

## Test

1. Open `https://localhost:8443/<room>`.
2. Join with the computer.
3. Join with a phone or another browser.
4. Start screen sharing.
5. Watch:

```bash
docker stats
```

6. Check whether the logs stop showing:

```text
Failed to allocate a colibri2 endpoint
Failed to allocate colibri channels
There are no operational bridges
```

## Applied limits

```text
web:     0.20 CPU, 128 MB RAM
prosody: 0.15 CPU, 128 MB RAM
jicofo:  0.25 CPU, 256 MB RAM
jvb:     0.40 CPU, 512 MB RAM
```

Approximate total:

```text
CPU: 1.00
RAM: 1 GB
```

## Shut down

```bash
cd docker/jitsi-core
docker compose \
  -f docker-compose.yml \
  -f docker-compose.local-web.yml \
  -f docker-compose.small-prod.yml \
  down
```
