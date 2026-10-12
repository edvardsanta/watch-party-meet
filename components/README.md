# Watch Party source monorepo

The frontend remains at the repository root. Supporting projects are imported
here as ordinary files, not submodules or nested Git repositories. Their source,
tests, build metadata, copyright headers and licenses are preserved from
`git archive` at the commits in [sources.lock.json](sources.lock.json).

| Component | Imported revision | Purpose |
| --- | --- | --- |
| [jicofo](jicofo/) | `stable/jitsi-meet_10978` / `593462ca9456d29fdf2803225feb6f6415ddae86` | Conference coordination |
| [jitsi-videobridge](jitsi-videobridge/) | `stable/jitsi-meet_10978` / `b4b5ccc8c9ec83f224a661300c899a1cbb62ca2d` | Media routing, including its media-transform and RTP modules |
| [lib-jitsi-meet](lib-jitsi-meet/) | `28875bfa987e6ca8dd5f16b441edd21683213df0` | Browser conferencing library, matching the root package.json release |
| [tpl](tpl/) | `v1.5.0` / `f887c7d4bd09425e6f4ab5cea0e39ca826b5b3a2` | Container configuration renderer |

The tag names explain selection; the full commit SHAs identify the imported
versions even if upstream moves a tag. The lock records Git tree IDs and an
independent SHA-256 digest of the extracted files, file modes and symlinks.

Existing owned source locations:

- `../`: customized Jitsi Meet frontend; license in `../LICENSE`.
- `../resources/prosody-plugins/`: Jitsi Meet's Prosody plugins.
- `../docker/jitsi-core/`: previously vendored and customized Docker core;
  license in `../docker/jitsi-core/LICENSE`. This is not an unmodified snapshot
  of the current upstream Docker repository.
- `../infra/ansible/`: deployment configuration and custom templates.

## Check the import

From the repository root, using Python 3:

```sh
python3 scripts/verify-monorepo-sources.py
```

This checks the pristine imported baseline. Edits or generated build files
inside a component produce `CHANGED`; it is not a prohibition on modifying our
fork. Keep the original lock as provenance and review custom changes in Git.
Component builds and tests are separate from the frontend lint/build scope.
Upstream CI definitions inside these folders are preserved as source; GitHub
does not run them as root workflows.

## Licenses

Each newly imported project includes its original Apache-2.0 `LICENSE`:
[Jicofo](jicofo/LICENSE), [Videobridge](jitsi-videobridge/LICENSE),
[lib-jitsi-meet](lib-jitsi-meet/LICENSE), [tpl](tpl/LICENSE).
Per-file notices and any additional tracked license files are preserved too.
The inventory describes these projects; it does not relicense their transitive
dependencies or third-party material.

## What this import does and does not change

We can now edit and version these sources in one repository. The deployment
still uses the existing `stable-10978` images and the frontend still installs
its existing released library package. Importing sources does not silently
replace those artifacts with untested builds.

The Java sources still resolve Maven dependencies, including Jitsi libraries;
the JavaScript and Go builds still have package dependencies. The Prosody server
itself comes from its upstream package, not from these Jitsi source imports.
See [the independence specification](../specs/monorepo-independence.md) for the
remaining work to build, retain and deploy our own artifacts.
