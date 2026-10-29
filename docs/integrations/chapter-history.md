# Chapter recovery milestone — 2026-10-21

Problem: local chapter workspaces have no persistent chapter recovery unless they are attached to world memory. AI Undo is temporary. Add recovery without replacing the existing draft, storage queue, world checkpoints or video implementation.

Acceptance criteria:
- Optional, validated chapter history inside the existing notebook; old workspaces remain readable.
- Automatic pre-change snapshots coalesce to one per 30 seconds per chapter. Manual checkpoints and pre-apply / pre-restore snapshots bypass that interval.
- Restore affects only the selected chapter's title, prose, blueprint and completion summary. Preserve the current chapter before restoring and require fresh completion review. Other chapters' content and the global continuation card remain unchanged; downstream completion receipts are invalidated.
- History remains bounded (8 snapshots per chapter, 64 per book, 150000 serialized history characters, within existing overall draft limits). Automatic retention must not prevent otherwise-valid writing. Explicit restore/apply must fail visibly if the current text cannot be retained.
- History travels with backups and branch copies, is excluded from prose export and AI prompts, and is recoverable after browser reload.
- Preview historical text before explicit Restore. Keep the native writing panel compact, with focus mode continuing to hide workflow controls.

Verification: focused domain regression for coalescing, restore preservation, malformed and foreign history, retention, capacity pressure, exports and AI context; existing novel/writing/passage/world/video suites, type checking, production build and browser manual checkpoint/edit/reload/restore/branch isolation.

2026-10-23 extension: new snapshots also retain the chapter-specific continuation card. Restoring a saved card requires fresh confirmation; old snapshots without a card retain the current chapter card. The legacy shared card is still preserved separately. See chapter-continuity.md.
