import { documentTextOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import type { Database } from '@/data/db/database';
import { NOTES_MIGRATIONS } from './data/migrations';
import { SqliteNotesRepository } from './data/notes.repo';
import { NotesService } from './services/notes.service';

async function seedNotesDefaults(db: Database): Promise<void> {
  const repo = new SqliteNotesRepository(db);
  const svc = new NotesService(repo);
  await svc.ensurePersonalNotebook();
}

export const notesModule: ModuleDescriptor = {
  id: 'notes',
  nameKey: 'module.notes.name',
  icon: documentTextOutline,
  color: '#10b981',
  order: 4,
  enabled: true,
  routePath: '/m/notes',
  component: () => import('./NotesRoot'),
  migrations: NOTES_MIGRATIONS,
  init: seedNotesDefaults,
  tables: [
    'notes_pages',
    'notes_blocks',
    'notes_attachments',
    'notes_databases',
    'notes_db_rows',
    'notes_db_views',
  ],
};
