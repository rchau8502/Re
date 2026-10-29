# Chapter order and summary dependencies — 2026-10-21

Move the selected chapter one position up or down without copying manuscript text. Preserve chapter IDs, active selection, prose, blueprints, summaries, continuation card and recovery history. Exports and subsequent AI context use the new chapter order.

Completion receipts depend on predecessor order. A move invalidates completion from the earliest affected position onward, including when moving chapters back. Boundary moves and unknown IDs are rejected without mutation. Reordering makes existing AI previews stale through the existing story snapshot guard.

Updating an earlier completion summary also invalidates downstream receipts, because later drafting uses those summaries. Re-recording the same summary does not invalidate anything, and the newly recorded chapter itself remains recorded.

Acceptance: domain regression for both directions, boundaries, unchanged text/history, branch-copy isolation, export order, stale AI previews and summary dependencies; existing novel/history regressions, type checking and production build; rendered browser move/reload verification. No provider requests or deployment required.
