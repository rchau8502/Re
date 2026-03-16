'use client';

import { useMemo, useState, useTransition } from 'react';
import { AlertTriangle, CheckCircle2, Database, PencilLine, Save, Sparkles, Split } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Panel } from '@/components/ui/panel';
import { Textarea } from '@/components/ui/textarea';
import { formatDateTime } from '@/lib/utils';
import type { CanonCandidate, ChatMessage, ChatMode, ConflictAlert, RetrievalContext } from '@/lib/types';

interface ChatWorkspaceProps {
  worldId: string;
  threadId: string;
  initialMessages: ChatMessage[];
  initialCandidates: CanonCandidate[];
  initialConflicts: ConflictAlert[];
  initialContext: RetrievalContext;
  initialMode: ChatMode;
}

interface CandidateCardProps {
  candidate: CanonCandidate;
  conflicts: ConflictAlert[];
  onPersist: (candidateId: string, updates: { reviewStatus?: CanonCandidate['reviewStatus']; candidatePayload?: Record<string, unknown> }) => Promise<void>;
}

function CandidateCard({ candidate, conflicts, onPersist }: CandidateCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(String(candidate.candidatePayload.title ?? candidate.candidateType));
  const [summary, setSummary] = useState(String(candidate.candidatePayload.summary ?? 'Structured canon suggestion'));
  const [recordText, setRecordText] = useState(JSON.stringify(candidate.candidatePayload.record ?? {}, null, 2));
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSaving, startTransition] = useTransition();

  const relatedConflicts = conflicts.filter((conflict) => conflict.relatedRecordIds.includes(candidate.id));
  const resolution = String(candidate.candidatePayload.resolution ?? 'unresolved');

  async function saveEdits(nextPayload?: Record<string, unknown>, reviewStatus?: CanonCandidate['reviewStatus']) {
    startTransition(async () => {
      try {
        const record = nextPayload?.record ?? JSON.parse(recordText);
        const payload = {
          ...candidate.candidatePayload,
          ...nextPayload,
          title: nextPayload?.title ?? title,
          summary: nextPayload?.summary ?? summary,
          record,
        };
        setLocalError(null);
        await onPersist(candidate.id, { candidatePayload: payload, reviewStatus });
        setIsEditing(false);
      } catch {
        setLocalError('Record JSON must be valid before saving.');
      }
    });
  }

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">{candidate.candidateType}</p>
          <p className="mt-1 font-medium">{title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{candidate.reviewStatus}</Badge>
          <button className="rounded-full bg-white/80 p-2 text-[var(--muted)] transition hover:text-[var(--foreground)]" onClick={() => setIsEditing((value) => !value)} type="button">
            <PencilLine className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="mt-3 grid gap-3">
          <Textarea value={title} onChange={(event) => setTitle(event.target.value)} rows={2} />
          <Textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={3} />
          <Textarea value={recordText} onChange={(event) => setRecordText(event.target.value)} rows={10} className="font-mono text-xs" />
          {localError ? <p className="text-sm text-[var(--danger)]">{localError}</p> : null}
          <Button variant="secondary" onClick={() => saveEdits()} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" /> Save draft
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--muted)]">{summary}</p>
      )}

      {relatedConflicts.length ? (
        <div className="mt-4 rounded-2xl border border-[rgba(142,47,47,0.18)] bg-[rgba(142,47,47,0.05)] p-3">
          <p className="text-xs uppercase tracking-[0.16em] text-[var(--danger)]">Resolution path</p>
          <div className="mt-2 space-y-2 text-sm text-[var(--muted)]">
            {relatedConflicts.map((conflict) => (
              <p key={`${candidate.id}-${conflict.label}`}>{conflict.message}</p>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="ghost"
              onClick={() => saveEdits({ resolution: 'keep_old' }, 'rejected')}
              disabled={isSaving}
            >
              Keep old canon
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveEdits({ resolution: 'replace_canon', operation: 'update' }, 'pending')}
              disabled={isSaving}
            >
              Replace canon
            </Button>
            <Button
              variant="secondary"
              onClick={() => saveEdits({ resolution: 'fork_interpretation' }, 'needs_revision')}
              disabled={isSaving}
            >
              <Split className="mr-2 h-4 w-4" /> Fork interpretation
            </Button>
            <Button
              variant="ghost"
              onClick={() => saveEdits({ resolution: 'unresolved' }, 'needs_revision')}
              disabled={isSaving}
            >
              Mark unresolved
            </Button>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">Current resolution: {resolution.replaceAll('_', ' ')}</p>
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => saveEdits(undefined, 'approved')} disabled={isSaving}>
          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
        </Button>
        <Button variant="ghost" onClick={() => saveEdits(undefined, 'rejected')} disabled={isSaving}>
          Reject
        </Button>
      </div>
    </div>
  );
}

export function ChatWorkspace({
  worldId,
  threadId,
  initialMessages,
  initialCandidates,
  initialConflicts,
  initialContext,
  initialMode,
}: ChatWorkspaceProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [candidates, setCandidates] = useState(initialCandidates);
  const [conflicts, setConflicts] = useState(initialConflicts);
  const [context, setContext] = useState(initialContext);
  const [mode, setMode] = useState<ChatMode>(initialMode);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const pendingCount = useMemo(() => candidates.filter((candidate) => candidate.reviewStatus === 'pending').length, [candidates]);

  async function handleSend() {
    if (!draft.trim()) return;

    const optimisticMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      threadId,
      role: 'user',
      content: draft,
      metadata: {},
      createdAt: new Date().toISOString(),
    };

    setMessages((current) => [...current, optimisticMessage]);
    setDraft('');
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ worldId, threadId, message: optimisticMessage.content, mode }),
        });

        if (!response.ok) {
          throw new Error('Chat request failed.');
        }

        const payload = (await response.json()) as {
          assistantMessage: ChatMessage;
          candidates: CanonCandidate[];
          conflicts: ConflictAlert[];
          retrievalContext: RetrievalContext;
        };

        setMessages((current) => [...current, payload.assistantMessage]);
        setCandidates(payload.candidates);
        setConflicts(payload.conflicts);
        setContext(payload.retrievalContext);
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'Unexpected error');
      }
    });
  }

  async function persistCandidate(
    candidateId: string,
    updates: { reviewStatus?: CanonCandidate['reviewStatus']; candidatePayload?: Record<string, unknown> },
  ) {
    const response = await fetch('/api/canon-candidates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId, ...updates }),
    });

    if (!response.ok) {
      throw new Error('Failed to update candidate.');
    }

    const payload = (await response.json()) as { candidate: CanonCandidate };
    setCandidates((current) => current.map((candidate) => (candidate.id === candidateId ? payload.candidate : candidate)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Panel className="flex min-h-[70vh] flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Worldbuilding thread</p>
            <h1 className="font-serif text-3xl">Conversation first, canon underneath</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['creator', 'archivist', 'consistency_checker', 'gm_assistant'] as ChatMode[]).map((option) => (
              <button
                key={option}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${mode === option ? 'bg-[var(--accent-strong)] text-white' : 'bg-white/70 text-[var(--muted)]'}`}
                onClick={() => setMode(option)}
                type="button"
              >
                {option.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((message) => (
            <div key={message.id} className={`max-w-3xl rounded-[24px] border px-4 py-4 ${message.role === 'assistant' ? 'border-[var(--border)] bg-white/70' : 'ml-auto border-transparent bg-[rgba(95,47,22,0.1)]'}`}>
              <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
                <span>{message.role}</span>
                <span>{formatDateTime(message.createdAt)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--border)] px-5 py-4">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Describe a faction, reveal a secret, retcon an event, or ask the AI to pressure-test the setting." rows={5} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
              <Badge>{pendingCount} pending candidates</Badge>
              {isPending ? <span>Grounding response against canon…</span> : null}
              {error ? <span className="text-[var(--danger)]">{error}</span> : null}
            </div>
            <Button onClick={handleSend} disabled={isPending || !draft.trim()}>
              Send to CanonKeep
            </Button>
          </div>
        </div>
      </Panel>

      <div className="space-y-5">
        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-[var(--accent-strong)]" />
            <h2 className="font-semibold">Retrieved context</h2>
          </div>
          <p className="mt-3 text-sm text-[var(--muted)]">{context.worldSummary}</p>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <p className="font-medium">Entities</p>
              <p className="text-[var(--muted)]">{context.entities.map((entity) => entity.name).join(', ') || 'None yet'}</p>
            </div>
            <div>
              <p className="font-medium">Rules</p>
              <p className="text-[var(--muted)]">{context.rules.map((rule) => rule.title).join(', ') || 'None yet'}</p>
            </div>
            <div>
              <p className="font-medium">Events</p>
              <p className="text-[var(--muted)]">{context.events.map((event) => event.title).join(', ') || 'None yet'}</p>
            </div>
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--accent-strong)]" />
            <h2 className="font-semibold">Canon candidates</h2>
          </div>
          <div className="mt-4 space-y-3">
            {candidates.length ? (
              candidates.map((candidate) => (
                <CandidateCard
                  key={`${candidate.id}-${candidate.updatedAt}`}
                  candidate={candidate}
                  conflicts={conflicts}
                  onPersist={persistCandidate}
                />
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No extraction candidates yet. Send a worldbuilding message to generate structured canon proposals.</p>
            )}
          </div>
        </Panel>

        <Panel className="p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--danger)]" />
            <h2 className="font-semibold">Conflict alerts</h2>
          </div>
          <div className="mt-4 space-y-3">
            {conflicts.length ? (
              conflicts.map((conflict) => (
                <div key={`${conflict.label}-${conflict.relatedRecordIds.join('-')}`} className="rounded-3xl border border-[var(--border)] bg-white/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{conflict.label}</p>
                    <Badge className="text-[var(--danger)]">{conflict.severity}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--muted)]">{conflict.message}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--muted)]">No active contradictions detected in the current review set.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
