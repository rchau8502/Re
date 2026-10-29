# Re:Story

A focused story writing tool. Keep universe notes, discuss alternate choices with a Director, edit timelines, and write drafts. Workspaces save automatically in the current browser. Branches preserve their parent context. Export and import JSON backups, or export drafts as Markdown.

## Run locally

Requires Node.js 20 or newer to run the app. Full local verification requires Node.js 22.13 or newer for SQLite reopen tests.

```sh
npm install
cp .env.example .env.local
# Set GEMINI_API_KEY in .env.local for AI actions.
npm run dev
```

Open http://127.0.0.1:3000. For production, run `npm run build` then `npm start`.

Gemini powers research, Director conversations, timeline planning, and draft generation. The API key is read only on the server. Research uses Google Search grounding and keeps a private seven-day cache in `.cache`. There are no simulated replies or generated output substitutes. Finished provider videos have a player and download link. Provider outages and invalid responses return actionable errors; manually retrying preserves your previous work. Text and video generation use a single provider attempt per submitted request, without automatic application or SDK retries, because a lost response can still be billable.

Local notes, timeline editing, draft writing, branching, and backups work without an API key. Browser data is local to that browser and device: export backups before clearing it. AI requests transmit the current story context to Gemini. Verify researched facts against the listed sources.

`npm run typecheck` checks TypeScript. `npm run build` verifies production compilation.

Writing actions compile task-specific inputs and offer a free **Preview model input** in the chapter workflow. `npm run test:prompts` checks context preservation and preview parity offline. See [prompt compilation and measured input reductions](docs/integrations/prompt-compilation.md); character/byte savings are not measured billing-token savings.

Run `node scripts/check-backend.cjs` for request validation and missing-key checks. If Documents files are offloaded by macOS, `npm run local` builds and runs from a temporary local mirror.

## Vercel hosting

Deploy this Next.js application with `npx vercel --prod`. Set `GEMINI_API_KEY` as a sensitive Production environment variable in the Vercel project settings, then redeploy. Never use a `NEXT_PUBLIC_` prefix for this key. `GEMINI_MODEL` is optional.

AI route handlers allow 90 seconds. The research cache uses temporary storage on Vercel and is best effort; it may disappear between function instances. Browser workspaces remain local to the current browser and hostname. Export a localhost backup and import it on the hosted site to move existing work.

GitHub Pages hosts the advertising landing page. The full product and its server-side AI routes run on Vercel.

## Hosting

- Product: https://re-story-eta.vercel.app/ — full Next.js app, including server AI routes.
- Landing page: https://rchau8502.github.io/Re/ — an advertising page linking to the product, not a writing workspace.

`landing/` contains the advertising page and a screenshot of the actual app with manually entered example text. `npm run build:pages` copies it to `out/`. Replace `docs/` with those files (including `.nojekyll`), commit, and push. GitHub Pages publishes `main` → `/docs`.

Vercel uses `npm run build`. Add `GEMINI_API_KEY` as a secret Production environment variable and redeploy. Keys stay server-side and never belong in the public landing page. Gemini text generation and protected Omni short-clip generation are implemented. One live video was verified on 2026-10-26: a 4.01-second 1280×720 MP4, downloaded and played through in a browser. This single run does not establish general reliability or actual billing. See docs/integrations/live-video-acceptance.md.

Manuscripts and world memory save in the current browser. Export a JSON backup to move work between the product, localhost, and other devices. The landing page stores no story data.

## Unified world memory (first integration milestone)

In a workspace's Universe tab, choose **Create world memory**. Add entities, submit sourced facts, and approve them explicitly for Canon or the current alternate branch. Create branches at a numeric event order; descendants inherit parent facts at their fork and store only changes. Use the timeline point to inspect earlier states, add ordered events, and compare resolved facts with canon. The header Branch action creates an associated writing workspace and alternate world state when world memory is connected.

Director, timeline and writing requests include a bounded, branch-resolved selection of public/shared facts. Approved branch facts take precedence over baseline reference text. Private and GM-only material is excluded. AI responses still edit only conversation/plans/drafts; they cannot approve canon. Director and Draft include Suggest world changes: AI suggestions are validated and staged for review, with entity IDs, evidence, confidence and temporal scope. Edit, select, accept or reject proposals; baseline changes require the explicitly labeled canon approval action.

