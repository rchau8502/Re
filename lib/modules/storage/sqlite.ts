// Node 22.13+ infrastructure adapter; never imported by browser/domain modules.
import { DatabaseSync } from 'node:sqlite';
import type { ProjectArchive } from '../core/types';
import type { ProjectRepository } from './index';
import { exportProject, restoreProject } from '../backup';
export class SQLiteProjectRepository implements ProjectRepository {
  private db: DatabaseSync;
  constructor(filename: string) {
    this.db = new DatabaseSync(filename);
    // Refuse existing CanonKeep/other databases. This is an additive, separate store.
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
    if (tables.some(row => !['story_projects','story_schema'].includes(String(row.name)))) {
      this.db.close(); throw Error('Use a separate story-world database; existing databases are never migrated by this adapter');
    }
    this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
    this.db.exec('CREATE TABLE IF NOT EXISTS story_schema (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL);');
    const version = this.db.prepare('SELECT version FROM story_schema WHERE id=1').get();
    if (version && version.version !== 1) { this.db.close(); throw Error('Unsupported story-world database version'); }
    this.db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE IF NOT EXISTS story_projects (id TEXT PRIMARY KEY, archive TEXT NOT NULL);
      INSERT OR IGNORE INTO story_schema(id,version) VALUES(1,1);
      COMMIT;`);
  }
  load(id: string): ProjectArchive | null {
    const row = this.db.prepare('SELECT archive FROM story_projects WHERE id=?').get(id);
    return row ? restoreProject(String(row.archive)) : null;
  }
  save(data: ProjectArchive): void {
    // Serialize and validate before starting a write; malformed imports cannot replace data.
    const archive = exportProject(data);
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare('INSERT INTO story_projects(id,archive) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET archive=excluded.archive').run(data.project.id, archive);
      this.db.exec('COMMIT');
    } catch(error) { this.db.exec('ROLLBACK'); throw error; }
  }
  close(): void { this.db.close(); }
}
