# Tasks — Platform (Personal Super App Shell)

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `design.md`

Konvensi: `[ ]` belum, `[~]` berjalan, `[x]` selesai. Tiap task menyebut
requirement (mis. `P2.2`). Urutan menjaga aplикasi tetap bisa jalan tiap langkah.

---

## Fase A — Fondasi Platform (tanpa memindah kode keuangan)

- [ ] A1 Buat `src/platform/types.ts` (ModuleDescriptor, ModuleMigration). (P2.1)
- [ ] A2 Buat `src/platform/registry.ts` dengan array MODULES + helper
      `enabledModules`, `getModule`. (P2.2)
- [ ] A3 Buat `ModuleDescriptor` sementara untuk finance yang menunjuk ke
      komponen `Tabs` keuangan saat ini (adapter), rute `/m/finance`. (P3.1)
- [ ] A4 Tulis `src/app/Launcher.tsx`: grid kartu dari `enabledModules()`. (P1.1–P1.3)
- [ ] A5 Tulis `src/app/ModuleHost.tsx`: baca `:moduleId`, render komponen modul
      (lazy), error boundary + fallback. (P3, NFR3)
- [ ] A6 Ubah `App.tsx`: root router `/` (Launcher), `/m/:moduleId` (ModuleHost),
      `/settings` (global). Redirect lama `/tabs/*` → `/m/finance/*`. (P3)
- [ ] A7 i18n: tambah namespace `launcher.*` dan `module.*` (en + id). (P7.2)
- [ ] A8 Tombol pengaturan global di launcher → `/settings`. (P4.1)
- [ ] A9 Verifikasi: buka app → launcher tampil → ketuk Keuangan → modul jalan →
      back ke launcher. Build & test hijau.

Acceptance: launcher berfungsi; modul keuangan tetap utuh diakses lewat `/m/finance`.

## Fase B — Generalisasi Infrastruktur

- [ ] B1 Pindahkan runner migrasi ke `src/platform/migrations.ts` dengan
      namespacing versi per modul di tabel `meta`. (P5.3, design §8)
- [ ] B2 Ubah `meta` agar menyimpan `schema_version.<moduleId>`; tulis migrasi
      core terpisah. (P5)
- [ ] B3 Pindahkan settings global (tema, bahasa, currency, AI) ke
      `src/platform/settings/`. (P4.1)
- [ ] B4 Generalisasi ekspor/impor jadi format multi-modul berlabel. (P6)
- [ ] B5 Unit test: runner migrasi multi-modul (naik per modul, idempoten);
      importer routing per modul.

Acceptance: migrasi & settings tidak lagi terikat ke modul keuangan; ekspor
menghasilkan bundle multi-modul.

## Fase C — Pindahkan Modul Keuangan ke Struktur Modul

- [ ] C1 Pindahkan `pages/`, `services/`, `store/`, `data/repositories`,
      `data/seed`, `i18n` keuangan ke `src/modules/finance/`. (design §3)
- [ ] C2 Buat `modules/finance/module.ts` (descriptor lengkap + migrations +
      init untuk recurring + seed kategori + tables). (P2.1, P2.3)
- [ ] C3 Beri prefix tabel modul baru `fin_` (opsional untuk tabel lama; putuskan:
      pertahankan nama lama untuk hindari migrasi data, atau rename + migrasi).
- [ ] C4 Update import path & alias. Pastikan build bersih.
- [ ] C5 Regression test: semua fungsi keuangan tetap jalan.

Acceptance: modul keuangan hidup di `modules/finance/`, didaftarkan via registry,
tidak ada regresi.

## Fase D — Pemolesan Launcher & Navigasi

- [ ] D1 Animasi/transisi buka modul; state kembali ke launcher konsisten. (P1.4, P3.3)
- [ ] D2 Header launcher (nama app + tanggal). (P1.6)
- [ ] D3 Sembunyikan modul `enabled=false`. (P1.5)
- [ ] D4 Aksesibilitas: label kartu, target sentuh, kontras. (NFR5)

Acceptance: launcher rapi, mulus, dan aksesibel.

## Fase E — Tambah Modul Baru (mengacu spec masing-masing)

- [ ] E1 Implementasi modul Todo List → lihat `specs/todo/tasks.md`.
- [ ] E2 Implementasi modul Habit Tracker → lihat `specs/habit-tracker/tasks.md`.
- [ ] E3 Daftarkan keduanya di registry; verifikasi muncul di launcher.

Acceptance: tiga modul tampil di launcher dan berfungsi independen.

---

## Catatan Eksekusi

- Fase A memberi "kemenangan cepat": launcher tampil tanpa membongkar kode
  keuangan. Refactor besar (Fase C) dilakukan setelah fondasi stabil.
- Pertahankan skema tabel keuangan lama bila memungkinkan untuk menghindari
  migrasi data berisiko; cukup catat kepemilikan tabel di deskriptor.
- Jalankan build + test di akhir tiap fase.
