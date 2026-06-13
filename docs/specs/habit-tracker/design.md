# Design — Modul Habit Tracker

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `../platform/design.md`

## 1. Posisi dalam Platform

```ts
// src/modules/habit/module.ts
export const habitModule: ModuleDescriptor = {
  id: 'habit',
  nameKey: 'module.habit.name',
  icon: flameOutline,
  color: '#f59e0b',
  order: 3,
  enabled: true,
  routePath: '/m/habit',
  component: () => import('./HabitRoot'),
  migrations: HABIT_MIGRATIONS,
  init: undefined,               // tidak perlu seed
  tables: ['habit_habits', 'habit_logs'],
};
```

## 2. Struktur Folder

```
src/modules/habit/
├─ module.ts
├─ HabitRoot.tsx
├─ pages/
│  ├─ TodayHabitsPage.tsx
│  ├─ HabitDetailPage.tsx     # streak, heatmap, statistik
│  └─ AllHabitsPage.tsx
├─ components/
│  ├─ HabitForm.tsx
│  ├─ HabitItem.tsx           # baris check-in di Today
│  └─ Heatmap.tsx             # kalender heatmap
├─ data/
│  ├─ models.ts
│  └─ repositories/   (interface + SqliteHabitRepository)
├─ services/          (HabitService: jadwal, streak, statistik)
├─ store/             (useHabitStore)
└─ i18n/              (habit.* en + id)
```

## 3. Model Data (DDL, prefix `habit_`)

```sql
CREATE TABLE habit_habits (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  icon         TEXT,
  color        TEXT,
  type         TEXT NOT NULL,          -- 'binary' | 'quantifiable'
  polarity     TEXT NOT NULL DEFAULT 'good',  -- 'good' | 'bad'
  target       REAL,                   -- untuk quantifiable (mis. 8)
  unit         TEXT,                   -- mis. 'gelas', 'menit'
  -- jadwal:
  schedule_type TEXT NOT NULL,         -- 'daily' | 'weekdays' | 'times_per_week'
  weekdays     TEXT,                   -- CSV '1,3,5' (1=Sen..7=Min) utk 'weekdays'
  times_per_week INTEGER,              -- utk 'times_per_week'
  reminder_time TEXT,                  -- 'HH:mm' opsional
  archived     INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE habit_logs (
  id        TEXT PRIMARY KEY,
  habit_id  TEXT NOT NULL REFERENCES habit_habits(id) ON DELETE CASCADE,
  log_date  TEXT NOT NULL,             -- 'YYYY-MM-DD' lokal (NFR5)
  amount    REAL NOT NULL DEFAULT 1,   -- binary=1; quantifiable=jumlah
  created_at TEXT NOT NULL,
  UNIQUE (habit_id, log_date)          -- satu log per habit per hari
);
CREATE INDEX idx_habit_logs_habit ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_date ON habit_logs(log_date);
```

Catatan: untuk quantifiable, satu baris per (habit, hari) dengan `amount`
diakumulasi (UPSERT menambah). "Terpenuhi" jika `amount >= target`.

## 4. Tipe Domain (TS)

```ts
export type HabitType = 'binary' | 'quantifiable';
export type Polarity = 'good' | 'bad';
export type ScheduleType = 'daily' | 'weekdays' | 'times_per_week';

export interface Habit {
  id; name; icon?; color?;
  type: HabitType; polarity: Polarity;
  target?: number | null; unit?: string | null;
  scheduleType: ScheduleType; weekdays?: number[] | null; timesPerWeek?: number | null;
  reminderTime?: string | null; archived: boolean; sortOrder: number;
}
export interface HabitLog { id; habitId; logDate: string; amount: number; }
export interface HabitProgressToday {
  habit: Habit; done: boolean; amount: number; target?: number | null;
}
export interface HabitStats {
  currentStreak: number; bestStreak: number; completionRate30: number;
}
```

## 5. Logika Jadwal & Streak (inti modul)

