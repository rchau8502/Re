import type { ProjectArchive } from '../core/types';
import { restoreProject, exportProject } from '../backup';
export interface ProjectRepository { load(id: string): ProjectArchive | null; save(data: ProjectArchive): void }
export interface KeyValueStore { getItem(key: string): string | null; setItem(key: string, value: string): void }
// Browser is the first adapter. Domain services never access localStorage.
export class LocalProjectRepository implements ProjectRepository {
  constructor(private storage: KeyValueStore) {}
  load(id: string) { const raw = this.storage.getItem('story-world-v1:'+id); return raw === null ? null : restoreProject(raw); }
  save(data: ProjectArchive) { this.storage.setItem('story-world-v1:'+data.project.id, exportProject(data)); }
}
