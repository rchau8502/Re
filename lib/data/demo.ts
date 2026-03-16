import type {
  AppUser,
  Campaign,
  CanonCandidate,
  ChangeLogEntry,
  ChatMessage,
  ChatThread,
  ConflictAlert,
  Entity,
  EventRecord,
  Rule,
  Secret,
  SessionRecord,
  SourceDocument,
  World,
  WorldWorkspace,
} from '@/lib/types';

const now = '2026-03-15T10:00:00.000Z';

export const demoUser: AppUser = {
  id: '9d6c4a10-cc15-44d2-8420-0b58f2d1b001',
  email: 'demo@canonkeep.app',
  displayName: 'Demo Keeper',
  createdAt: now,
  updatedAt: now,
};

export const demoWorld: World = {
  id: 'b68fbff5-94dc-4ec5-b977-13a97111a001',
  ownerId: demoUser.id,
  title: 'The Ember Archive',
  genre: 'Arcane science fantasy',
  tone: 'Mythic, tense, investigative',
  techLevel: 'Late industrial with relic biotech',
  systemType: 'Runic heat-magic bound to memory vaults',
  description:
    'A continent-spanning archive-city sits above geothermal catacombs. Memories can be etched into ember-glass, powering industry, religion, and war while slowly altering the keepers who handle them.',
  createdAt: now,
  updatedAt: now,
};

export const demoCampaign: Campaign = {
  id: '81fb1b7b-a719-4f20-8ba8-f90f4f4a1001',
  worldId: demoWorld.id,
  title: 'Ashes of the Ninth Vault',
  summary:
    'A GM-facing campaign about a breached memory vault, rival guilds, and a saint whose preserved recollections may be fabricated.',
  status: 'active',
  timelineBranch: 'Prime Continuity',
  visibility: 'gm_only',
  createdAt: now,
  updatedAt: now,
};

export const demoEntities: Entity[] = [
  {
    id: 'e001',
    worldId: demoWorld.id,
    entityType: 'character',
    name: 'Mira Vey',
    aliases: ['The Indexer of Cinders'],
    shortDescription: 'A state archivist who can hear fractures in forged memories.',
    longDescription:
      'Mira serves the Ember Archive as a senior indexer, tasked with verifying whether recorded memories have been tampered with before they are committed to public canon.',
    tags: ['archivist', 'investigator', 'state'],
    status: 'active',
    visibility: 'public',
    sourceConfidence: 0.94,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e002',
    worldId: demoWorld.id,
    entityType: 'faction',
    name: 'The Kiln Synod',
    aliases: ['Synod'],
    shortDescription: 'Priest-engineers who regulate legal memory burning.',
    longDescription:
      'The Synod claims only sanctioned furnaces can convert human memory into civic fuel. Their monopoly makes them politically untouchable and spiritually feared.',
    tags: ['religion', 'industry', 'state power'],
    status: 'dominant',
    visibility: 'public',
    sourceConfidence: 0.96,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e003',
    worldId: demoWorld.id,
    entityType: 'location',
    name: 'Vault Nine',
    aliases: ['The Unsealed Vault'],
    shortDescription: 'A sealed memory chamber beneath the city that recently failed.',
    longDescription:
      'Vault Nine once stored witness-memories from the War of Glass. Its rupture released unstable recollections into the lower wards, causing identity bleed and political panic.',
    tags: ['vault', 'disaster site', 'mystery'],
    status: 'quarantined',
    visibility: 'public',
    sourceConfidence: 0.91,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'e004',
    worldId: demoWorld.id,
    entityType: 'power_system_element',
    name: 'Ember-Glass Imprint',
    aliases: ['Imprint'],
    shortDescription: 'A stabilized fragment of memory used as magical fuel and evidence.',
    longDescription:
      'Imprints are distilled recollections set into heat-reactive glass. They can power machinery, preserve testimony, or be weaponized to overwrite a witness with a stronger narrative.',
    tags: ['magic', 'fuel', 'evidence'],
    status: 'core concept',
    visibility: 'public',
    sourceConfidence: 0.99,
    createdAt: now,
    updatedAt: now,
  },
];