World memory saves in separate browser records. Export backup includes writing workspaces and their referenced worlds. Legacy workspace-only backups remain importable; standalone world backups restore as a new universe. No existing SQLite database or Supabase table is migrated. Keep CanonKeep's desktop application for its existing images/maps, guest reveals, GM notes, independent playthroughs and persistent undo/redo until those adapters are integrated.

Architecture and migration details: [MERGE_ANALYSIS.md](MERGE_ANALYSIS.md). Current completion and limitations: [MERGE_PROGRESS.md](MERGE_PROGRESS.md). `npm run test:world` checks inheritance, proposals, temporal state, continuity warnings, backup validation and retrieval. This is an incremental integration, not the completed production merger.

CanonKeep world exports (v1/v2) can now be imported from World memory. Imported entry text is staged for review and stays private, including GM notes. The original package is retained for export back to CanonKeep; its maps/images are preserved as opaque archive material, not rendered. Full CanonKeep library backups and playthroughs still require the original desktop application.

A separate Node 22.13+ SQLite repository adapter is implemented and tested, but is not yet selectable from the web UI. It refuses to open an existing CanonKeep database. Browser persistence remains the active web storage mode.

Connected structured worlds can now drive Director, timeline and writing without a separate legacy universe reference. Fact extraction supports conversation or draft passages up to 30,000 characters; quotations must match the supplied passage. Restored archives remap all internal IDs, including ancestry, sources, events and proposal facts.

Connected drafts and Director conversations now belong to their world branch. Switching branches opens that branch’s writing workspace; header Branch copies the current draft and starts a separate conversation. Draft revisions retain up to 50 checkpoints, approximately every 30 seconds of editing, with manual checkpoints and restore. Restore preserves the current draft as a checkpoint. These records travel with combined or standalone world archives; older archives without writing collections remain supported. If world storage fails, the browser workspace retains newer text with a pending-save marker. Export a combined backup to protect that recovery copy.

## Writing experience

Draft opens directly onto the manuscript. Focus writing hides navigation and direction controls; Escape returns to the workspace. Text size, a plain-text reading view, multilingual word counts and estimated reading time are available in the toolbar. Find locates literal passages without changing the text. Premise, revision checkpoints, storyboard notes and world review remain under Draft tools. View controls are session-only.

Writing edits update immediately. World archive saves coalesce after 500 ms of inactivity with a 2-second deadline during continuous typing. Branch/workspace/tab changes, AI context reads, backup export, revision actions, page exit and hiding the browser flush pending world writes. The browser recovery mirror remains, and save failures retain newer text and a pending marker. Page-exit handlers do not guarantee recovery after a forced process kill. `npm run test:writing` exercises queue timing, failed-save retry, scope isolation and multilingual search/count behavior.

Select text in the manuscript and choose **Revise selection** to compare the original with an editable replacement. Manual revisions work without AI. With Gemini configured, describe the change and request a suggestion; only Apply replacement changes the draft. Requests send the selected passage (up to 12,000 characters), up to 2,000 characters on each side, and the existing universe/direction context, rather than the full manuscript. Changes to the draft invalidate an open selection. Connected drafts save a checkpoint before replacement; Undo replacement remains available until the draft changes or the editor is closed. Review panels and suggestions are temporary and do not change canon. `npm run test:passage` checks scoped replacement, stale-text protection, checkpoint preservation and endpoint validation with an offline provider stub.

## Demonstrate with your own input

Run `npm run dev` and open http://127.0.0.1:3000. The start screen accepts a blank page, pasted text in any language, or a UTF-8 `.txt` / `.md` file (up to 400 KB and 100,000 characters). Choose Manuscript to edit the exact input directly, or Context to use notes as a universe reference. A title and intended change are optional. PDF, Word, image, audio, and arbitrary binary imports are not supported. JSON backups use the separate Import backup action.

A useful demonstration without an API key:

1. Paste a new passage, choose Manuscript, and open the workspace.
2. Edit it, use Read / Focus writing, or select text and review a manual replacement.
3. Create a Branch, change the branch manuscript, and switch back to show the original is preserved.
4. Open Timeline, start a blank timeline, and add your own events.
5. Reload to show local persistence, then export text or a JSON backup.

