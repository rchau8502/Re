# Merge progress

Updated: 2026-10-09. Integration checkout: Re_Story. CanonKeep desktop/web sources remain intact.

## Completed

- Inspected both READMEs and the implementation of models, routes, storage, retrieval, providers, desktop IPC, guest projection, images, backups and history.
- Created MERGE_ANALYSIS.md with foundation choice, feature inventory, module mapping/disposition, architecture, conflicts, risks and additive migration order.
- Added portable contracts covering world, branch, canon, timeline, provenance, proposals and writing/media entities.
- Added a single branch resolver: nested ancestry, subject/predicate overrides, temporal validity, divergence cutoffs, tombstones and branch comparison.
- Added proposal/review services: proposals are separate from facts; rejection is recorded; baseline canon requires explicit approval; review cannot apply a proposal from another branch.
- Added temporal dead/participation warnings and intentional fact-change warnings. These are deterministic checks, not comprehensive semantic analysis.
- Integrated World memory into the existing Universe editor: entities, proposals, explicit canon/branch approval, branch creation/selection, event ordering, comparison and sources.
- Added optional WorldContext to writing workspaces. Header Branch creates an alternate world state and an independent writing workspace when memory is connected. Legacy workspace-only branches remain supported.
- Director/timeline/writing receive bounded resolved public/shared context. Server rejects invalid or cross-project context records. Prompts prioritize approved assertions over reference text; generated output cannot approve facts.
- Added versioned world archives, browser adapter and combined workspace/world backup. Restore adds fresh projects/workspaces without replacing originals. Legacy workspace-only JSON remains importable.
- Added SQLiteProjectRepository using Node SQLite and a separate database namespace. Real reopen tests pass. Adapter refuses existing CanonKeep/other databases; it does not migrate live data. Browser UI still uses the browser adapter.
- Added explicit CanonKeep world-package v1/v2 importer. Entries become private entities and sourced pending description assertions; GM notes stay GM-only sources. Original package bytes preserve media/links/notes for lossless legacy export. Opaque imported images are not rendered or treated as validated pixels in this app. Full library backups/playthrough migration are not supported yet.
- Added a portable AIProvider generation contract and moved Google SDK calls into GeminiProvider. Existing engine validation/retry/cache behavior is retained. OpenAI adapter/provider selection is not yet implemented.
- Added Timeline service for validated event creation instead of UI-owned timeline mutations.
- Retained existing Re:Story research, cancellation, retry, autosave and writing controls; imported no demo/fabricated CanonKeep AI paths.

- Added `/api/proposals` and a Director application service: schema-bounded fact extraction with entity ID, quoted evidence, confidence and temporal validation. Model output is staged as pending; no endpoint approves canon.
- Added a shared review queue to Universe, Director and Draft, including individual/selected acceptance/rejection, editing before approval, provenance retention and retry deduplication.
- Fixed header branch creation to respect inherited timeline events and parent divergence.
- Restored archives now remap internal entity/branch/source/event/fact/proposal IDs and workspace context references. Backups referencing missing world memory fail visibly instead of silently detaching it.

- Added branch-owned structured drafts and Director conversations to project archives. Existing connected writing migrates when edited or attached; branch switching opens a separate workspace and header branching copies the draft into an independent branch with an empty conversation.
- Added draft revision checkpoints, coalesced to about 30 seconds with the latest 50 retained, explicit checkpoints and scoped restore that preserves the current draft. Combined backups remap draft, revision, conversation and workspace identities.
- Retained the browser workspace mirror for migration and recovery; failed world writes mark it pending so reopening does not replace newer text with an older world draft.

## Verification

