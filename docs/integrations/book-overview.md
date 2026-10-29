# Book overview — 2026-10-21

A derived view of the existing chapter notebook: manuscript order, visible letter/number counts, recorded/draft/empty/needs-review status and expandable author summaries. Chapter buttons use the existing selectChapter service and preserve all content/history. No new persisted state, schema migration, provider call or external dependency.

A chapter is recorded only if its completion receipt matches the current revision and its body/summary are nonempty. Prior receipts or summaries identify chapters needing review. Other chapters are drafts or empty. Prior summaries are explicitly labeled as needing review. Recorded status is author acceptance, not a plot-consistency guarantee.

The optional unrecorded-only filter helps find unfinished work. Counts are computed only while the overview is open. The table scrolls within the panel for long books and small screens, supports keyboard focus and labels the current chapter. Summaries remain excluded from manuscript export.

Acceptance: type checking, production build, existing novel/history regressions; actual browser Chinese title/body counts, navigation, filtering, recorded-to-review transitions and reload preservation.
