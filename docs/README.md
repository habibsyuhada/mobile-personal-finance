# Spec Index — Personal Super App

Aplikasi personal multi-modul (Android, React + Ionic + Capacitor, offline-first,
SQLite lokal, tanpa login). Saat pertama dibuka, pengguna memilih modul dari
**launcher** mirip grid ikon di desktop. Tiap modul berdiri sendiri tetapi
berbagi shell, tema, penyimpanan, dan i18n yang sama.

## Status Modul

| Modul | Status | Spec |
|---|---|---|
| Platform (shell + launcher) | Selesai (Fase A–E) | [specs/platform](./specs/platform/) |
| Keuangan (Personal Finance) | Selesai (MVP) | [specs/personal-finance](./specs/personal-finance/) |
| Todo List | Selesai (MVP) | [specs/todo](./specs/todo/) |
| Habit Tracker | Selesai (MVP) | [specs/habit-tracker](./specs/habit-tracker/) |
| Kandidat modul lain | Backlog | [specs/module-catalog.md](./specs/module-catalog.md) |

## Cara membaca

1. Mulai dari [specs/platform/requirements.md](./specs/platform/requirements.md)
   untuk memahami konsep multi-modul, launcher, dan module registry.
2. [specs/platform/design.md](./specs/platform/design.md) menjelaskan bagaimana
   modul didaftarkan, dirutekan, dan berbagi infrastruktur (DB, tema, i18n).
3. Tiap modul punya tiga dokumen: `requirements.md` (apa & kenapa, format EARS),
   `design.md` (bagaimana), `tasks.md` (langkah implementasi).
4. [specs/module-catalog.md](./specs/module-catalog.md) berisi ide modul masa
   depan beserta prioritas dan estimasi kompleksitas.

## Prinsip lintas modul

- **Offline-first**: semua data di SQLite lokal, persisten lintas buka-tutup.
- **Module isolation**: tiap modul punya tabel & namespace sendiri (prefix
  `todo_`, `habit_`, dst.). Keuangan menyimpan nama tabel lama demi data
  pengguna yang sudah ada (lihat `specs/platform/tasks.md` C3).
- **Shared infrastructure**: satu koneksi DB, satu sistem migrasi (runner
  per-modul), satu tema, satu i18n, satu pengaturan global.
- **Repository pattern**: lapisan data tiap modul memakai interface agar bisa
  diganti ke backend (PostgreSQL) di fase lanjutan tanpa membongkar UI.
- **Konsistensi UI**: semua modul memakai komponen & token desain yang sama.
- **Module registry**: menambah modul = tambah satu deskriptor di
  `src/platform/registry.ts` + folder modul baru. Launcher & routing otomatis
  membaca dari sini (NFR2).

## Riwayat keputusan penting

- MVP tanpa login, single user per device.
- PostgreSQL ditunda ke fase lanjutan; MVP pakai SQLite lokal.
- English jadi bahasa default; tersedia Bahasa Indonesia.
- Aplikasi bertransformasi dari "aplikasi keuangan" menjadi "personal super app"
  multi-modul. Keuangan menjadi modul pertama, bukan keseluruhan aplikasi.
