# P2P and Networking Concerns

This document records the concerns observed while temporarily testing the watch-party Jitsi stack over LAN + internet, especially with screen sharing between a local computer and an external phone.

## Test Context

Tested environment:

- Web/Jitsi in Docker Compose on the local machine.
- Computer accessing over the LAN: `https://<lan-ip>:8443/<room>`.
- Phone accessing over mobile data: `https://<public-ip>:8443/<room>`.
- Port forwarding on the router:
  - `8443/tcp -> <lan-ip>:8443`
  - `10000/udp -> <lan-ip>:10000`
- A room passphrase active for the external test.

## Observed Symptoms

Before the network adjustments:

- The page loaded on the phone, but screen sharing showed up black or didn't show at all.
- The computer published the `videoType="desktop"` source.
- The JVB initially only advertised the public IP.
- The computer, accessing over the LAN, didn't close ICE with the JVB in a stable way.
- Jicofo logged session restarts for the computer's endpoint:
  - `session-terminate`
  - `restartRequested=true`
  - the endpoint expiring and being recreated.

After adding the LAN IP to the advertised candidates:

```env
JVB_ADVERTISE_IPS=<lan-ip>,<public-ip>
```

The JVB started advertising both paths:

```text
<lan-ip>:10000/udp
<public-ip>:10000/udp
```

Logs observed after the adjustment:

- The local computer selected `<lan-ip>:10000/udp`.
- The external phone selected `<public-ip>:10000/udp`.
- Both reached `ICE connected` / `Completed`.

This indicates that configuring candidates for a mixed LAN + internet environment is essential.

## Current Temporary Configuration

To reduce variables during the test, P2P was turned off:

```env
ENABLE_P2P=0
```

A more conservative codec order was also forced:

```env
CODEC_ORDER_JVB=["VP8", "H264", "VP9"]
CODEC_ORDER_JVB_MOBILE=["VP8", "H264", "VP9"]
CODEC_ORDER_P2P=["VP8", "H264", "VP9"]
CODEC_ORDER_P2P_MOBILE=["VP8", "H264", "VP9"]
VIDEOQUALITY_PREFERRED_CODEC=VP8
P2P_PREFERRED_CODEC=VP8
ENABLE_CODEC_AV1=0
ENABLE_CODEC_VP8=1
ENABLE_CODEC_H264=1
```

Important: this doesn't prove P2P doesn't work. It just isolated the test so everything routes through the JVB.

## Main Concern

P2P can probably work, but it needs to be studied carefully in this scenario:

- One participant is on the LAN.
- The other participant is outside the network, via a public IP.
- The Jitsi host is behind a residential NAT.
- The router may not support NAT hairpinning.
- The JVB needs to advertise the right candidates for both LAN and internet.
- P2P uses ICE between the browsers, not just between browser and JVB.

With P2P on, a two-participant call may try a direct path between the browsers. That can be good for latency/cost, but it also increases the number of NAT combinations:

- LAN -> WAN.
- WAN -> LAN.
- Reflexive candidates via STUN.
- Possible lack of TURN.
- Missing or inconsistent NAT hairpinning.

## Hypotheses to Investigate

1. P2P only fails in the mixed LAN + external test.
2. P2P works when both are outside the LAN.
3. P2P works when both are on the LAN.
4. P2P fails due to lack of TURN on some NAT/mobile network types.
5. The black-screen issue might be in the frontend/rendering after the media already arrives.
6. Screen sharing on desktop might trigger renegotiations that expose a bug/inconsistent config.

## Investigation Plan

1. Re-enable P2P in a controlled environment:

   ```env
   ENABLE_P2P=1
   ```

2. Keep both IPs advertised by the JVB:

   ```env
   JVB_ADVERTISE_IPS=<lan-ip>,<public-ip>
   ```

3. Test four scenarios:

   - LAN computer + phone on mobile data.
   - LAN computer + phone on the same Wi-Fi.
   - Two external clients.
   - Two local clients.

4. For each test, collect:

   - The computer's browser console.
   - Remote console for Chrome Android, if possible.
   - `jicofo` logs filtering for `session-terminate`, `restartRequested`, `Accepted initial sources`.
   - `jvb` logs filtering for `ICE connected`, `Pair validated`, `Selected pair`, `Endpoint.expire`.

5. Check whether the call is running over P2P or the JVB on the client.

6. If P2P fails on real external networks, evaluate TURN before giving up on P2P.

## TURN

For a professional deployment, studying TURN will probably be necessary. Without TURN, P2P and even some JVB-based WebRTC paths can fail on more restrictive networks.

Options to evaluate:

- Self-hosted Coturn.
- Cloud-managed TURN.
- STUN/TURN exposed via `turns:443` for restrictive networks.

Open questions:

- Does the final deployment need to support users behind corporate networks?
- Is the traffic cost via TURN acceptable?
- Is it worth keeping P2P enabled with a fallback to JVB/TURN?

## Temporary Recommendation

For the current public test, keep:

- `ENABLE_P2P=0`
- `JVB_ADVERTISE_IPS=<lan-ip>,<public-ip>`
- `10000/udp` open on the router.

For production, don't yet assume P2P should stay off. That decision should come after the tests above and, ideally, with TURN configured.