- `npm run typecheck`: passed after first integration and SQLite/import stages; final post-refactor and fact-proposal-stage checks also passed.
- `npm run test:world`: passes assertions for nested inheritance, overrides, temporal boundaries, proposal approval/rejection, tombstones, comparison, continuity, project isolation, cycles, archive validation, browser repository reopen, privacy/budget retrieval, real SQLite reopen, invalid-save preservation, existing-database refusal, CanonKeep import provenance/media/private notes, extraction validation/quarantine, atomic staging/review, evidence checks, editing provenance and restored-ID remapping.
- `node scripts/check-backend.cjs`: passed malformed-input, unsafe-URL and missing-key checks. No external AI requests were sent.
- `npm run build`: first integration production build passed. Final post-refactor and fact-proposal-stage production builds also passed.
- CanonKeep `npm run desktop:test`: all 25 existing tests passed (SQLite reopen, snapshots, guest privacy, images, backup/restore and undo/redo).
- Browser UI: created a fresh verification workspace, attached memory, added Aria, submitted alive as a pending fact, explicitly approved baseline canon, created a writing/world branch, observed inherited alive state, proposed captured and observed a continuity warning, clicked branch approval. Reload verification could not finish because the browser stopped reaching the localhost server; do not count browser reload persistence as passed. No real provider output, file-picker import or guest-window UI was verified. A later production preview on port 3012 successfully verified proposal editing, selected baseline approval and canon persistence after browser reload; this supersedes the earlier reload limitation.

## In progress

- First four integration stages are complete at the scope described above. Desktop composition, cloud persistence and remaining product capabilities are pending.

## Next

1. Wire SQLite adapter to a desktop application composition root and migrate only exported, backed-up fixtures before real libraries. Preserve original campaign snapshot/reveal semantics.
2. Add provider selection/OpenAI adapter and schema-validated AI event proposals into review queues (fact extraction is now implemented).
3. Add authoritative cloud repositories with transactional approvals and project-scoped RLS/FKs.
4. Add chapter/scene authoring and check-against-canon; selected-passage revisions are now implemented; branch-owned drafts, conversations and revisions are now persisted.
5. Add relationship/rule editing, graph projection, richer entity details/timeline visualization and unified search.
6. Integrate central history/recovery and guest visibility/media services; preserve existing desktop behavior until replacements pass its tests.

## Known issues

- This is an incremental merge foundation, not the full production product.
- Browser world writes and workspace autosave use separate keys; multi-key imports and binding are not atomic. Export failures stop visibly rather than producing incomplete backups. Large media archives can exceed browser quota even though the portable archive limit is 16 MiB.
- SQLite is tested as a repository adapter; the UI has no SQLite/cloud mode switch yet. Aggregate JSON storage is a transitional implementation, not normalized high-volume retrieval.
- Private imported entities/facts/sources are excluded from AI even after approval. A permission-aware explicit promotion/author context flow is still needed.
- Imported links and media are preserved in original-package material; typed relationship/media UI is not yet populated. Full library backup/playthrough import is deferred.
- CanonKeep prototype/demo code still exists in its original web checkout. It is not imported or reachable from the unified workspace.
- Gemini is the only connected AI adapter; no live AI result was verified. Existing research/Bible results still require explicit conversion/review to become structured facts. Connected structured worlds no longer require a legacy Bible for Director/writing.
- Temporal validity uses numeric event ordering. Parent changes before divergence remain live; collaborative version-pinned branches are deferred.
- Entity identity/description is project-scoped; branch-specific character states belong in facts. Single-valued predicates are insufficient for multi-edge relationship graphs.
- Event timeline supports additions and inherited prefixes; stable event replacement/removal and explicit retcon UI remain to be added.
- No independent ESLint configuration/script exists in Re:Story; Next build checks types but does not establish an ESLint clean result.

## Architecture decisions

Re:Story is the first web integration shell; CanonKeep is the preserved desktop implementation and source for canon/privacy/backup concepts. One authoritative world model and resolver; no microservices or cosmetic monorepo move. Domain contains no React/Next/Electron/database/provider SDK imports. UI uses public service contracts; SQLite and Gemini are infrastructure adapters. No keys, deployments, Git uploads or live database changes were performed.

## Migration notes

Existing `restory-workspaces-v2` data is readable. Structured memory is created/imported only by user action, under separate `story-world-v1:<projectId>` records. Combined backups include referenced worlds. Restore creates new universe identities. CanonKeep SQLite schema v4 and Supabase tables were not modified. New SQLite stores are separate files and reject unrelated schemas. Keep original packages/library backups for rollback; media/private notes are preserved in the raw import archive, not silently discarded.

## Stage 3 validation evidence

`npm run typecheck`, `npm run test:world`, `node scripts/check-backend.cjs`, `npm run build` and `git diff --check` passed. The production bundle includes `/api/proposals`. Tests exercise invalid extraction, foreign entity IDs, fabricated evidence, timeline bounds, duplicate assertions, unchanged canon before approval, retry deduplication, atomic bulk review, edited provenance and complete backup identity remapping. Browser verification used only a new local test workspace and manually entered facts; it did not simulate a model response. Actual model generation remains unverified. The review screenshot is saved under the chat visualization folder as `proposal-review.png`.

