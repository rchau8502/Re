insert into public.users (id, email, display_name)
values ('9d6c4a10-cc15-44d2-8420-0b58f2d1b001', 'demo@canonkeep.app', 'Demo Keeper')
on conflict (id) do update set email = excluded.email, display_name = excluded.display_name;

insert into public.worlds (id, owner_id, title, genre, tone, tech_level, system_type, description)
values (
  'b68fbff5-94dc-4ec5-b977-13a97111a001',
  '9d6c4a10-cc15-44d2-8420-0b58f2d1b001',
  'The Ember Archive',
  'Arcane science fantasy',
  'Mythic, tense, investigative',
  'Late industrial with relic biotech',
  'Runic heat-magic bound to memory vaults',
  'A continent-spanning archive-city sits above geothermal catacombs. Memories can be etched into ember-glass, powering industry, religion, and war while slowly altering the keepers who handle them.'
)
on conflict (id) do update set title = excluded.title;

insert into public.chat_threads (id, world_id, title, mode)
values ('8fda7cb0-4108-4860-b12d-82d1f7b1d111', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'Foundational canon build', 'creator')
on conflict (id) do nothing;

insert into public.chat_messages (id, thread_id, role, content, metadata)
values
  ('0c95c31d-bff8-4f99-b5ae-9348c33d2001', '8fda7cb0-4108-4860-b12d-82d1f7b1d111', 'assistant', 'Let’s lock the tension at the center of this setting. If memory is fuel, who benefits most from deciding which memories become legal truth?', '{"mode":"creator"}'),
  ('0c95c31d-bff8-4f99-b5ae-9348c33d2002', '8fda7cb0-4108-4860-b12d-82d1f7b1d111', 'user', 'The priest-engineers of the Kiln Synod control the furnaces, and they claim unsanctioned memory-burning can fracture a city district.', '{}'::jsonb),
  ('0c95c31d-bff8-4f99-b5ae-9348c33d2003', '8fda7cb0-4108-4860-b12d-82d1f7b1d111', 'assistant', 'That gives the Synod both a safety argument and a censorship tool. I would next define what proof looks like in this world: how does an ordinary citizen know a memory was verified instead of manufactured?', '{"mode":"creator"}')
on conflict (id) do nothing;

