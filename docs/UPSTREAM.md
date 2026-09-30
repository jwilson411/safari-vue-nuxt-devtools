# Upstream pins and attribution

Vue Devtools: https://github.com/vuejs/devtools/tree/v8.2.1 ; annotated tag resolves to commit `4419695f100f43ed880995dabf0cd68651b365db`. MIT by Vue contributors, preserved in VUE-LICENSE and the built extension LICENSE. UI/backend changes are applied at build time by scripts/build.mjs; original source remains available via the pinned repository.

Nuxt DevTools: https://github.com/nuxt/devtools/tree/v3.4.2 ; tag object `a4a2254b9110a33140737166a6a6160ba3c82ab3`, commit `a9f5ab663a15fb7d74285feef54034703d42e8e6`. MIT by Nuxt Labs and contributors, preserved in NUXT-LICENSE. No Nuxt source is forked. Dependencies are installed from exact fixture versions and lockfiles.

Apple official API and installation references:

- https://developer.apple.com/documentation/safariservices/adding-a-web-development-tool-to-safari-web-inspector
- https://developer.apple.com/documentation/safariservices/running-your-safari-web-extension
- https://developer.apple.com/documentation/safariservices/distributing-your-safari-web-extension

Safari's converter emits compatibility warnings for world, devtools, extension_ids and type. Official documentation explicitly requires devtools; warnings alone are not a reliable compatibility test. Real installed-browser checks are recorded in COVERAGE.md.
