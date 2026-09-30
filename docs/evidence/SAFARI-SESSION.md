# Safari validation session — 2026-09-30

Native CUA observations on Safari 27.0.1 / macOS 27.0.1, with explicit user permission for temporary unsigned extension and loopback fixtures. User handled native authentication. Safari site's native permission is scoped to hostname 127.0.0.1, granted for one day. No access to every website granted.

Verified so far:
- Extension appears enabled in Safari Settings > Extensions as Vue & Nuxt Devtools for Safari 0.1.0.
- Web Inspector includes the Vue tab.
- Inspected document has two apps in __VUE_DEVTOOLS_GLOBAL_HOOK__.apps.
- Upstream inspector shows App 1 (3.5.22) and IndependentApp (3.5.22).
- Component tree shows App > CounterCard, RouterLink, RouterView > HomePage.
- Selected CounterCard state shows label "Primary counter", local 0, doubled 0; clicking fixture updates local 1 and doubled 2 in inspector.
- Selection displays green CounterCard overlay in the actual page, with element dimensions.
- Pinia inspector expands counter store and shows count 1 after fixture mutation.
- SPA navigation to /other updates component tree to OtherPage and Routing $route to /other.
- Switching to IndependentApp displays its component tree.
- Nuxt embedded original DevTools v3.4.2 Overview reports Nuxt4.5.2/Vue3.5.43, two pages, 13 components and203 imports. Pages view lists / and /other via server-backed tooling.

Concrete compatibility issues fixed during validation:
- Safari panel context reports inspectedWindow.tabId=-1; sourcing that ID for scripting.executeScript fails "Tab not found".
- Calling inspectedWindow.eval directly from panel context generates WebKit invalid IPC guard reports and dismisses Web Inspector. Calls now reside in devtools_page.
- Safari rejects upstream client's null initial onMessage listener. Guard prevents silently setting disconnected=true.
- Full page reload recovery now uses new-document content-ready events and fresh panel reload, instead of reconnecting the old RPC client too early. Navigation status and visible-panel port-health timeout handle ordinary disconnects. Hot permission revocation remains a Safari limitation, below.

Additional native UI verification:
- Full reload restores component tree and post-reload local/computed updates; repeated on Nuxt.
- HMR template edit preserves local 1/computed 2. Fixture store moved out of main.js to remove circular import/full reload.
- IndependentApp script setup ref updates 10→11→12 in inspector.
- Strict CSP /csp production fixture discovers two apps and CounterCard state local 2/computed 4. Response header: default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'. No unsafe-inline/eval or extension source whitelist.
- Two inspected tabs retain different state and selection, with distinct bridge IDs: /other local 1/independent 12 vs /csp local 2/computed 4.
- Nuxt Modules shows safari-acceptance-fixture. Public Runtime Config shows acceptance: Safari local fixture. Private config authorization canceled without tokens or command/file permission.
- Nuxt Payload counter changes to 1; API data expands to message: Nuxt server RPC fixture, ok: true.
- Extension Vue panel on Nuxt discovers Vue 3.5.43, nested NuxtPage/RouterView/RouteProvider/Pages; Pages setup count changes to 1 and selection highlights actual page.
- Native Safari Websites settings: 127.0.0.1 Allow; all other websites Ask. Changed only localhost to Deny, reload/reopen yields connection failure. Toolbar native Allow for One Day restored the approved hostname; reload/reopen connects again. Site permission is hostname-wide (includes both fixture ports).

Build/test checks: final upstream build passes seven tasks; 13 unit/transport/lifecycle tests pass; both fixtures build; final converter project xcodebuild CODE_SIGNING_ALLOWED=NO succeeds. No credentials, certificates or distribution submitted. Exact limitations and individually unverified features are in COVERAGE.md.

Security regression and fix:
- Pre-fix: native localhost Deny while same inspector/page remained open; seven clicks changed Nuxt count 0→7 and inspector received new setup count 7. This was treated as a release blocker, not a stale-snapshot claim.
- Safari background console verified supported chrome.permissions.contains({origins:['http://127.0.0.1/*']}) returns false under Deny and true after one-day Allow. permissions.getAll returned no host grants while denied.
- Final transport uses sender's genuine main-frame http/https origin, standard hostname match pattern, and a permissions.contains call before each message. No authorization cache. Checks are serialized to preserve RPC order; denial/removal tears down both endpoints and drops pending/in-flight replies. Absent API/errors fail closed.
- Final native test: allowed inspector setup count 1; native Settings verified 127.0.0.1 Deny without navigation. Seven clicks changed page to 8, then another to 9. Inspector did not display a post-revocation count; it replaced the tree with Page connection unavailable. Existing ports are closed by the adapter rather than trusting Safari to invalidate them.
- Native Allow for One Day, reload/reopen restores Vue 3.5.43 Nuxt tree. Then native address navigation to Vue /csp restores Vue 3.5.22 apps and live CounterCard state under strict script-src self with guarded transport.
- Safari grants by hostname (all loopback ports), other websites Ask. No broader access granted.

Final checks: 13 automated tests pass, pinned upstream build passes seven tasks, Vue/Nuxt builds and final unsigned native build pass. This is a verified permission-revocation regression fix, not exhaustive security certification. No credentials/certificates created or distribution submitted.
# Independent-review security regressions, 2026-09-30

The loaded temporary extension uses the durable `dist/extension` directory. Its proxy, backend, background and overlay hashes were verified against the rebuilt workspace before these tests. An initial attempt accidentally reloaded the older durable build; its iframe attack reproduced 20 backend JSON parse errors and a panel parse error. Those results were not counted as fixed-build success.

With the updated durable build loaded and a fresh document/inspector:

- Two cross-origin frames at approved loopback port 3000 each reported 60 adversarial messages to the Vue top page at port 5173. They sent both upstream RPC directions and crafted detector lifecycle actions. No new Console errors appeared. Forty additional top-document detector messages carried `action: safari:content-ready` and did not restart the panel.
- The original Vue inspector retained both app trees. A page mutation showed local 1 / doubled 2 in the selected CounterCard, with the selection overlay visible.
- Native Safari changed only 127.0.0.1 to Deny without reloading the page. The inspector showed connection unavailable; four new page mutations changed local 1 to 5 without exposing the new state. Fifty further top-page detector lifecycle attacks left the panel unavailable with the same bridge URL.
- One-day local access was restored through Safari's permission popover, followed by reload and inspector reopening.

Automated adversarial checks exercise the actual adapted proxy/server listeners, foreign and same-origin frame WindowProxy rejection, origin/protocol validation, malformed protocol handling, detector projection, denied lifecycle handling and host-scoped permission teardown. The collector also verifies hyphenated MIT/NOTICE files.

Final hardened native navigation also passed restrictive CSP (selected CounterCard local 1 / computed 2) and Nuxt Vue 3.5.43 discovery with page count 0 to 1. The pending permission-callback race is covered by a deterministic automated regression, not a naturally timed Safari reproduction.
