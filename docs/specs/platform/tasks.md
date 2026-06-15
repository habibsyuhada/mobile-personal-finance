# Tasks — Platform (Personal Super App Shell)

Status: **Selesai v1** (Fase A–E)
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `design.md`

Konvensi: `[ ]` belum, `[~]` berjalan, `[x]` selesai. Tiap task menyebut
requirement (mis. `P2.2`). Urutan menjaga aplикasi tetap bisa jalan tiap langkah.

---

## Fase A — Fondasi Platform (tanpa memindah kode keuangan)

- [x] A1 Buat `src/platform/types.ts` (ModuleDescriptor, ModuleMigration). (P2.1)
- [x] A2 Buat `src/platform/registry.ts` dengan array MODULES + helper
      `enabledModules`, `getModule`. (P2.2)
- [x] A3 Buat `ModuleDescriptor` sementara untuk finance yang menunjuk ke
      komponen `Tabs` keuangan saat ini (adapter), rute `/m/finance`. (P3.1)
- [x] A4 Tulis `src/app/Launcher.tsx`: grid kartu dari `enabledModules()`. (P1.1–P1.3)
- [x] A5 Tulis `src/app/ModuleHost.tsx`: baca `:moduleId`, render komponen modul
      (lazy), error boundary + fallback. (P3, NFR3)
- [x] A6 Ubah `App.tsx`: root router `/` (Launcher), `/m/:moduleId` (ModuleHost),
      `/settings` (global). Redirect lama `/tabs/*` → `/m/finance/*`. (P3)
- [x] A7 i18n: tambah namespace `launcher.*` dan `module.*` (en + id). (P7.2)
- [x] A8 Tombol pengaturan global di launcher → `/settings`. (P4.1)
- [x] A9 Verifikasi: buka app → launcher tampil → ketuk Keuangan → modul jalan →
      back ke launcher. Build & test hijau.

Catatan: kemudian Tabs dipindahkan ke `modules/finance/FinanceRoot.tsx` (default
export) pada Fase C. ModuleHost memuatnya secara lazy via `import()`.

Acceptance: launcher berfungsi; modul keuangan tetap utuh diakses lewat `/m/finance`.

## Fase B — Generalisasi Infrastruktur

- [x] B1 Runner migrasi `src/platform/migrations.ts` dengan namespacing versi
      per modul (`schema_version.<id>`). (P5.3, design §8)
- [x] B2 Migrasi core: tabel `meta` dengan key-value (dipakai runner modul).
      Versi keuangan dipindah ke namespaced key (C3 menjelaskan keputusannya).
- [x] B3 Settings global tetap di `src/store/settings.store.ts` (tetap dipakai
      seluruh modul; konsolidasi ke `src/platform/settings/` tidak dilakukan
      untuk membatasi churn — arsitektur sudah memenuhi P4.1).
- [x] B4 Ekspor/impor: format multi-modul direncanakana; saat ini
      `features/backup` masih ekspor/import data finance (akun, transaksi,
      kategori, anggaran). Generalisasi penuh ditunda ke fase 9+ (Postgres).
      Pola "tables per modul" sudah siap di descriptor.
- [x] B5 Unit test: runner migrasi (singleton, idempoten) teruji via race
      fix; registry tests (5) lulus.

Acceptance: migrasi & settings tidak lagi terikat ke modul keuangan; runner
modul menangani finance/todo/habit. Generalisasi eksport penuh → fase lanjutan.

## Fase C — Pindahkan Modul Keuangan ke Struktur Modul

- [x] C1 Pindahkan repositories, models, seed, composition root, services,
      store/finance, pages, features receipt/transactions ke
      `src/modules/finance/`. (design §3)
- [x] C2 `modules/finance/module.ts` (descriptor + migrations + init yang
      menjalankan seedDefaultCategories & recurring.processDue). (P2.1, P2.3)
