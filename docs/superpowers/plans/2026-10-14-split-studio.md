# Split studio implementation plan

**Goal:** Replace the long video form with the user-approved split studio, preserving generation and story data.
**Architecture:** Keep Next.js and existing state/storage/API modules. Change view composition in VideoPanel, workspace chrome in page.tsx, and creation mode in StoryStart. Use scoped CSS for responsive layout without new dependencies.
**Tech stack:** Next.js 15, React 19, TypeScript, existing DM Sans/Manrope fonts and Lucide icons, plain CSS.

- [ ] VideoPanel: retain request/access/polling/unknown-outcome logic. Add selected-job state; composer and stage regions; actual history buttons; empty/pending/failed/ready previews; reuse prompt resets approval. Move technical connection details into disclosure, retain visible failure states.
- [ ] page.tsx: reorder modes Novel/Video first, retain internal tab IDs. In Video omit Direction fieldset and give editor full width. Preserve flushWriting before navigation and busy restrictions.
- [ ] StoryStart: add Video input mode with 2,000-character prompt validation; open directly to Video and retain Novel/Context imports.
- [ ] CSS: charcoal and muted lime tokens, compact sidebar/header/modes, desktop composer and stage grid, stacked mobile layout, visible keyboard focus and reduced-motion support.
- [ ] Run npm run typecheck, npm run test:video, npm run test:writing, npm run test:passage, npm run test:world and npm run build in the materialized runtime. Expect all checks passing. These are offline tests, not provider success proof.
- [ ] Browser: prepare prompt from draft; edit; switch modes; reload; check approval reset after settings changes; verify isolated failed/pending fixture display; inspect 390px mobile and desktop. Do not submit a paid generation.
- [ ] Publish tested source to existing GitHub main, deploy Vercel production, verify live UI and save screenshots. Exclude private credentials and test output.
