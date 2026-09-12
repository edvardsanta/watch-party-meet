# Step by Step: Local Test Through the Router

This guide describes how to temporarily expose the local Jitsi instance over the internet using a home router.

Use it only for a quick test with someone external. For production, use DNS, valid TLS, a controlled firewall, and automated deploy.

## Expected Result

You access it over the local network:

```text
https://<lan-ip>:8443/<room>
```

The external person accesses it over the internet:

```text
https://<public-ip>:8443/<room>
```

## Step 1 - Find the machine's local IP

On the machine running Docker:

```bash
ip route get 1.1.1.1
```

Look for the value after `src`.

Example output:

```text
1.1.1.1 via `192.168.15.1` dev wlan0 src <lan-ip> uid 1000
```

Note it down:

```text
LAN IP = <lan-ip>
```

This is the IP that goes in the router as `internal IP`, `local IP`, or `destination IP`.

## Step 2 - Find the public IP

Run:

```bash
curl -4 ifconfig.me
```

Note it down:

```text
PUBLIC IP = <public-ip>
```

This is the IP you send to the external person.

If this IP changes, the URL you send also changes.

## Step 3 - Adjust the local `.env`

Open:

```text
docker/jitsi-core/.env
```

Make sure the JVB advertises both paths, LAN and public:

```env
JVB_ADVERTISE_IPS=<lan-ip>,<public-ip>
```

For a more predictable test, keep P2P off:

```env
ENABLE_P2P=0
```

This forces media through the JVB. P2P can be studied separately later.

Don't commit this `.env`.

## Step 4 - Configure the router

In the router's admin panel, create two port-forwarding rules.

Rule 1:

```text
Name: Jitsi HTTPS
Protocol: TCP
External port: 8443
Internal port: 8443
Internal/local IP: <lan-ip>
External/remote/source IP: *
```

Rule 2:

```text
Name: Jitsi JVB
Protocol: UDP
External port: 10000
Internal port: 10000
Internal/local IP: <lan-ip>
External/remote/source IP: *
```

Warning: port `10000` needs to be `UDP`. If created as `TCP`, the page may open but audio/video/screen share may fail.

About `external IP`, `remote IP`, or `source`:

- Use `*` when the router accepts it.
- If the field can be left empty, that usually works too.
- This field represents who can connect from outside. For a temporary test, `*` allows any source.

## Step 5 - Recreate the environment

After changing `.env` and the router:

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml up -d --build --force-recreate
```

If the build is already ready and you only changed `.env`:

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml up -d --force-recreate
```

Check that the services are running:

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml ps
```

Expected services:

```text
web
prosody
jicofo
jvb
```

## Step 6 - Set a temporary room passphrase

The room is locked automatically as soon as it's created, using `WATCHPARTY_ROOM_PASSWORD` (see `docker/jitsi-core/.env`). To change it without restarting everything:

```bash
cd docker/jitsi-core
./scripts/set-room-password.sh --prompt
```

Share the passphrase with the external person, not a full user/password pair.

Don't commit real passphrases.

## Step 7 - Test locally over the LAN

On your computer, open:

```text
https://<lan-ip>:8443/<room>
```

Join as the host.

Don't use the public IP on the computer that's on the same network, because many residential routers don't handle NAT hairpinning correctly.

## Step 8 - Send the external URL

To the external person, send:

```text
https://<public-ip>:8443/<room>
```

Also send the room passphrase separately (not the same message/channel, if you're being cautious).

Ask them to test outside your Wi-Fi, for example using mobile data.

## Step 9 - Validate the flow

On the local computer:

1. Join the room.
2. Start screen sharing.
3. Keep the tab open.

On the phone or external computer:

1. Join the same room.
2. Confirm the shared screen shows up.
3. Confirm audio/chat work.
4. Report back if you see a black screen, a timeout, or a drop.

## Step 10 - Check logs if something fails

General logs:

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml logs --tail=200
```

JVB logs:

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml logs --tail=200 jvb
```

Look for good signs:

```text
ICE connected
Pair validated
Selected pair
```

Look for bad signs:

```text
Endpoint.expire
restartRequested=true
session-terminate
```

## Step 11 - End the test

When done:

```bash
cd docker/jitsi-core
docker compose -f docker-compose.yml -f docker-compose.local-web.yml down
```

Then remove or disable the port-forwarding rules on the router.

## Quick Troubleshooting

### Timing out over the internet

Check:

- `8443/tcp` is forwarded to `<lan-ip>`.
- The machine's firewall allows `8443/tcp`.
- The public IP you sent is correct.
- The local machine still has the same `<lan-ip>`.
- Your ISP isn't using CGNAT.

### Page opens, but the screen/video stays black

Check:

- `10000/udp` is forwarded to `<lan-ip>`.
- The `10000` rule wasn't created as TCP by mistake.
- `.env` has `JVB_ADVERTISE_IPS=<lan-ip>,<public-ip>`.
- The environment was recreated after the `.env` change.
- P2P is off during this test: `ENABLE_P2P=0`.

### Works on the LAN, but not outside

Check:

- The external person is really outside your Wi-Fi.
- The router saved/applied the rules.
- The public IP hasn't changed.
- The OS firewall isn't blocking Docker/JVB.

## Note About P2P

This guide uses `ENABLE_P2P=0` to reduce variables.

The P2P study is kept separately in:

```text
docs/p2p-network-concerns.md
```
