# Oh Story integration

Source: https://github.com/zenstory-ai/oh-story-claudecode
Inspected commit: 74080143dd1ac9a39a930fafd99a0dbbe61b946a (version 0.9.0).
License: MIT, retained in third-party/oh-story/LICENSE.

This is an adaptation of the writing workflow into Re:Story, not installation of an agent host. No upstream hooks, agents, dashboards, or setup scripts are executed. Preserve the browser writing model and Gemini adapter.

Implementation milestones:
1. Optional chapter notebook inside NarrativeContent, validated by existing workspace/world backup paths. Enabling preserves the existing manuscript as chapter one. A single service synchronizes the active chapter with the manuscript editor.
2. Book outline, structured chapter blueprint, seven-field continuation card, and chapter completion receipts. Editing a completed chapter invalidates its receipt; generation of a later chapter requires its predecessors to be recorded.
3. Real Gemini actions for book outline, chapter blueprint, chapter drafting, reference analysis, review and prose revision. All output is previewed; apply requires the original story snapshot to match. Planning and prose never approve canon.
4. Local deterministic prose checks with locations, adapted from the upstream report-only degeneration/style checks. Heuristics are not an AI detector or a semantic consistency guarantee.
5. Regression checks for old backups, chapter switching, stale proposals, branch isolation, receipts, structured archive round trips, request validation and missing keys; production build and browser persistence checks.

Source references: skills/story-long-write/references/workflow-outline.md, workflow-chapter.md, tracking-transaction.md, skills/story-review/scripts/check-degeneration.js and check-ai-patterns.js. Rule excerpts in the native checker retain upstream attribution. Full upstream checks, tracking JSON format and filesystem import are not claimed compatible.

Deferred: live chart scraping, agent-host installation, cover generation, unattended batch writing, full upstream project-folder interoperability. Existing general story research and video generation remain their own workflows. No provider request, global installation, push or deployment is authorized by this integration.
