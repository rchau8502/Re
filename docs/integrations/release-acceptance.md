# Local release acceptance — 2026-10-28

This milestone closes local acceptance for the existing single-device writing product. It preserves the current Next.js application, browser storage, chapter notebook, world resolver and Gemini adapters. It does not declare production deployment or all AI output qualified.

## Changes

- Added `npm test` for the 13 offline regression groups and `npm run verify` for regression, TypeScript and production compilation. Checks stop on failure, use bounded execution and clear provider credentials in child processes. Full verification requires Node.js 22.13+ for the existing SQLite checks.
- Fixed unreadable workspace recovery: an invalid index, including an empty stored string, cannot be replaced by new projects or imports until an exact recovery copy has been written and read back. Previous recovery copies remain intact. Refused writes preserve the original index and creation input. An explicit original-record download remains available while saving is paused.
- Added repeatable isolated browser acceptance with `npm run test:ui`. Playwright/Chromium are supplied by the execution environment; no application dependency was added.
- Corrected README's outdated statement that the Omni migration had never been live-qualified, using the existing October 26 acceptance record. This is historical evidence, not a new live request.

## Executed verification

`npm run verify` passed all 15 steps: 13 offline regression groups, TypeScript and a production build. The tests cover writing queues, passage replacement, world authority and persistence, chapters/history/continuity, foreshadowing, combined backup recovery, unreadable storage recovery, source style, video safety/continuation and compiled prompts. The SQLite experimental warning is informational. No independent ESLint configuration exists, so this is not an ESLint-clean claim.

Source files were materialized into `/private/tmp/restory-release-oct28` because Documents reads stalled. The tested source manifest records SHA-256 hashes; the build uses existing locked dependencies from the earlier local runtime. No `.env.local` was copied. The production server used an empty provider key and owner code.

Browser acceptance on `http://127.0.0.1:3038` passed:

- Exact Chinese/English/emoji manuscript creation, chapter addition, edit and reload.
- Independent branch prose, actual JSON download, import through the file input, and reload of the restored branch.
- 390px manuscript layout without document horizontal overflow.
- Byte-for-byte preservation of a damaged original index before creating a new project, with new writing surviving reload.
- Injected recovery-write refusal: creation and backup import leave the original record unchanged; composer input survives; original-record download matches the damaged input exactly.
- No browser page errors and no generation POSTs.

Evidence: `output/release-2026-10-28/verification.log`, `browser-verification.json`, `source-manifest.json`, `writing-desktop.png`, `writing-mobile.png`, and `storage-protected.png`. All browser data and downloaded archives in this run are synthetic test fixtures. This covers Chromium; Safari, physical-device IME, forced process termination and cross-tab concurrency are not qualified by this run.

## Remaining acceptance boundaries

The local manual writing/backup milestone is verified. Production remains open for these specific items:

1. A newly authorized, budgeted live blueprint → generated chapter → review test. The October 26 chapter request failed with HTTP 503; the three-request authorization was exhausted. Offline repairs and this release's checks do not convert that result into success.
2. A separately authorized paid continuation test if provider video continuation is part of launch acceptance. Its offline behavior and saved controls are covered; real continuation quality and billing remain unverified.
3. Explicit authorization to deploy, followed by verification against the deployed source and actual product UI. This run did not push or deploy.

CanonKeep desktop media/maps, full library migration, selectable SQLite web persistence, collaborative multi-device storage and additional providers remain outside this local product milestone. Existing source packages and schemas were not replaced. Browser-local data still needs exported backups.
