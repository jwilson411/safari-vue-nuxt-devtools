# Vue & Nuxt Devtools for Safari

A macOS Safari Web Inspector adapter of the original Vue Devtools inspector, plus stable Vue and Nuxt acceptance fixtures. Validated in real Safari 27.0.1 on macOS 27.0.1. See the feature matrix for the verified scope and limitations.

The adapter pins Vue Devtools **v8.2.1**, commit `4419695f100f43ed880995dabf0cd68651b365db` (its browser extension internally reports **7.7.7**). It preserves the upstream frontend, Vue component backend and RPC. Safari changes include unconditional panel creation, the `devtools` permission, devtools-page backend evaluation, document-ready reconnection and robust per-tab port routing with fail-closed host permission checks before every message.

Nuxt **4.5.2** + stable **@nuxt/devtools 3.4.2** stays in the original embedded server-backed UI. The extension provides Vue inspection separately; it does not replace Nuxt routes/modules/config/payload RPC.

- [Installation](docs/INSTALL.md)
- [Development preview release notes](docs/RELEASES.md)
- [Acceptance criteria and architecture](docs/ACCEPTANCE.md)
- [Verified feature coverage](docs/COVERAGE.md)
- [Upstream attribution](docs/UPSTREAM.md)

`npm run build` builds the pinned original inspector. `npm run package:macos` generates its macOS Xcode app container. `npm test` exercises panel creation, Safari RPC/bootstrap, navigation and tab transport lifecycle.

The ready extension ZIP needs no build tools for temporary Safari installation. **It expires after 24 hours or when Safari quits.** `npm run package:release` creates a versioned ZIP and SHA-256 checksum with stable packaging for identical built input. The unsigned Mac container is a developer testing package, not a trusted persistent installer. The development preview has passed independent review; see the feature matrix for its verified scope.