The connection indicator reports server configuration, not successful provider execution. Gemini research, Director responses, timeline generation, and AI passage suggestions require a valid server key and have not been live-qualified by the local demonstration.

## Video studio

The Video tab accepts a custom shot prompt or a reviewed draft/storyboard excerpt. New requests use Gemini Omni 1.1 Flash (`gemini-omni-1.1-flash`) through the Interactions REST API, with 720p output and landscape or portrait framing. The 4-, 6-, 8-, or 10-second selection is a prompt-directed target, not an exact-duration parameter. The $1.10 estimate allows for about 10 seconds of 720p output plus prompt overhead; actual token-based billing can differ and this is not a provider-enforced spending cap. Each request needs explicit cost approval. Set both `GEMINI_API_KEY` and a long random `VIDEO_ACCESS_CODE` as sensitive server environment variables; the owner enters the access code to unlock an eight-hour session. Neither secret is included in the browser bundle. This shared owner gate is not a multi-user account or billing system.

After unlocking Video access, **Check model access** reads provider model metadata only. It never submits a generation request. The result distinguishes model access from billing, generation quota and successful video output, which remain unverified by this check. The authenticated response is not cached.

Expired or invalid job tickets stop polling and show recovery guidance while preserving the prompt. Temporary network failures retain the existing pending job. Provider errors, quota/access issues and expired links have distinct guidance with the original error under Technical details. Reuse prompt clears cost approval.

Job records and prompts save in the browser workspace and combined JSON backups. Status checks do not generate clips. Provider and network failures do not automatically resubmit. An unknown submission outcome blocks further requests until the owner acknowledges the risk of a prior charge. This is a browser guard, not durable server idempotency across tabs or devices. Download completed files within two days.

`npm run test:video` uses an offline provider stub and checks request validation, authentication, cost gating, failure handling, ticket integrity and backup compatibility. It does not prove a successful provider generation or production media download.

The October 13 alternate-ending test first failed request validation (`allow_adult` instead of the text-to-video value `allow_all`). The corrected request started a job, which ended with Google internal error 13 and no video. That response does not establish a billing or content rejection. No automatic retry was made.

