# Task-specific model input

Re:Story compiles explicit task data before calling Gemini. `lib/modules/ai/prompts.ts` shares the projection, safety rules, size guard and size metrics; the novel compiler adds each action's writing requirements.

- Reference analysis sends only the exact instruction and reference passage. It omits the manuscript and author-only chapter notes.
- Book outlining omits chapter prose. Chapter drafting, review and revision retain the current chapter, blueprint, confirmed continuation card, and current summaries from earlier chapters.
- Director, timeline and rewrite retain every supplied conversation message, user direction, reference claims, citations and approved retrieved world assertion. Storage IDs, revisions, recovery history and unrelated notebook records are excluded.
- Source-medium guidance and author style notes appear once. Approved branch facts, reveal boundaries and the requested alternate outcome retain priority.
- Input above 120,000 UTF-16 code units fails with HTTP 413 `PROMPT_TOO_LARGE`; no semantic summarization or silent truncation occurs. Displayed character counts use Unicode code points, with UTF-8 bytes reported separately.

The preview also lists each included section's purpose, character count and share of UTF-8 bytes. Counts include JSON quotes and escaped text; JSON keys and separators are reported separately. Unicode and delimiter-like text are covered by offline sum checks. Section metadata stays out of the provider prompt. Rounded percentages may not sum to exactly 100%; they do not estimate tokens or cost. Changing the selected action, instruction, analysis reference or story marks an existing preview stale; refreshing rebuilds it. Global writing settings still follow the snapshot rule above: generation always rebuilds from current settings.

The model, output allowance, explicit Apply flow, local recovery history and canon approval behavior are unchanged. This change does not reduce the number of model calls in research.

## Free input preview

In the chapter workflow, expand **AI planning, drafting and review**, select **Preview action**, enter the instruction and choose **Preview model input · no generation**. `/api/novel/preview` runs the same validation and compiler as generation and returns before any provider invocation or key requirement. It does not apply a manuscript change. Generation rebuilds the prompt from current state; a preview is a snapshot.

The client omits recovery history and thread ledgers from this HTTP request while retaining the full local editor snapshot for stale-result protection. This is a separate network-payload saving, not an additional reduction in billed model input.

## Offline measurements, October 28, 2026

The deterministic fixtures preserve Chinese instructions, all supplied canon assertions, old conversation decisions, confirmed author truths and reveal constraints. They include recovery checkpoints and future-chapter canaries that must not enter the prompt. Baselines use isolated pre-change engine, novel compiler and source-style sources.

| Task | Before characters | After characters | Reduction |
| --- | ---: | ---: | ---: |
| Book outline | 13,903 | 6,945 | 50.0% |
| Chapter draft | 14,075 | 8,207 | 41.7% |
| Chapter review | 13,991 | 8,123 | 41.9% |
| Reference analysis | 14,071 | 819 | 94.2% |
| Director, existing UI payload | 14,136 | 8,128 | 42.5% |
| Timeline, existing UI payload | 13,935 | 8,006 | 42.5% |
| Rewrite, existing UI payload | 14,118 | 8,135 | 42.4% |
| Passage revision | 12,248 | 6,462 | 47.2% |

A separate API caller supplying a full notebook reduced rewrite input from 68,049 to 8,551 characters; the existing UI already projected its notebook and must not be credited with that larger saving. Notebook HTTP payload characters fell from 53,922 to 17,630 independently.

These are fixture-specific character and byte measurements, not Gemini token counts, invoices, or evidence of improved generated prose. No paid requests were made. Exact token savings and live quality remain unmeasured.

## Verification

`npm run test:prompts` captures the actual server handler inputs using an offline provider stub and blocks network requests. It checks mandatory content, projections, non-mutation, Unicode metrics, input limits, preview parity and zero provider calls from preview. Novel, continuity, source-style, passage and backend regressions and the production build passed from a source-matched local mirror with fresh locked dependencies.

Browser verification used a separate Chinese test project with no configured API key. The read-only preview retained the reference marker, omitted the manuscript marker and showed 793 characters / 875 UTF-8 bytes. Existing projects were preserved. The temporary local preview has no key; repository credentials remain unchanged.

Evidence: `output/prompt-optimization-2026-10-28/{before,after,comparison,verification}.json` and `input-preview.png`. The verification report binds the tested source hashes.

A follow-up browser check verified the breakdown table, stale instruction warning and successful refresh (801 characters / 899 UTF-8 bytes), still without a key. See `input-breakdown.png` and `breakdown-verification.json` in the same evidence folder. Prompt, novel and style regressions and the production build passed again after the breakdown change. The earlier verification report describes its earlier source snapshot; the follow-up report binds the updated files.
