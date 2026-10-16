# Dreamina reference / Re:Story reconstruction

Date: 2026-10-16. Public browser inspection only. No account sign-in, source copying, private endpoints or generation requests.

## Sources
| URL | Evidence |
| --- | --- |
| https://dreamina.capcut.com/tools/ai-video-generator | Marketing hero, large central prompt, cyan action, categorized prompt showcases, settings/generate/preview flow |
| https://dreamina.capcut.com/ai-tool/home?need_login=true&type=video | Public create shell after dismissing sign-in overlay: sidebar, creation modes, central prompt, inline settings and visual inspiration cards |
| https://dreamina.capcut.com/ai-tool/explore | Public category navigation and discoverable content grid; loading state observed |

## Screen inventory
| ID | Screen | Purpose | Observed states | Re adaptation |
| --- | --- | --- | --- | --- |
| S01 | Public marketing | Product entry | Hero, modal, promotional banners | Keep Pages marketing separate; do not copy promotions |
| S02 | Create | Start a generation session | Guest input, Video mode, provider/duration/framing controls | Central Novel / Video / Context composer with current Re capabilities |
| S03 | Explore | Browse categorized work | Category chips, media grid loading | Original prompt-starter library, clearly labeled illustrative artwork |
| S04 | Sessions | Return to work | Guest sign-in message | Existing real browser workspaces, count and last update |
| S05 | Assets | Find saved output | Navigation observed, authenticated content unverified | Local projects/drafts/actual video job records; no cloud claims |
| S06 | Re editor | Write and direct | Existing Re verified in earlier runs | Rebuild chrome, keep writing, Director, timeline, world controls |
| S07 | Re video results | Track/review/download | Existing Re API and job states | Composer/results design aligned with new visual system |

## User flows
F01 Create: choose Novel/Video/Context -> enter text or import -> open real workspace -> edit or explicitly approve generation.
F02 Explore: filter prompt starters -> choose one -> review editable text -> create workspace. Selection never starts generation.
F03 Return: Projects list/search -> select workspace -> switch Novel/Video/Director/Timeline/World -> saved work persists.
F04 Video: review shot/settings/access/cost -> one explicit request -> pending/failed/unknown/ready state -> preview/download only when provider returned actual media.

## Components and states
Sidebar primary nav, session list, central mode switch, bounded multiline composer, inline model/duration/framing controls, category filters, original concept cards, project grid/search, contextual editor toolbar, visible save state, access disclosure, generation consent, selected-job stage and history. Preserve keyboard focus, loading, empty, error, long text and mobile states.

## Data model
Existing Workspace remains authoritative: id/title/notes/story/conversation/plan/preferences/video/worldContext. VideoSettings and VideoJob retain existing validation and signed tickets. New navigation/filter/selected-template state is presentation-only. No migration is required. Confidence: high, from Re source.

## Limits
Not a Dreamina feature clone. Seedance/Sora access, image generation/editing, avatar generation, cloud assets, community posting, subscriptions, credits, long video and canvas editing are not connected in Re and must not appear as working controls. Never ship Dreamina screenshots, logos, showcase media, source, proprietary prompts, creator identities, promotions or claims. Original artwork is illustration, not generated output proof. Existing Veo provider limits and pending model migration remain unchanged.

## Size and risks
Seven reference/adapted screens and four core flows. Interface reconstruction is bounded; provider parity would be a separate large integration. Hardest parts: lossless existing-workspace navigation, truthful paid-generation states, responsive central composer with dense results. Rebuild the presentation while retaining tested persistence and provider boundaries.
