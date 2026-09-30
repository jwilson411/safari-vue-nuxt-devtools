# Repeat acceptance checks

Run `npm test`, `npm run build`, and fixture builds. Install/reload the temporary extension as described in INSTALL.md. Use only your approved local sites.

1. On Vue fixture, open Web Inspector > Vue. Select CounterCard, mutate Local and Pinia; verify refs/computed/store, selection highlight and router /other tree.
2. Select second app and mutate its button; verify its ref independently.
3. Reload with panel open, then mutate Local again. Navigate via address bar as well as SPA links.
4. With local 1, change only CounterCard template's `Doubled:` label. Verify HMR text updates while local/computed state remains 1/2; restore source.
5. Build Vue fixture before opening /csp. That route serves built files with `default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'`. Confirm header and inspect/mutate state. Production devtools is intentionally enabled in this acceptance fixture, not recommended for a deployed application.
6. Keep /other and /csp inspectors open in two tabs. Mutate each to different values and alternate tabs; verify independent trees/state.
7. Safari Settings > Websites > this extension: deny only 127.0.0.1 while keeping the page/inspector open. Mutate the fixture to a distinctive new counter value: no new state may reach the inspector; connection-unavailable status should appear. Then reload/reopen and observe connection failure. Toolbar permission prompt > Allow for One Day, then reload/reopen; verify recovery. Keep other websites Ask.
8. On Nuxt, embedded DevTools: Overview version, Pages, Modules, Public Runtime Config and Payload (counter and API response). Cancel private config authorization; it is outside current credential scope. Close embedded UI and inspect Vue Pages setup state/highlight. Reload and verify recovery.

Native build: `npm run package:macos`, then:

```sh
xcodebuild -project 'dist/macos/Vue Nuxt Devtools/Vue Nuxt Devtools.xcodeproj' -scheme 'Vue Nuxt Devtools' -configuration Debug -derivedDataPath dist/DerivedData CODE_SIGNING_ALLOWED=NO build
```

The optional GitHub Actions workflow is manual-only, with separate adapter/fixture and macOS-container jobs. No hosted run was started or billed by this task.
