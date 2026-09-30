# Release notes

## 0.1.0 — development preview

First macOS Safari adapter of pinned Vue Devtools v8.2.1. Nuxt retains its original embedded stable @nuxt/devtools 3.4.2 UI.

Verified on Safari 27.0.1/macOS 27.0.1: component tree/state/highlight, Pinia/router, multiple apps/tabs, navigation/reload/HMR, restrictive CSP, Nuxt embedded server-backed views, host revocation/regrant and adversarial frame/control-message rejection. See [coverage](COVERAGE.md).

The unsigned temporary ZIP expires after 24 hours or Safari quit. Signed/notarized persistent installation, Vue 2 and iOS are not provided. Older Safari versions and individual timeline/profiling/state-editing/custom-plugin/open-in-editor features are unverified.

Independent-review fixes validate WindowProxy/origin/protocol on both RPC directions, project detector messages to known flags, permission-check lifecycle handlers and limit permission-removal teardown to affected hosts. License collection includes hyphenated MIT files.

This sanitized development preview passed independent review; original private history is retained separately. Local build/test and native Safari evidence are recorded; hosted CI has not run.
