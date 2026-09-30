# Feature coverage

Verified by native Safari UI on 2026-09-30: **Safari 27.0.1, macOS 27.0.1, Xcode 27.0**. This is a working development adapter, not a full upstream feature-parity claim. Older Safari versions are unverified; 18.4+ is only an API compatibility target.

| Feature | Verified evidence |
|---|---|
| Original Vue frontend/backend | Pinned v8.2.1 build, seven upstream build tasks pass |
| Safari Web Inspector Vue panel | Temporary extension enabled; unconditional panel visible |
| Vue 3 app discovery/component tree | Two Vue 3.5.22 apps; App/CounterCard/router pages and IndependentApp |
| Component state/highlight | Ref local 1, computed doubled 2; green selection overlay in actual page |
| Pinia | Counter store state count 1 after fixture mutation |
| Router | SPA /other updates OtherPage and $route |
| Multiple apps | IndependentApp ref moves 10→11→12 independently |
| HMR | Template edit updates text while retaining local 1/computed 2; inspector stays connected |
| Full reload | New document reconnects with fresh component tree; post-reload state mutation works; also verified on Nuxt |
| Separate inspected tabs | /other retains local 1/independent 12 while /csp reaches local 2/computed 4, distinct panel bridge IDs |
| Restrictive CSP | Production fixture /csp with script-src 'self', no unsafe-inline/eval or extension source; original panel/component state works |
| Permission revocation and regrant | Per-message supported permissions.contains checks block new state after native Deny: page count 1→8→9, inspector shows connection unavailable; native one-day regrant/reload/reopen restores tree |
| Nuxt Vue panel | Vue 3.5.43 discovered; nested Pages setup count updates 0→1 with selection overlay |
| Nuxt embedded DevTools | Original 3.4.2 UI Overview, routes / and /other, custom fixture module, public runtime config, state and API response payload |
| Tab transport/lifecycle/security | 20 automated tests: transport and permission regressions plus actual proxy/server iframe rejection, detector projection, denied lifecycle controls, host-scoped teardown and license filename coverage and pending lifecycle reply invalidation |
| Adversarial native Safari messages | 120 cross-origin RPC/control messages +40 top-page detector control attempts cause no Console errors or panel reload; another 50 attempts after Deny leave the panel unavailable |
| macOS native container | Converter generated project; final unsigned xcodebuild succeeds |

Supported/tested application versions: Vue 3.5.22 and Nuxt 4.5.2/Vue 3.5.43 with stable @nuxt/devtools 3.4.2, Vite 8.3.1. Other stable Nuxt releases and Vue versions have not been tested. Nuxt DevTools 4 beta and Vue Devtools 9 beta are not used.

## Limits

- Private Nuxt runtime configuration and command/file operations request Nuxt browser authorization. We canceled that prompt and created no credentials. Public runtime config and payload views work. Nuxt's stable config-retriever emits Vite 8 configResolved-hook warnings; full source-config editing/retrieval is not verified.
- Timeline, performance profiling, state editing, custom inspector plugins, open-in-editor and every upstream settings option are inherited but not individually verified. Component selection/highlight is verified; pointer-based picker behavior is not separately certified.
- Safari network getHAR/onRequestFinished and Elements sidebar APIs are unavailable; no Chrome network or Elements sidebar parity is claimed.
- Main frame Vue apps only. Subframe proxy ports are intentionally rejected. Vue 2, iOS, signed/notarized distribution and App Store submission are outside this implementation.
- Safari itself preserves old ports after hot revocation. The adapter therefore checks host access before every forwarded message, closes both endpoints on denial/removal, and cancels in-flight forwarding. This specific regression is verified on Safari 27.0.1; it is not a claim of exhaustive security certification. Close the inspector and reload when changing permissions or regranting access.
- A full document navigation reloads the panel and resets its selection. When site access changes, reload the page and reopen Web Inspector; granting access after app mount requires the document_start hook to run again.
- Safari grants sites by hostname; the approved local permission covers 127.0.0.1 ports rather than a port-specific grant. Other websites remain Ask.
- Temporary extension expires after 24 hours or Safari quit. Generated Xcode container uses the installed SDK's deployment target (macOS 27); older native targets are not verified.
- Hosted CI is manual-only and has not been dispatched; local checks are the verified results. This avoids starting hosted compute under the no-paid-services requirement.

See [session evidence](evidence/SAFARI-SESSION.md), build/test logs and [manual repeat steps](TESTING.md).