### 5.1 Apakah jatuh tempo pada tanggal D?
- `daily` → selalu.
- `weekdays` → bila weekday(D) ∈ `weekdays`.
- `times_per_week` → tidak terikat hari tertentu; "jatuh tempo" diperlakukan
  fleksibel: dihitung per minggu (target N check-in/minggu). Untuk tampilan
  "Hari Ini", tampilkan bila minggu berjalan belum mencapai N.

### 5.2 Terpenuhi pada tanggal D?
- binary → ada log di D.
- quantifiable → `amount(D) >= target`.

### 5.3 Streak (current/best)
- Untuk `daily`/`weekdays`: telusuri mundur dari hari ini hanya pada
  **hari terjadwal**; hari terjadwal yang tidak terpenuhi memutus streak; hari
  tidak terjadwal dilewati (tidak memutus). (H4.1, H2.3)
- Untuk `times_per_week`: streak dihitung dalam satuan minggu (minggu yang
  mencapai target = lanjut).
- Implementasi di `HabitService` murni (tanpa I/O) agar mudah di-unit-test
  dengan data log buatan.

### 5.4 Statistik
- completionRate30 = (#hari terpenuhi pada hari terjadwal dalam 30 hari) /
  (#hari terjadwal dalam 30 hari).

## 6. Repository & Service

- `IHabitRepository`: CRUD habit; upsert/hapus log; ambil log rentang tanggal;
  ambil habit aktif.
- `SqliteHabitRepository` implements interface.
- `HabitService`: tentukan "due today", hitung streak & statistik, akumulasi
  check-in quantifiable, validasi (nama wajib, target>0 bila quantifiable).

## 7. State (Zustand)

`useHabitStore`: cache habits, progress hari ini (map habitId→status), dan log
untuk detail/heatmap. Aksi check-in memanggil service lalu refresh ringkasan.

## 8. UI / Navigasi

`HabitRoot` = `IonTabs`:
- **Today** — habit terjadwal hari ini; tiap baris `HabitItem`:
  - binary: tombol lingkaran centang.
  - quantifiable: kontrol +/- dengan progress menuju target & satuan.
  - tampilkan mini-streak (🔥 N).
- **All** — semua habit (termasuk arsip), tap → detail.
- **Detail** — heatmap kalender, current/best streak, completionRate, edit.

Komponen:
- `HabitForm` (modal): nama, ikon, warna, tipe (binary/quantifiable + target/
  unit), polarity, jadwal (daily/weekdays/times_per_week), reminder time.
- `Heatmap`: grid 7×N (mingguan), warna intensitas dari amount/target; reuse
  warna habit.

Reuse platform: token desain, avatar ikon bulat, segment pill, FAB, modal form.

## 9. Reminder (opsional)

Jika layanan notifikasi platform ada: jadwalkan notifikasi harian pada
`reminder_time` untuk habit terjadwal; reschedule saat jadwal/waktu berubah;
batalkan saat diarsip/dihapus. Tanpa layanan → lewati (H5.2).

## 10. Penanganan Waktu (NFR5)

- "Hari" = tanggal lokal perangkat, disimpan `YYYY-MM-DD`.
- Util `todayLocalDate()` dan helper minggu (Senin sebagai awal, konsisten
  dengan util tanggal keuangan) ditaruh di `src/lib/`.

## 11. i18n

Namespace `habit.*` (mis. `habit.today`, `habit.newHabit`, `habit.streak`,
`habit.type.binary`, `habit.schedule.daily`, dst.) EN & ID; `module.habit.name`
di namespace platform.

## 12. Pengujian

- Unit (fokus): `HabitService.streak` untuk daily/weekdays/times_per_week
  dengan berbagai pola log; "due today"; completionRate; akumulasi
  quantifiable. Logika murni → mudah diuji tanpa DB.
- Integrasi: check-in hari ini → progress & streak terupdate; isi hari lampau →
  heatmap & streak menyesuaikan.

## 13. Ekspor/Impor

Daftarkan `tables` (`habit_habits`, `habit_logs`) di deskriptor; importer
platform memulihkan dari bundle.