export const demoRules: Rule[] = [
  {
    id: 'r001',
    worldId: demoWorld.id,
    title: 'Only witnessed memory can be burned into civic furnaces',
    category: 'Magic Law',
    statement:
      'Industrial furnaces require ember-glass imprints taken from witnessed, not imagined, events or the furnace destabilizes.',
    exceptions: ['Outlaw black-kilns can use dreams at catastrophic personal cost.'],
    consequences: ['Witnesses are politically valuable.', 'Forgery investigations are existential threats.'],
    examples: ['Court records are backed by sworn memory-burns.'],
    visibility: 'public',
    canonLevel: 'core',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'r002',
    worldId: demoWorld.id,
    title: 'Repeated handling of imprints rewrites the keeper',
    category: 'Psychological Cost',
    statement:
      'Archivists exposed to concentrated imprints begin inheriting mannerisms and emotions from the memories they catalog.',
    exceptions: ['Silver-lined gloves delay but do not prevent imprint seepage.'],
    consequences: ['Experienced archivists become unreliable narrators.'],
    examples: ['Mira sometimes speaks with the cadence of dead generals.'],
    visibility: 'public',
    canonLevel: 'core',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoEvents: EventRecord[] = [
  {
    id: 'ev001',
    worldId: demoWorld.id,
    campaignId: demoCampaign.id,
    title: 'The Breach of Vault Nine',
    summary: 'A containment failure released unstable witness-memories into the lower city.',
    dateInWorld: 'Year 612, Thaw Moon 14',
    orderIndex: 100,
    causes: ['A forged saint-memory entered the vault network.', 'Safeguard sigils were altered during maintenance.'],
    consequences: ['Identity bleed in the Cinder Lanes', 'Emergency Synod occupation of archive district'],
    participants: ['The Kiln Synod', 'Mira Vey', 'Unknown saboteur'],
    visibility: 'public',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoSecrets: Secret[] = [
  {
    id: 's001',
    worldId: demoWorld.id,
    relatedEntityId: 'e002',
    relatedEventId: 'ev001',
    secretText:
      'The Kiln Synod staged a limited breach to justify emergency control of the archive, but the forged saint-memory escaped their own containment model.',
    visibility: 'gm_only',
    revealConditions: 'Reveal after the party secures a maintenance ledger from the black-kilns.',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoSessions: SessionRecord[] = [
  {
    id: 'ss001',
    campaignId: demoCampaign.id,
    title: 'Session 3: Echoes in the Furnace Hall',
    summary: 'The party tracked a false witness line into a public ritual furnace.',
    recap:
      'Players discovered that a civic furnace briefly projected memories from an impossible battle, implying forged testimony had entered the legal archive system.',
    decisions: ['Protect Mira rather than expose her publicly.', 'Delay confronting the Synod until more evidence is gathered.'],
    revealedLore: ['Furnaces can reject imagined memories violently.', 'Vault Nine stores war recollections that were never meant for public review.'],
    changedWorldState: ['Synod investigators now monitor the party.'],
    nextHooks: ['Intercept the convoy carrying salvaged vault glass.', 'Interview an amnesiac mason from the maintenance crew.'],
    createdAt: now,
    updatedAt: now,
  },
];

export const demoDocuments: SourceDocument[] = [
  {
    id: 'd001',
    worldId: demoWorld.id,
    title: 'Vault Nine Incident Notes',
    fileType: 'markdown',
    storagePath: 'demo/vault-nine-notes.md',
    extractedText:
      'Vault Nine failed during a sanctioned maintenance cycle. Witness reports conflict on whether the first fracture began in the saint reliquary conduit or in the lower heat sinks.',
    accessScope: 'private',
    parseStatus: 'parsed',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoThread: ChatThread = {
  id: 't001',
  worldId: demoWorld.id,
  title: 'Foundational canon build',
  mode: 'creator',
  createdAt: now,
  updatedAt: now,
};

export const demoMessages: ChatMessage[] = [
  {
    id: 'm001',
    threadId: demoThread.id,
    role: 'assistant',
    content:
      'Let’s lock the tension at the center of this setting. If memory is fuel, who benefits most from deciding which memories become legal truth?',
    metadata: { mode: 'creator' },
    createdAt: now,
  },
  {
    id: 'm002',
    threadId: demoThread.id,
    role: 'user',
    content:
      'The priest-engineers of the Kiln Synod control the furnaces, and they claim unsanctioned memory-burning can fracture a city district.',
    metadata: {},
    createdAt: now,
  },
  {
    id: 'm003',
    threadId: demoThread.id,
    role: 'assistant',
    content:
      'That gives the Synod both a safety argument and a censorship tool. I would next define what proof looks like in this world: how does an ordinary citizen know a memory was verified instead of manufactured?',
    metadata: { mode: 'creator' },
    createdAt: now,
  },
];

export const demoCandidates: CanonCandidate[] = [
  {
    id: 'c001',
    worldId: demoWorld.id,
    sourceMessageId: 'm002',
    candidateType: 'entity',
    candidatePayload: {
      title: 'Faction: The Kiln Synod',
      summary: 'Priest-engineers regulate legal memory burning and claim black-market use can fracture districts.',
      operation: 'create',
      record: {
        entityType: 'faction',
        name: 'The Kiln Synod',
        shortDescription: 'Priest-engineers who regulate legal memory burning.',
        longDescription:
          'The Synod frames its furnace monopoly as public safety, giving it both industrial control and narrative authority.',
        visibility: 'public',
        tags: ['religion', 'infrastructure', 'state power'],
      },
    },
    reviewStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'c002',
    worldId: demoWorld.id,
    sourceMessageId: 'm002',
    candidateType: 'rule',
    candidatePayload: {
      title: 'Rule: Unsanctioned memory-burning can destabilize districts',
      summary: 'The setting treats unsanctioned memory-burning as a real civic threat.',
      operation: 'create',
      record: {
        title: 'Unsanctioned memory-burning can fracture a district',
        category: 'Civic Hazard',
        statement:
          'Black-market furnaces or illegal burns risk large-scale instability when memory energy is not properly contained.',
        visibility: 'public',
      },
    },
    reviewStatus: 'pending',
    createdAt: now,
    updatedAt: now,
  },
];

export const demoChangelog: ChangeLogEntry[] = [
  {
    id: 'cl001',
    worldId: demoWorld.id,
    objectType: 'event',
    objectId: 'ev001',
    oldValueSummary: 'Vault Nine classified as sealed and stable.',
    newValueSummary: 'Vault Nine marked quarantined after active breach.',
    reason: 'Campaign setup established the breach as the inciting disaster.',
    changedBy: demoUser.id,
    sourceMessageId: 'm002',
    createdAt: now,
  },
];

export const demoConflicts: ConflictAlert[] = [
  {
    label: 'Potential rule overlap',
    severity: 'warning',
    message:
      'The candidate about unsanctioned memory-burning may overlap with the existing furnace-verification rule. Merge if they describe the same law, or keep both if one is an enforcement consequence.',
    relatedRecordIds: ['r001', 'c002'],
  },
];

export const demoWorkspace: WorldWorkspace = {
  world: demoWorld,
  threads: [demoThread],
  messages: demoMessages,
  entities: demoEntities,
  rules: demoRules,
  events: demoEvents,
  secrets: demoSecrets,
  campaigns: [demoCampaign],
  sessions: demoSessions,
  changelog: demoChangelog,
  documents: demoDocuments,
  candidates: demoCandidates,
  conflicts: demoConflicts,
};

export const demoWorlds = [demoWorld];
