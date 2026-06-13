# Design — Modul Todo List

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `../platform/design.md`

## 1. Posisi dalam Platform

Modul `todo` didaftarkan di registry platform dengan deskriptor:

```ts
// src/modules/todo/module.ts
export const todoModule: ModuleDescriptor = {
  id: 'todo',
  nameKey: 'module.todo.name',
  icon: checkboxOutline,
  color: '#0ea5e9',
  order: 2,
  enabled: true,
  routePath: '/m/todo',
  component: () => import('./TodoRoot'),
  migrations: TODO_MIGRATIONS,
  init: seedTodoDefaults,        // buat list "Inbox" bila belum ada
  tables: ['todo_lists', 'todo_tasks', 'todo_subtasks', 'todo_task_tags', 'todo_tags'],
};
```

## 2. Struktur Folder

```
src/modules/todo/
├─ module.ts            # descriptor + migrations + init
├─ TodoRoot.tsx         # tab/stack internal modul
├─ pages/
│  ├─ TodayPage.tsx
│  ├─ UpcomingPage.tsx
│  ├─ ListsPage.tsx
│  └─ ListDetailPage.tsx
├─ components/
│  ├─ TaskForm.tsx
│  ├─ TaskItem.tsx
│  └─ ListForm.tsx
├─ data/
│  ├─ models.ts
│  └─ repositories/   (interface + SqliteTodoRepository)
├─ services/          (TodoService, recurrence)
├─ store/             (useTodoStore - Zustand)
└─ i18n/              (todo.* en + id)
```

## 3. Model Data (DDL, prefix `todo_`)

```sql
CREATE TABLE todo_lists (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  color       TEXT,
  icon        TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,   -- Inbox = 1
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE todo_tasks (
  id           TEXT PRIMARY KEY,
  list_id      TEXT NOT NULL REFERENCES todo_lists(id),
  title        TEXT NOT NULL,
  note         TEXT,
  priority     INTEGER NOT NULL DEFAULT 0,  -- 0 none,1 low,2 med,3 high
  due_at       TEXT,                        -- ISO; null = tanpa tenggat
  has_time     INTEGER NOT NULL DEFAULT 0,  -- 1 jika due_at termasuk jam
  starred      INTEGER NOT NULL DEFAULT 0,
  completed    INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,  -- untuk urutan manual
  -- recurrence (opsional)
  recur_freq   TEXT,                        -- daily|weekly|monthly|null
  recur_interval INTEGER,                   -- mis. tiap 2 minggu
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_todo_tasks_due ON todo_tasks(due_at);
CREATE INDEX idx_todo_tasks_list ON todo_tasks(list_id);
CREATE INDEX idx_todo_tasks_completed ON todo_tasks(completed);

CREATE TABLE todo_subtasks (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  completed  INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_todo_subtasks_task ON todo_subtasks(task_id);

CREATE TABLE todo_tags (
  id    TEXT PRIMARY KEY,
  name  TEXT NOT NULL,
  color TEXT
);

CREATE TABLE todo_task_tags (
  task_id TEXT NOT NULL REFERENCES todo_tasks(id) ON DELETE CASCADE,
  tag_id  TEXT NOT NULL REFERENCES todo_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
```

## 4. Tipe Domain (TS)

```ts
export type Priority = 0 | 1 | 2 | 3;
export interface TodoList { id; name; color?; icon?; isDefault; sortOrder; }
export interface Subtask { id; taskId; title; completed; sortOrder; }
export interface Tag { id; name; color?; }
export interface Task {
  id; listId; title; note?; priority: Priority;
  dueAt?: string | null; hasTime: boolean; starred: boolean;
  completed: boolean; completedAt?: string | null; sortOrder: number;
  recurFreq?: 'daily'|'weekly'|'monthly'|null; recurInterval?: number | null;
  subtasks?: Subtask[]; tags?: Tag[];
}
```

## 5. Repository & Service

- `ITodoRepository`: CRUD list, task, subtask, tag; query untuk Today/Upcoming;
  toggle complete; filter & search.
- `SqliteTodoRepository` implements interface (mengikuti pola modul keuangan).
- `TodoService`: validasi (judul wajib), aturan recurrence (saat selesai →
  buat kemunculan berikutnya via util tanggal bersama), logika "Hari Ini".

Query kunci:
- Today = `completed = 0 AND due_at <= endOfToday` (termasuk overdue).
- Upcoming = `completed = 0 AND due_at > endOfToday ORDER BY due_at`.
- Per-list = `list_id = ?` dengan opsi sembunyikan selesai.

## 6. State (Zustand)

`useTodoStore`: cache lists, tasks (per tampilan aktif), tags; aksi add/toggle/
update/remove yang memanggil service lalu refresh. Sumber kebenaran tetap SQLite.

## 7. UI / Navigasi

`TodoRoot` = `IonTabs` internal modul:
- **Today** — daftar task jatuh tempo + overdue; quick-add di atas.
- **Upcoming** — dikelompokkan per tanggal.
- **Lists** — daftar list + jumlah; tap → ListDetail.
- (Search & filter via toolbar.)

Komponen:
- `TaskItem`: checkbox bulat, judul, badge prioritas (warna), chip due (merah
  bila overdue), indikator subtask (2/5), bintang. Swipe untuk selesai/hapus.
- `TaskForm` (modal): judul, list, prioritas, due (IonDatetime), tag, subtask,
  recurrence, catatan.

Reuse dari platform: token desain, avatar/ikon bulat, segment pill, FAB,
`IonItemSliding` untuk aksi geser (pola sama seperti transaksi keuangan).

## 8. Recurrence

Gunakan util bersama `advance(date, freq, interval)` (generalisasi dari util
recurring keuangan). Saat task berulang ditandai selesai: jika punya `recur_freq`,
buat task baru dengan `due_at` berikutnya dan `completed = 0`.

## 9. Reminder (opsional)

Jika platform menyediakan layanan notifikasi (`@capacitor/local-notifications`):
- Saat menyimpan task dengan `due_at` + `has_time`, jadwalkan notifikasi.
- Saat selesai/hapus/ubah due, batalkan/reschedule.
Bila layanan tidak ada, lewati tanpa error (T7.2).

## 10. i18n

Namespace `todo.*` (mis. `todo.today`, `todo.upcoming`, `todo.newTask`,
`todo.priority.high`, dst.) di EN & ID. `module.todo.name` di namespace platform.

## 11. Pengujian

- Unit: TodoService (validasi, recurrence next-occurrence), query Today/Upcoming
  (memakai fake DB seperti pada test keuangan), progres subtask.
- Integrasi: buat task → tampil di Today bila due hari ini; selesai recurring →
  muncul kemunculan berikutnya.

## 12. Ekspor/Impor

Daftarkan `tables` modul di deskriptor; importer platform menulis ulang tabel
`todo_*` dari bundle.
