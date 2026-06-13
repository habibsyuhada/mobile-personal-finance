import type { ModuleMigration } from '@/platform/types';

export const TODO_MIGRATIONS: ModuleMigration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS todo_lists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        is_default INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS todo_tasks (
        id TEXT PRIMARY KEY,
        list_id TEXT NOT NULL REFERENCES todo_lists(id),
        title TEXT NOT NULL,
        note TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        due_at TEXT,
        has_time INTEGER NOT NULL DEFAULT 0,
        starred INTEGER NOT NULL DEFAULT 0,
        completed INTEGER NOT NULL DEFAULT 0,
        completed_at TEXT,
        sort_order INTEGER NOT NULL DEFAULT 0,
        recur_freq TEXT,
        recur_interval INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE INDEX IF NOT EXISTS idx_todo_tasks_due ON todo_tasks(due_at);`,
      `CREATE INDEX IF NOT EXISTS idx_todo_tasks_list ON todo_tasks(list_id);`,
      `CREATE INDEX IF NOT EXISTS idx_todo_tasks_completed ON todo_tasks(completed);`,
      `CREATE TABLE IF NOT EXISTS todo_subtasks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0
      );`,
      `CREATE INDEX IF NOT EXISTS idx_todo_subtasks_task ON todo_subtasks(task_id);`,
      `CREATE TABLE IF NOT EXISTS todo_tags (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS todo_task_tags (
        task_id TEXT NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
        tag_id TEXT NOT NULL REFERENCES todo_tags(id) ON DELETE CASCADE,
        PRIMARY KEY (task_id, tag_id)
      );`,
    ],
  },
];
