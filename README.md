# Re:Story

A focused story writing tool. Keep universe notes, discuss alternate choices with a Director, edit timelines, and write drafts. Workspaces save automatically in the current browser. Branches preserve their parent context. Export and import JSON backups, or export drafts as Markdown.

## Run locally

Requires Node.js 20 or newer.

```sh
npm install
cp .env.example .env.local
# Set GEMINI_API_KEY in .env.local for AI actions.
npm run dev
```

Open http://127.0.0.1:3000. For production, run `npm run build` then `npm start`.

Gemini powers research, Director conversations, timeline planning, and draft generation. The API key is read only on the server. Research uses Google Search grounding and keeps a private seven-day cache in `.cache`. There are no simulated replies, media players, or generated output substitutes. Provider outages and invalid responses return actionable errors; retry preserves your previous work.

Local notes, timeline editing, draft writing, branching, and backups work without an API key. Browser data is local to that browser and device: export backups before clearing it. AI requests transmit the current story context to Gemini. Verify researched facts against the listed sources.

`npm run typecheck` checks TypeScript. `npm run build` verifies production compilation.

Run `node scripts/check-backend.cjs` for request validation and missing-key checks. If Documents files are offloaded by macOS, `npm run local` builds and runs from a temporary local mirror.

## Vercel hosting

Deploy this Next.js application with `npx vercel --prod`. Set `GEMINI_API_KEY` as a sensitive Production environment variable in the Vercel project settings, then redeploy. Never use a `NEXT_PUBLIC_` prefix for this key. `GEMINI_MODEL` is optional.

AI route handlers allow 90 seconds. The research cache uses temporary storage on Vercel and is best effort; it may disappear between function instances. Browser workspaces remain local to the current browser and hostname. Export a localhost backup and import it on the hosted site to move existing work.

GitHub Pages hosts the advertising landing page. The full product and its server-side AI routes run on Vercel.

## Hosting

- Product: https://re-story-eta.vercel.app/ — full Next.js app, including server AI routes.
- Landing page: https://rchau8502.github.io/Re/ — an advertising page linking to the product, not a writing workspace.

`landing/` contains the advertising page and a screenshot of the actual app with manually entered example text. `npm run build:pages` copies it to `out/`. Replace `docs/` with those files (including `.nojekyll`), commit, and push. GitHub Pages publishes `main` → `/docs`.

Vercel uses `npm run build`. Add `GEMINI_API_KEY` as a secret Production environment variable and redeploy. Keys stay server-side and never belong in the public landing page. Gemini text generation is implemented; Veo video generation is not implemented yet.

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