## Stage 4 writing persistence

Portable writing services own drafts, conversations, checkpoints and revision restore. Draft payloads preserve all existing narrative fields, including storyboard notes. World archives add optional writing collections without changing version 1 compatibility; invalid branch scope, duplicate ownership and dangling revision references are rejected. Restoration remaps writing and workspace IDs together. Domain tests cover independent child drafts, cross-branch restore rejection, current-text preservation, 50-version retention, archive roundtrip, repository reopen and failed-write preservation. Chapter/scene collections remain contracts only. Browser mirrors and world aggregates use separate records, so this remains a single-device transitional storage implementation.

Stage 4 verification: `npm run typecheck`, `npm run test:world`, `node scripts/check-backend.cjs`, `npm run build` and `git diff --check` passed. Production browser preview on port 3013 verified manual checkpoint, revision restore preserving current text, child draft isolation, child persistence after reload, and selecting Canon through World memory opening the parent draft with three retained revisions. Screenshot: `writing-revisions.png` in this chat’s visualization folder. Recovery-text preservation during revision restore also has a domain regression assertion. No live AI, file-picker restoration or forced browser quota failure was tested in this stage.

## Writing experience improvements (2026-10-09)

User priority is writing before desktop integration. Added a manuscript-first DraftEditor with a constrained serif reading column, three text sizes, focus mode with Escape exit, plain-text reading view, multilingual statistics, literal find with original selection offsets, and a collapsed tools area preserving premise/revisions/proposal review/storyboard. No sample drafts or generated substitutes are shipped.

Replaced synchronous world parsing/writes on each keystroke with a per-workspace save queue (500 ms idle, 2-second continuous-edit deadline). Saves reload the latest world to preserve unrelated canon changes, flush before navigation/export/revision actions and on page exit/visibility loss, and retain failed entries for retry. Recovery mirrors stay editable with a pending marker. Revision history refreshes on save state transitions rather than on every keystroke. Proposal review in Director/Draft now operates on the latest repository state so approving facts does not overwrite newer writing. View controls are session-only; full chapter/scene authoring remains pending. Selected-text revision was added in the subsequent stage below.

Verification: `npm run typecheck`, `npm run test:writing`, `npm run test:world`, `node scripts/check-backend.cjs`, and `npm run build` passed in an exact temporary source copy with fresh locked dependencies because sandboxed reads stalled in the Documents checkout. Browser production preview on port 3014 verified focus/Escape, text size/reading view, literal search selecting original text, immediate edit-to-branch transition, child isolation, immediate reload persistence, and checkpoint restore preserving the newer text without queued-write overwrite. Screenshot: `writing-focus.png` in this chat visualization folder. No live AI requests or deployment.

## Selected-passage revisions (2026-10-09)

Added scoped passage capture/application services and `/api/revise-passage`. The route validates instruction, request identity, bounded passage/surrounding context and optional world/reference/preferences, then calls the existing real Gemini adapter for a schema-validated replacement. It does not write to canon or storage and returns actionable missing-key/invalid-response errors. The client omits the full manuscript, conversation and timeline from this focused request; approved retrieved world facts remain authoritative.

DraftEditor now provides Revise selection, original/replacement review, manual replacement without configuration, cancellable AI suggestions, explicit Apply/Discard, and a session-only Undo replacement. Editing the manuscript invalidates the captured selection; application validates workspace identity and the entire source snapshot, then checks the latest editor state again. Connected replacements and undo flush pending writes and checkpoint the prior structured draft before applying. Temporary review state is not persisted in backups; applied drafts/revisions use existing persistence.

Verification passed in the temporary exact source copy: type checking, `test:passage`, `test:writing`, `test:world`, backend validation, and production build. Offline provider stubs cover valid/invalid output and cancellation without external requests. Browser production preview on port 3015 verified original/replacement review, manual application preserving surrounding text, immediate undo, stale-draft Apply disabled, immediate reload persistence, and retained pre-apply revision text. Screenshot: `passage-revision.png`. Live Gemini generation remains unverified. No deployment or CanonKeep runtime changes.
