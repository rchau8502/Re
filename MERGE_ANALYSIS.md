# Unified story-world merge analysis

Repository inspection: 2026-10-07. This document describes source evidence, rather than README promises. No existing database or browser workspace has been migrated.

## Foundation decision

Use Re:Story as the first unified web shell and integration checkout. Its real Gemini integration, editable writing workflow, local autosave, input validation and honest missing-key errors are reusable immediately. CanonKeep supplies the richer canon/provenance/visibility concepts and the preserved desktop runtime. Do not import CanonKeep's web demo repository as the runtime foundation: missing configuration currently produces sample worlds and fabricated mutations. This decision does not retire CanonKeep or replace its SQLite desktop app with browser storage.

Keep a modular application, with portable contracts under `lib/modules`, framework UI under `app/features`, and adapters behind repository interfaces. Do not physically combine checkouts or adopt a monorepo until both runtimes actually consume shared packages. Existing uncommitted work in both repositories is preserved.

## Current architectures

| Concern | CanonKeep / NeuroSphere | Re:Story |
|---|---|---|
| Web | Next 16.1, React 19.2, TypeScript 5.9, Tailwind 4.2 | Next 15.3, React 19, TypeScript 5.7, Tailwind 4 |
| Packages | npm/package-lock; Electron/esbuild tooling | npm/package-lock; temporary local runtime mirror |
| UI/state | Server routes, Supabase actions; desktop renderer local React state and IPC | One client page, React state; 250 ms browser autosave |
| Local data | `desktop/store.mjs`, Node `DatabaseSync`, SQLite schema version 4 | `restory-workspaces-v2` JSON in localStorage |
| Cloud data | Supabase Postgres + SSR auth + RLS; Vercel Blob documents | No cloud workspace persistence or authentication |
| AI | OpenAI Responses + second extraction pass; deterministic fallbacks | Server Gemini with JSON schemas; Search grounding, private seven-day research cache |
| Branches | Campaign `timeline_branch` is a label; desktop campaigns copy entry arrays | Workspace copies including notes, reference, chat, plan and draft |
| Backup | World package v1/v2; library backup v1–v4; validated references, transactions | Validated workspace import, ID remapping, JSON and Markdown export |
| History | Desktop persistent undo/redo and recovery drafts; cloud changelog writes | Autosaved current draft, no revision model |

### CanonKeep source inventory

`lib/types.ts` defines World, Campaign, Entity, Relationship, Rule, EventRecord, Secret, SessionRecord, SourceDocument, ChatThread/Message, CanonCandidate and ChangeLogEntry. There is no independent Fact table and no real branch ancestry. `supabase/schema.sql` creates users, worlds, campaigns, entities, relationships, rules, events, secrets, sessions, changelog, source_documents, chat_threads, chat_messages and canon_candidates. RLS is owner-scoped; visibility metadata is not a complete collaborative/guest authorization system. `changelog.changed_by` is NOT NULL while its FK uses ON DELETE SET NULL, requiring correction before cloud migration.

`lib/data/repository.ts` is framework- and Supabase-bound (`React.cache`, direct SDK calls). Retrieval loads a world workspace and slices small subsets, with visibility filters but no query relevance. Its workspace query does not load relationships into retrieval. `candidate-apply.ts` accepts broadly shaped payloads and writes canon/changelog in separate requests; target IDs need explicit world scoping in addition to RLS before reuse. `conflicts.ts` compares candidate entity descriptions and matching rule/event titles; it is a warning heuristic, not a world-state engine.

Desktop SQLite stores JSON world/campaign snapshots rather than normalized entity/fact tables. Tables: worlds, campaigns, history, drafts and redo_history. Store transactions protect mutations and restores; links and backup references are checked. Entry kinds are location/character/clue/scene/note. Images are embedded validated PNG/JPEG data, with separate per-image reveals. Maps are location images/attachments, not a standalone geographic map engine. Campaigns independently snapshot entries, reveal IDs/images and outcomes. Creator GM notes stay private. The guest window receives an allowlisted projection and has no privileged preload bridge. Main-process IPC verifies the creator frame. Sandbox/context isolation and navigation/network restrictions must survive integration. Desktop currently has no AI and blocks network; online AI will require a reviewed main-process boundary, not renderer SDK calls.

### Re:Story source inventory

`lib/story.ts` defines Workspace, Bible, Preferences, Plan and Story plus runtime guards. Canon-like material is arrays of strings and character descriptions; drafts are narrative rather than authoritative facts. `app/page.tsx` owns workspace selection, context/research, Director chat, sliders/toggles, generated/manual timeline, Markdown-like draft editing, branching, imports/exports, cancellation and retry. `lib/engine.ts` owns request validation, Gemini generation, research cache and orchestration. Routes are research, director, timeline, rewrite and status. `lib/schemas.ts` defines provider JSON schemas; semantic validators reject malformed results. Keys remain server-only. Backend checks cover malformed input and missing provider without fabricated output. The local runtime mirror must copy new module code as part of `lib` and feature UI as part of `app`.

