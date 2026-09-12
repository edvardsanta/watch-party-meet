# Floating Participants Panel

## Summary

In Cinema mode, the user needs to be able to see who's in the session and quickly tell whether each person is muted or not, without bringing back Jitsi's full corporate experience.

The planned solution is to reuse the existing participants list, but render it as a compact floating panel. The panel shouldn't take up a fixed column, shouldn't shrink the video area, and shouldn't break fullscreen or screen sharing.

## Goals

- Show the list of connected people.
- Clearly show each person's microphone state: muted, unmuted, or speaking.
- Keep the participants button available on the toolbar.
- Keep the experience focused on watch party, with no explicit host concept.
- Avoid the panel changing the shared video's layout.

## Out of scope

- No host moderation in this step.
- No forcibly unmuting another person.
- No re-enabling the standard fixed side panel.
- No re-enabling corporate actions like lobby, breakout rooms, invite, mute-all, or advanced menus in Cinema mode.

## Expected behavior

When clicking the participants button:

- A small panel opens floating over the video.
- The panel shows the call's participants.
- Each item shows name, avatar, and microphone icon.
- The local user shows up marked as "you".
- The panel can be closed with a close button.
- The shared video keeps the same size.
- Fullscreen keeps working.

For audio:

- The user uses the toolbar's microphone button to mute/unmute themselves.
- The panel only reflects the current microphone state.
- If someone is speaking, the visual state can reuse the existing active-audio indicator.
- For another participant, the panel must not expose an "unmute" action; in WebRTC/Jitsi that has to stay something the user consents to themselves.

## Technical direction

- Re-enable `participants-pane` in `toolbarButtons`, in both `config.js` and `docker/jitsi-core/web/rootfs/defaults/cinema-config.js`.
- Add a dedicated config option, for example:

```js
config.participantsPane = {
    enabled: true,
    cinemaFloating: true,
    hideMoreActionsButton: true,
    hideMuteAllButton: true,
    hideModeratorSettingsTab: true
};
```

- Change the participants pane's width calculation to return `0` when `cinemaFloating` is on, so the layout doesn't subtract width from the video.
- In the web participants-pane component, apply a floating style when `cinemaFloating` is on:
  - `position: fixed`;
  - a compact max width;
  - a max height smaller than the viewport;
  - a subtle border, shadow, and readable background;
  - a z-index above the video, without permanently covering the toolbar/fullscreen controls.
- In `cinemaFloating` mode, hide:
  - search;
  - the invite button;
  - the moderation footer;
  - three-dot menus;
  - quick moderator actions.
- Keep the existing item components, since they already compute and display the audio states.

## Acceptance tests

- With 1 person in the room, open the panel and see only the local user.
- With 2 people in the room, open the panel and see both.
- Mute/unmute the local microphone and confirm the icon changes in the panel.
- Mute/unmute on mobile and confirm the state changes in the panel.
- Open the panel during screen sharing and confirm the video doesn't resize.
- Enter fullscreen and open/close the panel without a new black bar appearing.
- Test mobile portrait and landscape, making sure the panel, toolbar, and fullscreen button don't overlap in a problematic way.

## Notes

- This plan doesn't require a rebuild or restart while it's just being documented.
- The plan stays under `plans/` because it's a future implementation intent, not final operational documentation.
- Once implemented, validate with `npm run tsc:web -- --pretty false` before recreating the web image.