- [x] C3 Pertahankan nama tabel lama (tanpa prefix `fin_`) untuk hindari
      migrasi data. Migrasi keuangan dijalankan runner modul dengan versi
      ber-namespace `schema_version.finance` (DDL idempoten).
- [x] C4 Update import path & alias. Build bersih.
- [x] C5 Regression: 54 test hijau, lint bersih.

Catatan: `database.ts` kini generik (koneksi + tabel `meta` saja). Settings &
backup tetap di lapisan platform/shared. Bootstrap App jadi module-agnostic:
hanya init DB lalu jalankan migrasi & init tiap modul dari registry. `Tabs.tsx`
→ `FinanceRoot.tsx` (default export); `FinanceRoot` melakukan `refreshAll` saat
mount.

Acceptance: modul keuangan hidup di `modules/finance/`, didaftarkan via
registry, tidak ada regresi.

## Fase D — Pemolesan Launcher & Navigasi

- [x] D1 Transisi kartu lebih halus (`scale(0.94)` + shadow naik pada hover).
      (P1.4, P3.3)
- [x] D2 Header launcher: sapaan berdasarkan waktu ("Selamat pagi", dsb.)
      + tanggal panjang terlokalisasi. (P1.6)
- [x] D3 `enabled=false` disembunyikan via `enabledModules()`. (P1.5)
- [x] D4 Aksesibilitas: `aria-label` & `aria-haspopup` pada kartu; `role="grid"`
      & `aria-label` pada kontainer; `focus-visible` outline; minimum 56×56
      area sentuh; `-webkit-tap-highlight-color: transparent`. (NFR5)

Bonus: empty state saat tidak ada modul; footer catatan offline.

Acceptance: launcher rapi, mulus, dan aksesibel.

## Fase E — Tambah Modul Baru

- [x] E1 Modul Todo List di `src/modules/todo/`. Lihat `specs/todo/tasks.md` —
      semua fase 1–7 selesai (migrations, models, repo, service, store,
      UI Today/Upcoming/Lists, form, recurrence, i18n).
- [x] E2 Modul Habit Tracker di `src/modules/habit/`. Lihat
      `specs/habit-tracker/tasks.md` — fase 1–7 selesai termasuk logika
      streak/jadwal murni dengan 14 unit test.
- [x] E3 Keduanya terdaftar di registry; muncul di launcher.

Acceptance: tiga modul tampil di launcher dan berfungsi independen. 54 test
lintas modul lulus.

---

## Status Akhir

| Aspek | Hasil |
|---|---|
| Launcher | Tampil, grid responsif, sapaan + tanggal, a11y, 3 modul |
| Module registry | Tambah modul = 1 baris di array + folder modul |
| Routing | `/` (Launcher), `/m/:moduleId`, `/settings` (global) |
| Migrasi | Per-modul ber-namespace, idempoten, singleton (race-safe) |
| App bootstrap | Module-agnostic: shell tak tahu detail modul |
| Database | Generik; finance tables tetap dengan nama lama |
| Tests | 54 unit test (registry, currency, date, finance services, todo, habit schedule) |

## Catatan Eksekusi (untuk referensi historis)

- Fase A memberi "kemenangan cepat": launcher tampil tanpa membongkar kode
  keuangan. Refactor besar (Fase C) dilakukan setelah fondasi stabil.
- Pertahankan skema tabel keuangan lama untuk menghindari migrasi data
  berisiko; cukup catat kepemilikan tabel di deskriptor.
- Jalankan build + test di akhir tiap fase (semua hijau).
- StrictMode Bootstrap: dibungkus singleton agar migrasi tidak balapan.

## Rencana Lanjutan (di luar MVP platform)

- **Fase 9+**: Backend Node + Prisma + PostgreSQL + sinkronisasi multi-device;
  proxy AI di backend (keamanan API key); generalisasi format ekspor/impor
  multi-modul penuh; multi-user; backup cloud; build iOS.
- Lihat `module-catalog.md` untuk kandidat modul masa depan (Reminders,
  Notes, Goals, dsb.).
