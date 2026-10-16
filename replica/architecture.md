# Reconstruction architecture

Retain Next.js 15, React 19, TypeScript, existing server routes, Workspace schema, validated backups and local save queues. No framework migration, database replacement, or new provider calls are necessary for the interface reconstruction.

- `app/page.tsx`: existing workspace owner and orchestration; add Create / Explore / Projects navigation while preserving workspace actions, flushes, and branch/canon operations.
- `app/features/studio/`: presentation components for original prompt library, project grid and app navigation. Templates must only fill editable local input, never call providers.
- `app/features/writing/story-start.tsx`: rebuild as central mode composer; preserve exact-text manuscript and context imports with existing bounds. Accept selected template via explicit props, preserving any current manual input until the user chooses a template.
- `app/features/video/video-panel.tsx`: rebuild view composition around central input/results, retaining access, signed ticket, polling, one-request cost approval and unknown-outcome rules.
- `app/globals.css` or a dedicated imported studio stylesheet: charcoal/cyan design tokens and responsive components. No Dreamina assets, copied source or model list.
- `public/studio/`: original concept illustrations only, clearly labeled as prompt-starter artwork rather than generated video or user output.

View state must not overwrite story records. Project search and filters use actual Workspace fields. New UI controls must map to existing supported functionality; unsupported image/avatar/cloud/community/canvas features are omitted. Existing data remains importable without migration.

Validation: build/typecheck and existing video/writing/passage/world checks; browser checks for exact-text import, create/explore/project navigation, template review, branch preservation, mode changes and reload, empty/error/pending/unknown job states, mobile and desktop layout. No paid generation merely for verification.
