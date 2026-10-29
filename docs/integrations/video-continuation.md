# Video continuation — 2026-10-27

## Behavior

Video creation accepts 4/6/8/10-second targets. A ready clip exposes Continue this video: enter the next scene, review the conservative total-length allowance and new-request estimate, then approve one continuation. The quote is read-only. Editing the prompt or changing the selected clip clears approval. Unsubmitted continuation text saves locally and travels in workspace backups, associated with its parent job.

New jobs reference their parent record and keep a distinct signed ticket. Creation uses Omni Interactions with previous_interaction_id, background=true, store=true, URI delivery and an append-only continuation prompt. The server checks parent readiness before any paid POST. Original and ancestor records are retained within the existing 12-job history limit; unrelated older records can be pruned as before. Ready outputs use existing status/download handlers. Unknown POST results remain unknown with no automatic retries; restoring a submitting record preserves the existing recovery gate.

## Authority and compatibility

Each new root ticket signs durationCeiling=10 and framing. Child tickets sign 20,30,40; a parent at 40 is rejected before contacting the provider. These are conservative planning allowances, not measured duration: a nominal 4- or 8-second clip still reserves the single-generation maximum of 10. Browser-supplied ceiling values never determine server limits. Expired/tampered tickets fail before generation. Old Omni tickets lack continuation metadata but predate extension, so they are treated as single <=10-second clips; their saved framing is supplied and validated. Legacy Veo remains playable through existing routes but cannot continue.

The UI includes a synchronous submission guard. The server performs one creation attempt per accepted submission; this is not a persistent cross-client idempotency service. A failed readiness check never sends a paid POST. If a submitted POST loses its response, there is no automatic resubmission.

## Cost and limits

Current official pricing is token-based, approximately $0.10 per second of 720p video output plus input and other output tokens. Continuation can return the combined video, so the app conservatively estimates against the whole signed allowance plus context/prompt overhead: $2.20, $3.30 and $4.40 per successive request. These are review estimates, not actual bills or provider-enforced caps. Each request requires its own explicit approval. Actual output length, regeneration costs and seamless character/audio continuity remain provider-dependent.

Official docs describe 3–10-second continuations and a total maximum of 40 seconds. This implementation targets 10 added seconds and at most three continuation stages. It does not add arbitrary uploaded-video extension, middle insertion, external montage, or automatic paid batches.

Sources checked 2026-10-27: [Omni generation/extension](https://ai.google.dev/gemini-api/docs/omni), [pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Verification

Video regression checks cover origin/authentication, metadata quotes without provider calls, ready/pending/failed/unavailable parents, expired/invalid/Veo tickets, mismatched framing/cost, client counter tampering, 10→20→30→40 ancestry, rejection beyond 40 before provider calls, quota rejection and unknown POST outcomes, original preservation, bounded ancestor retention, local continuation drafts and backup compatibility. Backup, writing/composer checks and production build passed.

The actual existing 8-second David clip was restored in a separate browser workspace. The video preview loaded, its legacy ticket obtained a $2.20 quote, Chinese continuation text persisted through reload, and approval stayed unchecked with submission disabled. Screenshot and tested hashes: output/video-extension-2026-10-27/verification.json and continuation-controls.png. No new paid generation was submitted. Real continuation quality and actual billing remain unverified; the original clip is not proof of this feature’s generation behavior.