As checked October 19, Google lists October 22, 2026 as the shutdown date for `veo-3.1-fast-generate-preview`, recommending `gemini-omni-1.1-flash`. As of October 20, new requests have been migrated locally to that model using background interactions, signed interaction IDs, and MP4 output parsing from model-output steps. Existing signed Veo jobs keep their original read/download path. A single local Omni generation, download and browser playback was verified on October 26; production deployment and sustained reliability remain unqualified. Background requests use `store=true`, retaining prompts and results with Google for recovery; provider retention settings apply. GET results may contain inline base64 even when URI delivery was requested, so both forms are supported. See [Omni documentation](https://ai.google.dev/gemini-api/docs/omni), [pricing](https://ai.google.dev/gemini-api/docs/pricing), [model deprecations](https://ai.google.dev/gemini-api/docs/deprecations) and [Veo settings](https://ai.google.dev/gemini-api/docs/veo).

## Creation studio interface

Novel and Video are the primary workspace modes. New projects can start directly from a manuscript, shot prompt or story context. The video studio uses a dedicated prompt/settings column, large selected-job preview, and selectable generation history; its story direction inspector is hidden. Reusing a prompt or changing generation settings clears cost approval. Technical video access details are under Video access. On desktop the composer and outputs scroll independently; mobile stacks them with compact navigation. The current mode survives reload within the browser session.

The layout adapts the composer/output hierarchy observed in Runway's guest Tools editor, with Re's own typography and muted lime palette. No third-party assets or unsupported generation controls are included.

## Reconstructed product interface (October 16, 2026)

Create, Explore and Projects form the main navigation. Create keeps a central Novel / Video / Story context composer with exact-text import, optional project details and supported clip settings. Explore offers six original illustrated prompt starters; selection requires confirmation before replacing existing input and never calls a provider. Projects searches and reopens actual browser workspaces. Unsaved creation input survives navigation and reloads in the same tab using session storage, including its title, mode, direction and clip settings. New project explicitly resets this composer recovery. Closing the tab can remove it; open a project for durable browser storage. Unreadable recovery data is preserved and saving is paused rather than overwriting it. Workspace selection and active screen restore within the browser session.

The writing workspace retains focus mode, reviewed passage replacement, branches, timelines and world memory. The video workspace uses a central composer and explicit cost approval with a selected-job stage and history. No API keys, provider adapters or storage schemas were replaced. A single provider generation and authenticated download were verified on 2026-10-26; the full composer interaction was not exercised in that run.

Dreamina's public Create and Explore workflows informed the information hierarchy. Re uses original code, wording and concept artwork. Reference-only screenshots in `replica/screens/` are excluded from Git and deployment; no Dreamina media, accounts, model access or community content is included. Marketing on GitHub Pages remains separate.


## Oh Story writing workflow

The Novel workspace now offers **Enable chapter workflow**. Existing prose is preserved as chapter one. Add and switch chapters in the same manuscript editor; book outline, chapter blueprint, and the seven-part continuation card save with the draft and travel through workspace/world backups and branch copies. Up to 50 chapters are supported within the current browser draft limits (300,000 serialized notebook characters; 400,000 for the full draft). Split larger books into separate workspaces and export backups.

The blueprint records goal/choice, emotional change, conflict, causal beats, exact ending, viewpoint and withheld information. Each chapter owns its continuation card, separating author truth from reader knowledge, with character state, clues, constraints and next-chapter commitments. These are author notes, not approved canon. Existing private/GM world facts remain excluded from the world context adapter.

AI actions use the real server Gemini adapter: outline, blueprint, selected-chapter draft, reference analysis, review and prose revision. Each is an explicit request with an instruction, produces a preview, and requires Apply before changing supported fields. Analyses/reviews remain advisory. Editing or switching the story invalidates a pending suggestion; a just-applied suggestion has Undo until the story changes. Chapter blueprint/draft/review/revision actions require a confirmed card for the selected chapter. A blueprint and recorded predecessor chapters are also required before chapter drafting. No background batches or automatically approved tracking facts are created. Missing keys return the normal configuration error; no fabricated output is used. AI accepts at most 30,000 characters in a chapter/reference and 120,000 characters of assembled context.

Chapter completion records an author-written summary and current revision. Later edits to prose, title, blueprint, summary or chapter card invalidate the affected completion records and downstream card confirmations. Local checks flag possible truncation, repetition, leaked writing instructions and selected formulaic phrasing, with source locations. Authors may explicitly accept prose/length warnings. These limited pattern checks do not prove AI authorship or comprehensive narrative consistency. The continuation card remains explicitly author-maintained.

Adapted from [Oh Story](https://github.com/zenstory-ai/oh-story-claudecode) at commit `74080143dd1ac9a39a930fafd99a0dbbe61b946a` (0.9.0), with MIT attribution retained. This is native web functionality, not a global skills installation. See [integration scope](docs/integrations/oh-story.md). Upstream chart scraping, cover generation, host hooks/agents, tracking-format import and the complete upstream lint suite are not included. `npm run test:novel` covers domain persistence, gates, diagnostics, stale proposals and offline provider response handling; it does not qualify live AI quality.


## Persistent chapter history

Chapter workspaces now retain earlier prose locally even without world memory. **Chapter history** offers manual checkpoints, a read-only text/blueprint preview, and explicit Restore. Restore keeps the current text first, changes only the selected chapter, restores its saved chapter card when available, and requires a fresh card confirmation and completion check. Older checkpoints retain the current chapter card; the legacy shared card stays unchanged. Earlier-chapter restoration invalidates downstream completion records. AI suggestion application and Undo also preserve recoverable chapter snapshots.

Pre-edit autosnapshots are coalesced to one per 30 seconds per chapter. History is bounded to eight versions per chapter, 64 per notebook and 150,000 serialized history characters, within the existing notebook/draft size limits. Older checkpoints are pruned to protect current prose. If an explicit restore or AI replacement cannot retain the current chapter, it stops with an error; export a backup or split the book. This is bounded local recovery, not an unlimited archive or cloud backup.

History is included in JSON backups, structured world drafts and branch copies, but excluded from manuscript Markdown and AI context. Old notebooks without history remain valid. `npm run test:history` checks coalescing, recovery preservation, capacity/retention, branch scope and archive compatibility. See [chapter recovery design](docs/integrations/chapter-history.md).

## Chapter continuation boundaries

Each chapter starts with a blank, separately saved card describing its starting state and reveal boundaries. Confirm it after reviewing the preceding chapters. Earlier chapter changes or reordering make later confirmations stale. Old shared cards remain available under **Legacy shared card**; copying into an unscoped chapter is explicit and requires confirmation. No shared or later chapter card is automatically sent to Gemini. Cards, confirmations and card history travel with backups and branches, within the existing storage limits. Run `npm run test:continuity`; see [chapter continuity design](docs/integrations/chapter-continuity.md).

## Foreshadowing ledger

The chapter workflow includes **Foreshadowing ledger**. Select an evidence chapter, search a phrase, choose its exact occurrence, then add a title, author note and optional payoff chapter. Select a later passage and click **Use selection as payoff** to record its resolution. Open either evidence link to select the original text in the manuscript.

Any change to a linked chapter’s prose makes its evidence require review; explicitly select and relink the passage. This conservative rule protects repeated-text anchors. Reordering also checks planting/payoff order. The ledger remains author-managed, is excluded from AI context and manuscript export, and travels with JSON/world backups and branches. Up to 100 entries fit within the existing notebook size limits. Run `npm run test:threads`; see [foreshadowing integration](docs/integrations/foreshadowing-ledger.md).

## Live text acceptance (2026-10-26)

Three authorized text requests produced a valid chapter blueprint and an advisory review of the preserved original opening; chapter generation returned HTTP 503 PROVIDER_UNAVAILABLE. No generation retry occurred. The complete blueprint-to-generated-prose workflow and prose quality remain unqualified. See [live novel acceptance](docs/integrations/live-novel-acceptance.md).

## Original storytelling style

Direction → Original storytelling style adds a source medium and author-owned notes for viewpoint, pacing, dialogue and visual storytelling. These guide Director, timeline, prose, passage revisions and chapter planning/review while preserving the requested alternate outcome. Existing workspaces and backups remain compatible. This is prompt guidance, not guaranteed source fidelity or automatic media analysis. Video uses its explicit shot prompt separately. Run `npm run test:style`; see [source style scope](docs/integrations/source-style.md).

## Video continuation

Ready Omni clips now expose **Continue this video**, with a saved continuation draft, separate one-request cost approval and preserved parent history. Signed planning allowances progress through 20/30/40 seconds; estimates are conservative and actual output length/billing remain provider-dependent. Original and continuation videos download separately. Local regression and browser checks passed; no paid continuation was run. See [continuation scope and verification](docs/integrations/video-continuation.md).


## Local release verification

Run `npm test` for all 13 offline regression groups, or `npm run verify` for those checks plus TypeScript and the production build. Requires Node.js 22.13+. The runner clears provider credentials in child processes and stops on a failure or timeout. These checks use offline provider stubs; they never deploy or submit paid generation requests.

For browser acceptance, start the production server on port 3038, then run `npm run test:ui` with a separately available Playwright runtime and Chromium. `RESTORY_BROWSER_MODULES` selects its node_modules directory; `RESTORY_BROWSER_EXECUTABLE` selects an existing Chromium executable when needed. `RESTORY_TEST_URL` can select another loopback server. The script uses fresh browser contexts, writes synthetic data only, and exercises exact multilingual input, chapters, branching, reload, backup export/import, mobile layout and storage refusal. Artifacts default to `output/release-2026-10-28`; override with `RESTORY_UI_OUTPUT`.

Unreadable workspace records pause normal saving and expose **Export original storage**. Before new projects or imports can replace the index, the app saves and verifies the exact original record under `restory-unreadable-backup` (or a fresh suffixed key when an earlier recovery copy exists). A refused write blocks replacement and preserves composer input. Original storage exports are recovery material and may need repair before they are valid importable backups. Recovery copies still live in browser storage; download them before clearing browser data.

See [local release acceptance and outstanding production gates](docs/integrations/release-acceptance.md). No Git push or deployment is part of the local verification command.