insert into public.entities (id, world_id, entity_type, name, aliases, short_description, long_description, tags, status, visibility, source_confidence)
values
  ('d125a8cb-c144-46ef-aebd-88f289e93001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'character', 'Mira Vey', '["The Indexer of Cinders"]', 'A state archivist who can hear fractures in forged memories.', 'Mira serves the Ember Archive as a senior indexer, tasked with verifying whether recorded memories have been tampered with before they are committed to public canon.', '["archivist", "investigator", "state"]', 'active', 'public', 0.940),
  ('d125a8cb-c144-46ef-aebd-88f289e93002', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'faction', 'The Kiln Synod', '["Synod"]', 'Priest-engineers who regulate legal memory burning.', 'The Synod claims only sanctioned furnaces can convert human memory into civic fuel. Their monopoly makes them politically untouchable and spiritually feared.', '["religion", "industry", "state power"]', 'dominant', 'public', 0.960),
  ('d125a8cb-c144-46ef-aebd-88f289e93003', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'location', 'Vault Nine', '["The Unsealed Vault"]', 'A sealed memory chamber beneath the city that recently failed.', 'Vault Nine once stored witness-memories from the War of Glass. Its rupture released unstable recollections into the lower wards, causing identity bleed and political panic.', '["vault", "disaster site", "mystery"]', 'quarantined', 'public', 0.910),
  ('d125a8cb-c144-46ef-aebd-88f289e93004', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'power_system_element', 'Ember-Glass Imprint', '["Imprint"]', 'A stabilized fragment of memory used as magical fuel and evidence.', 'Imprints are distilled recollections set into heat-reactive glass. They can power machinery, preserve testimony, or be weaponized to overwrite a witness with a stronger narrative.', '["magic", "fuel", "evidence"]', 'core concept', 'public', 0.990)
on conflict (id) do nothing;

insert into public.rules (id, world_id, title, category, statement, exceptions, consequences, examples, visibility, canon_level)
values
  ('71eb4abc-29d3-4fdd-ab75-810226d5f001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'Only witnessed memory can be burned into civic furnaces', 'Magic Law', 'Industrial furnaces require ember-glass imprints taken from witnessed, not imagined, events or the furnace destabilizes.', '["Outlaw black-kilns can use dreams at catastrophic personal cost."]', '["Witnesses are politically valuable.", "Forgery investigations are existential threats."]', '["Court records are backed by sworn memory-burns."]', 'public', 'core'),
  ('71eb4abc-29d3-4fdd-ab75-810226d5f002', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'Repeated handling of imprints rewrites the keeper', 'Psychological Cost', 'Archivists exposed to concentrated imprints begin inheriting mannerisms and emotions from the memories they catalog.', '["Silver-lined gloves delay but do not prevent imprint seepage."]', '["Experienced archivists become unreliable narrators."]', '["Mira sometimes speaks with the cadence of dead generals."]', 'public', 'core')
on conflict (id) do nothing;

insert into public.campaigns (id, world_id, title, summary, status, timeline_branch, visibility)
values ('81fb1b7b-a719-4f20-8ba8-f90f4f4a1001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'Ashes of the Ninth Vault', 'A GM-facing campaign about a breached memory vault, rival guilds, and a saint whose preserved recollections may be fabricated.', 'active', 'Prime Continuity', 'gm_only')
on conflict (id) do nothing;

insert into public.events (id, world_id, campaign_id, title, summary, date_in_world, order_index, causes, consequences, participants, visibility)
values ('96263fe1-c332-44bf-b620-39f09fd0f001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', '81fb1b7b-a719-4f20-8ba8-f90f4f4a1001', 'The Breach of Vault Nine', 'A containment failure released unstable witness-memories into the lower city.', 'Year 612, Thaw Moon 14', 100, '["A forged saint-memory entered the vault network.", "Safeguard sigils were altered during maintenance."]', '["Identity bleed in the Cinder Lanes", "Emergency Synod occupation of archive district"]', '["The Kiln Synod", "Mira Vey", "Unknown saboteur"]', 'public')
on conflict (id) do nothing;

insert into public.secrets (id, world_id, related_entity_id, related_event_id, secret_text, visibility, reveal_conditions)
values ('35abcba8-88bf-4d0e-84e0-c149cba47001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'd125a8cb-c144-46ef-aebd-88f289e93002', '96263fe1-c332-44bf-b620-39f09fd0f001', 'The Kiln Synod staged a limited breach to justify emergency control of the archive, but the forged saint-memory escaped their own containment model.', 'gm_only', 'Reveal after the party secures a maintenance ledger from the black-kilns.')
on conflict (id) do nothing;

insert into public.sessions (id, campaign_id, title, summary, recap, decisions, revealed_lore, changed_world_state, next_hooks)
values ('0fbd4e66-53fd-4dd3-b2dd-2f83b31f4001', '81fb1b7b-a719-4f20-8ba8-f90f4f4a1001', 'Session 3: Echoes in the Furnace Hall', 'The party tracked a false witness line into a public ritual furnace.', 'Players discovered that a civic furnace briefly projected memories from an impossible battle, implying forged testimony had entered the legal archive system.', '["Protect Mira rather than expose her publicly.", "Delay confronting the Synod until more evidence is gathered."]', '["Furnaces can reject imagined memories violently.", "Vault Nine stores war recollections that were never meant for public review."]', '["Synod investigators now monitor the party."]', '["Intercept the convoy carrying salvaged vault glass.", "Interview an amnesiac mason from the maintenance crew."]')
on conflict (id) do nothing;

insert into public.source_documents (id, world_id, title, file_type, storage_path, extracted_text, access_scope, parse_status)
values ('f370b20b-b0e3-431c-a54a-4fb4195f5001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'Vault Nine Incident Notes', 'markdown', 'demo/vault-nine-notes.md', 'Vault Nine failed during a sanctioned maintenance cycle. Witness reports conflict on whether the first fracture began in the saint reliquary conduit or in the lower heat sinks.', 'private', 'parsed')
on conflict (id) do nothing;

insert into public.canon_candidates (id, world_id, source_message_id, candidate_type, candidate_payload, review_status)
values
  ('220a5f12-89b1-470c-b24b-f74971cc6001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', '0c95c31d-bff8-4f99-b5ae-9348c33d2002', 'entity', '{"title":"Faction: The Kiln Synod","summary":"Priest-engineers regulate legal memory burning and claim black-market use can fracture districts.","operation":"create","record":{"entityType":"faction","name":"The Kiln Synod","shortDescription":"Priest-engineers who regulate legal memory burning.","longDescription":"The Synod frames its furnace monopoly as public safety, giving it both industrial control and narrative authority.","visibility":"public","tags":["religion","infrastructure","state power"]}}', 'pending'),
  ('220a5f12-89b1-470c-b24b-f74971cc6002', 'b68fbff5-94dc-4ec5-b977-13a97111a001', '0c95c31d-bff8-4f99-b5ae-9348c33d2002', 'rule', '{"title":"Rule: Unsanctioned memory-burning can destabilize districts","summary":"The setting treats unsanctioned memory-burning as a real civic threat.","operation":"create","record":{"title":"Unsanctioned memory-burning can fracture a district","category":"Civic Hazard","statement":"Black-market furnaces or illegal burns risk large-scale instability when memory energy is not properly contained.","visibility":"public"}}', 'pending')
on conflict (id) do nothing;

insert into public.changelog (id, world_id, object_type, object_id, old_value_summary, new_value_summary, reason, changed_by, source_message_id)
values ('acbe4d52-7b7d-4cf8-b56a-a34c7f8a7001', 'b68fbff5-94dc-4ec5-b977-13a97111a001', 'event', '96263fe1-c332-44bf-b620-39f09fd0f001', 'Vault Nine classified as sealed and stable.', 'Vault Nine marked quarantined after active breach.', 'Campaign setup established the breach as the inciting disaster.', '9d6c4a10-cc15-44d2-8420-0b58f2d1b001', '0c95c31d-bff8-4f99-b5ae-9348c33d2002')
on conflict (id) do nothing;
