import type { ModuleMigration } from '@/platform/types';

export const HABIT_MIGRATIONS: ModuleMigration[] = [
  {
    version: 1,
    statements: [
      `CREATE TABLE IF NOT EXISTS habit_habits (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT,
        type TEXT NOT NULL,
        polarity TEXT NOT NULL DEFAULT 'good',
        target REAL,
        unit TEXT,
        schedule_type TEXT NOT NULL,
        weekdays TEXT,
        times_per_week INTEGER,
        reminder_time TEXT,
        archived INTEGER NOT NULL DEFAULT 0,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS habit_logs (
        id TEXT PRIMARY KEY,
        habit_id TEXT NOT NULL REFERENCES habit_habits(id) ON DELETE CASCADE,
        log_date TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        UNIQUE (habit_id, log_date)
      );`,
      `CREATE INDEX IF NOT EXISTS idx_habit_logs_habit ON habit_logs(habit_id);`,
      `CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(log_date);`,
    ],
  },
];
