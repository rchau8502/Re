# Chapter-scoped continuation cards — 2026-10-23

Problem: the shared continuation card could carry later reader knowledge or character state into earlier chapter AI tasks.

Each chapter now owns optional continuation text and a confirmation basis recording ordered predecessor IDs/revisions. New chapters start with a blank card. Editing card text clears confirmation, invalidates the chapter completion receipt and later receipts. Earlier prose, blueprint, summary, card changes or reordering make downstream confirmations stale. Confirm only after predecessor completion records are current; confirmation itself does not change manuscript text or approve canon.

Legacy version-1 notebooks and history remain readable. Keep the original shared card as preserved author notes; copying it into an unscoped chapter is explicit, affects only that chapter and still requires review/confirmation. No automatic inheritance from a later/shared card. Existing cards cannot be overwritten through this migration shortcut.

Blueprint/draft/review/polish requests require a confirmed card. Prompt construction explicitly serializes only the active chapter card; shared cards, later cards, confirmation metadata and historical cards are excluded. Outline/reference tasks can operate without confirmed chapter context and receive an empty card in that case. This is context isolation, not a guarantee that a model will never invent or reveal information supplied elsewhere in the outline, instruction or world context.

New chapter checkpoints include the chapter card; restoring it clears confirmation and preserves the newer card first. Old checkpoints without a card retain the current chapter card but require confirmation again. The shared legacy card stays unchanged. Existing notebook/history size and count limits apply.

Validation: dedicated continuity regressions; existing novel/history/writing/passage/world/video/backend suites as applicable, type checking/build, and rendered Chinese browser confirmation/switch/edit/reload checks. No live model request or deployment is implied.
