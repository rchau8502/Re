# CanonKeep

CanonKeep is a production-minded MVP for persistent worldbuilding and campaign canon management.

The product principle is simple:

- conversation first
- structure underneath
- retrieval before response
- canon changes with provenance

Users talk to an AI partner about a world. CanonKeep retrieves relevant stored canon, answers in context, extracts candidate facts, lets the user review them, and applies approved updates into structured tables with visibility and retcon tracking.

## Current MVP slice

This repo now includes:

- Next.js 16 + TypeScript + Tailwind 4 app shell
- email/password auth wiring for Supabase
- world dashboard and world creation flow
- world workspace with left navigation, central chat, right canon panel
- chat modes: creator, archivist, consistency checker, GM assistant
- retrieval-backed chat orchestration scaffold using the OpenAI Responses API
- canon candidate extraction pipeline with structured candidate objects
- contradiction detection foundation
- campaign, session, timeline, change-log, and document screens
- Supabase SQL schema, RLS policies, storage bucket policy, and demo seed data
- demo-mode fallback so the app is browseable before Supabase is configured

## Repo structure

```text
app/
  (app)/
    layout.tsx
    worlds/
      page.tsx
      new/page.tsx
      [worldId]/
        layout.tsx
        page.tsx
        chat/page.tsx
        entities/page.tsx
        timeline/page.tsx
        campaigns/page.tsx
        campaigns/[campaignId]/page.tsx
        campaigns/[campaignId]/sessions/[sessionId]/page.tsx
        changes/page.tsx
        documents/page.tsx
  api/
    chat/route.ts
    canon-candidates/route.ts
    documents/route.ts
  auth/page.tsx
  globals.css
  layout.tsx
  page.tsx
components/
  chat/
    chat-workspace.tsx
  layout/
    logo.tsx
    site-header.tsx
    world-sidebar.tsx
  ui/
    badge.tsx
    button.tsx
    input.tsx
    panel.tsx
    textarea.tsx
  worlds/
    world-card.tsx
    world-form.tsx
lib/
  ai/
    orchestrator.ts
    prompts.ts
    schemas.ts
  data/
    candidate-apply.ts
    conflicts.ts
    demo.ts
    mappers.ts
    repository.ts
  forms/
    auth-actions.ts
    world-actions.ts
  supabase/
    client.ts
    server.ts
  auth.ts
  constants.ts
  env.ts
  types.ts
  utils.ts
supabase/
  schema.sql
  seed.sql
proxy.ts
```

## Architecture

### 1. App layer

- `app/page.tsx`: landing page and first-pass brand
- `app/auth/page.tsx`: email/password auth UI
- `app/(app)/worlds/*`: dashboard and world workspace routes

### 2. Data layer

- `lib/data/repository.ts`: main read/write abstraction for worlds, chat, retrieval context, and candidates
- `lib/data/demo.ts`: built-in demo world so the UI works without external services
- `lib/data/conflicts.ts`: basic contradiction detection heuristics
- `lib/data/candidate-apply.ts`: approved candidate application into canon tables

### 3. AI layer

- `lib/ai/prompts.ts`: mode-specific system guidance
- `lib/ai/orchestrator.ts`: retrieval-grounded response generation + extraction pipeline
- `lib/ai/schemas.ts`: JSON schema for extraction output

### 4. Persistence layer

- Supabase Postgres tables for structured canon
- Supabase auth for email/password accounts
- Supabase storage bucket for private uploaded documents
- RLS scoped to world ownership for the MVP

## Database schema

Defined in [supabase/schema.sql](/Users/richc/Desktop/NueroSphere/supabase/schema.sql).

### Core tables

- `users`
- `worlds`
- `campaigns`
- `entities`
- `relationships`
- `rules`
- `events`
- `secrets`
- `sessions`
- `changelog`
- `source_documents`
- `chat_threads`
- `chat_messages`
- `canon_candidates`