## Subsystem ownership and disposition

| Existing subsystem | Module classification | Decision and integration |
|---|---|---|
| CanonKeep World/User/Campaign IDs; Re:Story workspace IDs | CORE | REFACTOR: project + explicit WorldContext; campaign stays distinct from branch |
| CanonKeep entities/rules/relationships/secrets | CANON / VISIBILITY | KEEP concepts; add Fact assertions, temporal scope, provenance and single approval service |
| Desktop entry CRUD/link validation | CANON / STORAGE | KEEP; adapter translation after migration tests |
| Campaign snapshots; workspace clones | BRANCH | REPLACE incrementally with fact overlays; retain snapshot semantics for RPG playthroughs |
| CanonKeep events/session outcomes; Re:Story Plan | TIMELINE | REFACTOR: entity-linked ordered events; generated plans remain proposals |
| CanonKeep chat workspace/prompts; Re:Story chat/direction | DIRECTOR / UI | KEEP workflow; explicit project/branch/conversation context |
| CanonKeep retrieval slicing; Re:Story Bible prompts | RETRIEVAL | REPLACE with shared branch resolver and bounded relevance selection |
| `conflicts.ts` | CONTINUITY | REFACTOR warnings; extend temporal checks; do not present heuristics as semantic validation |
| Re:Story Story/draft editor/export | WRITING | KEEP; add branch association, chapters/scenes/revisions in later stage |
| Gemini research + cache; CanonKeep document parse/blob | SOURCE / AI | KEEP real implementations; imports stage proposals, preserve evidence |
| Relationships/entity links | GRAPH | REFACTOR into graph projection; no second relationship store |
| Desktop `images.mjs`, pickImage and image reveals | MEDIA / VISIBILITY | KEEP intact; future adapter must preserve image validation and filename redaction |
| Desktop preload/guest/main security | VISIBILITY / UI | KEEP; guest boundary is not shared creator context |
| Desktop history/recovery; cloud changelog | HISTORY | KEEP; future shared transactional change records, recovery draft remains distinct |
| World/library packages and workspace JSON | BACKUP | KEEP compatibility; new versioned project archive added without rewriting old backups |
| Gemini SDK in engine; OpenAI orchestrator | AI | REFACTOR behind one provider contract; no business logic SDK calls after adapter migration |
| SQLite store; Supabase client/repository; localStorage | STORAGE | KEEP three implementations pending verified adapters; domain has no SDK/SQL dependency |
| App layouts, sidebar, UI primitives, styles | UI / SHARED | KEEP practical primitives; feature components own module views |
| `lib/data/demo.ts`, seed, demo banner and auth mode | LEGACY / REMOVE | REMOVE from future unified runtime; retain fixtures only in isolated tests |
| `fallbackAssistantReply`, `fallbackCandidates`, demo write returns | LEGACY / REMOVE | REPLACE with actionable errors before routing any unified feature through that code |
| Packaging/build/smoke scripts | SHARED | KEEP desktop packaging and security tests; no signed release claim |

No fabricated CanonKeep responses are imported into the unified runtime. Old CanonKeep prototype code remains in its original checkout until a functioning replacement is available.

## Shared architecture and contracts

Core owns Project, IDs and WorldContext `{projectId, branchId, atOrder?}`. Canon owns entities, fact proposals, provenance and approval. Branches alone own ancestry and resolution. Timeline consumes ordered event state. Retrieval consumes resolved facts and visibility-filtered entities. Continuity produces warnings. Director consumes retrieval and AI; it cannot approve facts. Writing consumes world context and owns text/revisions. Graph projects canon relationships. Media and RPG visibility remain optional. Backup validates portable archives. Repository adapters persist domain state.

Dependency direction: feature UI → service public interface → domain contracts; infrastructure implements contracts. The first browser repository stores a validated project aggregate for simplicity; normalized SQLite/Postgres Fact/Branch/Event repositories come next. Do not pretend the aggregate adapter supports collaborative writes or large libraries.

Initial portable model includes Project, Entity specializations, Fact, Relationship, Rule, Event, Timeline, Branch, Source, Conversation, Message, Proposal, Draft, Chapter, Scene, Revision and Attachment. `lib/modules/core/types.ts` is the contract reference. Relationships and rules are assertion specializations; the first UI supports general entity/predicate facts, not a complete relationship/rule authoring experience. The archive now persists world/canon/branches/events/proposals/sources/history plus branch-owned drafts, conversations and revisions. Chapter and scene collections remain contracts only. Existing writing payloads are also retained in workspace backups as a migration and recovery mirror, with `worldContext` linking them to the authoritative project.

An alternate branch stores only its own assertions; ancestor assertions resolve by subject/predicate. Parent future events stop at divergence. Descendants inherit the parent state at their own fork. Temporal bounds use numeric order, start inclusive/end exclusive. A removal assertion masks inherited truth. Parent retcons before a fork are live, not frozen snapshots; this is an explicit first-stage policy and needs version-pinning before collaborative canon editing. Multiple active assertions of the same predicate are single-valued; multi-valued relationship assertions need stable relationship IDs before graph migration.

