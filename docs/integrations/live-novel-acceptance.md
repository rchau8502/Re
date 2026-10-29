# Live Chinese novel acceptance — 2026-10-26

User authorized at most three text requests with a $0.10 budget target, acknowledging that the app has no provider-enforced spending cap. Exactly three requests were submitted through the local /api/novel route using gemini-2.5-flash. No automatic retries or additional generation calls. Actual billing is unverified.

## Results

1. Chapter blueprint: HTTP 200. Returned a complete schema-validated Chinese blueprint, target 300–500 visible characters, limited viewpoint, no sender/content reveal, ending at boarding the train.
2. Short chapter: HTTP 503, code PROVIDER_UNAVAILABLE. No generated text was returned or applied. The existing error classification does not expose the underlying cause; timeout, quota and provider availability must not be asserted as the diagnosis.
3. Review: HTTP 200. Reviewed the preserved original opening (31 visible letters/numbers), because step 2 produced no chapter. It correctly identified missing length, undeveloped causal progression and an unreached ending, with source excerpts. Its word-count estimate and judgment remain advisory. This does not test review of AI-generated prose.

## Preservation checks

Real successful responses were passed through the existing domain validation/application functions on a disposable synthetic notebook. Receiving a suggestion left original prose unchanged. Applying against a stale base was rejected. Explicit domain application retained the pre-apply prose in history. Applying the advisory review as a replacement was rejected and left prose unchanged. Existing user manuscripts were not touched. These assertions are not a live browser Apply-button test.

## Acceptance boundary

This is partial acceptance: live blueprint and review responses work for this fixture; live short-chapter generation failed. Chinese generated prose quality, author-truth leakage in generated prose, exact ending compliance and a complete blueprint → chapter → review path remain unverified. The three-request authorization is exhausted; no fourth call was submitted.

Evidence: output/novel-acceptance-2026-10-26/live-verification.json, live-journal.json, blueprint-response.json, chapter-response.json, review-response.json and restorable-blueprint.json. The restorable backup contains the original opening with the generated blueprint, not a generated chapter.

## Subsequent offline repair

A reproducible SDK retry-wrapper defect that discarded HTTP status codes was repaired, along with timeout/cancellation classification and the 15-second SDK timeout. See text-generation-safety.md. These offline findings do not identify the original failed live call’s cause or change its failed result. No fourth live text call was submitted.
