# Cross-chapter manuscript search — 2026-10-21

Reuse the draft editor's literal, case-insensitive Unicode search across chapter bodies in manuscript order. Queries accept up to 200 UTF-16 code units. Show at most 100 hits with chapter, line, highlighted text and surrounding prose, with an explicit truncation message when more matches exist. Do not search planning notes, completion summaries or historical drafts.

Result selection checks the original story snapshot and matched text before selecting the chapter. A one-use location request scoped to workspace, chapter and exact body selects the original UTF-16 range in the manuscript textarea. No prose replacement, automatic AI request, persistent schema change or dependency is needed. Editing defers recomputation and disables old result buttons until refreshed; the existing story snapshot guard also rejects stale navigation.

Acceptance: domain tests cover Chinese/emoji offsets, original case, multiline results, literal metacharacters, result bounds, order, notes exclusion and no mutation; novel/history/writing regressions, type checking and build; rendered browser search, cross-chapter selection, no-match feedback and reload preservation.
