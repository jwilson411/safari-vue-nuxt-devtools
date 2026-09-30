# Acceptance gates

1. Reproducible pinned upstream Vue Devtools build, preserving original component/state inspector, MIT attribution, Safari devtools permission and unconditional panel creation.
2. macOS Safari Web Inspector extension package and Xcode container build; no Apple membership or paid services required for local unsigned development.
3. Real Safari panel UI: app discovery, component tree, component state updates and selection/highlight; reload, SPA navigation, HMR, multiple Vue apps and separate tabs.
4. Vue fixture with Pinia/router and Nuxt stable fixture using original Nuxt DevTools server-backed embedded UI. Nuxt modules/routes/config/payload must use Nuxt RPC, not fabricated extension data.
5. Permission denial/regrant and restrictive CSP checked; transport/lifecycle tests; feature coverage distinguishes real Safari verification from upstream inheritance.
6. Private GitHub source commit/push plus runnable install instructions and honest limitations.

Architecture: minimal build-time adapter over Vue upstream v8.2.1 (4419695f100f43ed880995dabf0cd68651b365db), extension manifest version 7.7.7 upstream. Preserve upstream MAIN document_start hook, isolated proxy, background tab routing, RPC and frontend. Safari panel tabId=-1 is resolved via a short-lived document nonce; inspectedWindow APIs stay in devtools_page. New documents reload the panel; a visible-panel health timeout handles denied-permission callbacks. Nuxt 4.5.2 uses stable @nuxt/devtools 3.4.2 explicitly pinned (npm latest points to a beta). Safari minimum 18.4 is a compatibility target, not a verified matrix; this Mac runs Safari 27.0.1. Vue 2, iOS, Chrome network HAR APIs and Elements sidebars are outside supported scope. Final acceptance requires real Safari checks, not just build success.