### Key design choices

- `worlds` is the ownership boundary for nearly every record in the MVP.
- `visibility` exists across canon-bearing tables to support `public`, `gm_only`, `private`, and `shared` access scopes.
- `canon_candidates` stores AI-suggested structured updates before approval.
- `chat_messages` remain the source provenance layer for extraction and changelog references.
- `source_documents.extracted_text` enables immediate retrieval without requiring a separate vector store.
- the schema is compatible with later additions like memberships, branching timelines, embeddings, or OpenAI file-search references.

## Retrieval-first chat flow

1. User sends a message in a world thread.
2. CanonKeep retrieves:
   - world metadata
   - visible entities
   - rules
   - recent events
   - recent sessions
   - visible secrets
   - source-document extracts
3. The AI response is generated from retrieved canon plus recent thread context.
4. A second extraction pass proposes structured canon candidates.
5. Candidate conflicts are detected against current canon.
6. The user can approve or reject candidates from the right-hand panel.

## Chat modes

Prompt packs live in [lib/ai/prompts.ts](/Users/richc/Desktop/NueroSphere/lib/ai/prompts.ts).

- `creator`: expands the setting and asks sharp next questions
- `archivist`: compresses and organizes canon
- `consistency_checker`: finds contradictions and ambiguity
- `gm_assistant`: supports campaigns, recaps, and hidden lore boundaries

## Local setup

### Prerequisites

- Node.js 20+
- npm
- Optional but recommended: Supabase project
- Optional but recommended: OpenAI API key

### Install

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5
OPENAI_EXTRACTION_MODEL=gpt-5
```

### Apply database setup

Run the contents of [supabase/schema.sql](/Users/richc/Desktop/NueroSphere/supabase/schema.sql) in the Supabase SQL editor, then run [supabase/seed.sql](/Users/richc/Desktop/NueroSphere/supabase/seed.sql).

### Start development

```bash
npm run dev
```

### Validate

```bash
npm run typecheck
npm run lint
npm run build
```

## Demo mode

If Supabase environment variables are missing, CanonKeep runs in demo mode.

Demo mode behavior:

- the dashboard loads a built-in sample world
- the workspace is fully browseable
- chat responses and candidate extraction fall back to deterministic local behavior
- document upload redirects back without persistence

This is intentional so the app can be explored immediately before infrastructure is configured.

## AI integration notes

The OpenAI integration is implemented in [lib/ai/orchestrator.ts](/Users/richc/Desktop/NueroSphere/lib/ai/orchestrator.ts).

Current behavior:

- server-side Responses API calls generate grounded assistant replies
- a separate structured extraction call produces canon candidates
- if `OPENAI_API_KEY` is absent, the app uses a deterministic fallback

Current limitation:

- the MVP stores extracted text for uploaded files and uses relational retrieval first; it does not yet wire source documents into OpenAI file search or vector retrieval
- contradiction handling is heuristic rather than semantic
- candidate approval inserts canon records, but retcon logging on every approval path is not fully automated yet

## Implementation plan

### Phase 1

- scaffold project
- auth wiring
- schema + seed
- world dashboard
- world workspace shell
- basic chat UI
- basic response loop

### Phase 2

- improve extraction quality
- richer candidate review and edit UI
- stronger retrieval ranking
- relationship and rule/event approval flows

### Phase 3

- complete changelog automation
- deepen contradiction resolution options
- campaign/session create-edit flows
- branch-aware continuity controls

### Phase 4

- production document ingestion improvements
- chunking and embeddings or file-search integration
- memberships and shared roles
- polish and analytics

## Suggested next build targets

1. add candidate editing before approval
2. write changelog entries automatically on every approved mutation
3. move retrieval from simple relational slicing to ranked search over canon + document chunks
4. add create/edit flows for campaigns and sessions
5. harden auth and storage flows against anonymous access edge cases