## Migration plan and reversibility

1. Add optional `worldContext` to existing Workspace; retain `restory-workspaces-v2` and accept legacy backups. Create structured memory only on an explicit user action. Store new worlds separately under `story-world-v1:<projectId>`.
2. Combined backups contain workspaces and referenced project archives. Restore creates new project/workspace identities without replacing existing projects. Validate all data before saving. Keep original archive for rollback; multi-project browser imports are not a transactional database migration.
3. Desktop: new SQLite namespace/tables for projects, branches, facts, sources, proposals, timeline and writing. Export library first. Translate entry body/GM notes/media/links losslessly, never treating prose as approved facts. Preserve campaigns, reveals, outcomes, undo/redo and drafts independently. Leave schema version 4 readable by the existing store until the new reader/rollback strategy is proven.
4. Cloud: additive branch/fact/source-link/writing tables, project/world mapping, project-scoped composite FKs, indexes on project/branch/subject/predicate/order, owner RLS initially. Backfill canonical branch per world. Replace campaign label with optional branch FK while keeping old label. Add branch context to chats/events/candidates. Approval + fact + changelog must be one transaction/RPC. Dry-run/export before applying; no live SQL is executed in this milestone.
5. Provider abstraction: adapt existing real Gemini and OpenAI calls, schemas and grounding metadata; reject missing credentials and malformed extraction; no fallbacks. Online desktop requests must go through a secure main-process service.

## Smallest safe milestone and implementation order

First: portable model + tested resolution/proposal services + browser adapter + integrated World memory panel + existing editor association + bounded branch context for Director/writing + combined backups. This proves canon and alternate truth without replacing desktop code or deploying a cloud schema.

Next: SQLite adapter and CanonKeep export importer with lossless media/privacy preservation; provider adapters and validated extraction/event proposals; canonical writing revisions and entity detail; authoritative cloud adapters/RLS; timeline/graph/comparison interaction; centralized history/recovery; search; guest views. Enable new storage modes only after persistence/reopen and migration/rollback tests pass.

## Risks and limits

Existing uncommitted files cannot be reset or bulk copied. Next version mismatch and desktop network restrictions prevent a casual app merge. Browser quotas, autosave crash windows, non-transactional multi-key imports and missing cloud authorization limit the first milestone. CanonKeep's owner RLS does not authorize a guest. Public/shared retrieval is conservative; private author AI context needs an explicit permission service. Structured world models do not make AI output trustworthy automatically. Existing baseline Bible text remains reference material and must yield to approved branch assertions in prompts. No background extraction or source upload is implied by attaching world memory.

## Subsequent safe stage implemented

After the first milestone, added a separate SQLite aggregate adapter and explicit CanonKeep world-package importer. This is not a migration of the desktop store. Imports stage descriptions as pending private assertions; preserve original bytes, private GM sources and media; and provide an original-package export. The archive supports optional ImportedMaterial and a 16 MiB ceiling; browser quotas can be lower. Gemini SDK calls now live behind an SDK-neutral generation contract. See MERGE_PROGRESS.md for validation and unfinished runtime adapters.

## Stage 3 integration

Director owns the fact-extraction request and validation service; Canon owns pending edits and individual/selected approval. The AI endpoint only returns suggestions with project/branch context. Client application services stage a sourced review batch, validate entity and temporal scope again, and deduplicate extraction receipts. ProposalReview is a shared feature component used by World, Director and Draft; it contains no provider or database SDK. Branch-aware structured context can supply Director/writing without a legacy Bible. Backup restoration remaps all typed internal record identities and workspace references, while raw imported CanonKeep material stays unchanged for lossless legacy export. AI event proposals and OpenAI selection remain separate unfinished work.

## Stage 4 writing integration

Writing owns branch/workspace-scoped narrative drafts and conversations, revision coalescing and restore. UI selection hydrates from the project archive, except when a failed-write recovery marker protects newer browser text. Branch selection opens or creates an independent workspace; it does not reassign the current draft. Header branching copies narrative content but starts an empty child conversation. Revision restore validates ownership and checkpoints current content. Optional archive writing collections preserve compatibility with earlier version 1 exports, and restoration remaps writing/workspace identities together. This aggregate persistence is a transition toward normalized desktop/cloud repositories; chapter/scene authoring and selected-text tools are still pending.

## Focused revision workflow

Selected-passage revisions use a portable capture/apply service with workspace ownership and exact-source-snapshot checks. The server returns a validated suggestion; it cannot approve facts or save drafts. The UI requires explicit review/application, preserves prior content through existing writing checkpoints, and refuses stale snapshots. Requests carry bounded surrounding text and the existing writing/world reference instead of the whole draft. Chapter/scene composition and dedicated semantic canon-checking remain separate unfinished work.
