# Tasks — Modul Habit Tracker

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `design.md`, `../platform/`

Prasyarat: Fase A–C platform selesai (registry, launcher, struktur modul).
Disarankan modul Todo lebih dulu agar util penjadwalan bersama sudah diekstrak.

Konvensi: `[ ]` belum, `[~]` berjalan, `[x]` selesai. Tiap task menyebut
requirement (mis. `H1.1`).

---

## Fase 1 — Fondasi Modul

- [ ] 1.1 Buat folder `src/modules/habit/` sesuai struktur design §2.
- [ ] 1.2 Tulis DDL `HABIT_MIGRATIONS` (`habit_habits`, `habit_logs`). (H6.1)
- [ ] 1.3 Tipe domain `data/models.ts`. (design §4)
- [ ] 1.4 `IHabitRepository` + `SqliteHabitRepository` (CRUD habit, upsert log,
      ambil log rentang). (NFR4)
- [ ] 1.5 Helper tanggal lokal di `src/lib/` (`todayLocalDate`, minggu). (NFR5)
- [ ] 1.6 Daftarkan `habitModule` di registry platform. (platform P2.2)
- [ ] 1.7 `HabitRoot` tab kosong + rute `/m/habit`. Verifikasi di launcher.

Acceptance: modul Habit tampil di launcher, terbuka, tabel dibuat.

## Fase 2 — Definisi Habit (Form & CRUD)

- [ ] 2.1 `HabitService` validasi (nama wajib; target>0 utk quantifiable). (H1.1, H1.2)
- [ ] 2.2 `HabitForm`: nama, ikon, warna, tipe (binary/quantifiable + target/
      unit), polarity, jadwal (daily/weekdays/times_per_week), reminder time. (H1.1–H1.3, H2.1)
- [ ] 2.3 CRUD + arsip + hapus. (H1.4)
- [ ] 2.4 `AllHabitsPage`.

Acceptance: bisa membuat kedua tipe habit dengan berbagai jadwal.

## Fase 3 — Check-in Harian (Today)

- [ ] 3.1 Logika "due today" per schedule_type di `HabitService`. (H2.2, H2.3)
- [ ] 3.2 `TodayHabitsPage` + `HabitItem`:
      - binary: tombol centang. (H3.1)
      - quantifiable: kontrol +/- dgn progres ke target. (H3.1, H3.3)
- [ ] 3.3 Upsert log (akumulasi quantifiable), batal/ubah check-in termasuk
      hari lampau. (H3.2)
- [ ] 3.4 Ringkasan harian (selesai/terjadwal). (H4.4)
- [ ] 3.5 Store `useHabitStore`.

Acceptance: check-in tersimpan & bisa diubah; Today akurat sesuai jadwal.

## Fase 4 — Streak & Statistik

- [ ] 4.1 Hitung current/best streak (daily/weekdays/times_per_week). (H4.1)
- [ ] 4.2 completionRate 30 hari. (H4.2)
- [ ] 4.3 Tampilkan mini-streak di Today + statistik di Detail.
- [ ] 4.4 Unit test streak (berbagai pola & jadwal) — prioritas tinggi. (NFR1)

Acceptance: streak & persentase benar untuk semua tipe jadwal (terbukti via test).

## Fase 5 — Heatmap & Detail

- [ ] 5.1 `Heatmap` kalender (intensitas dari amount/target). (H4.3)
- [ ] 5.2 `HabitDetailPage` (heatmap + streak + rate + edit).

Acceptance: heatmap & detail tampil benar.

## Fase 6 — i18n, Reminder (opsional), Polish

- [ ] 6.1 Kamus `habit.*` (EN + ID) + `module.habit.name`. (NFR3)
- [ ] 6.2 (Opsional) Notifikasi harian bila layanan platform ada. (H5)
- [ ] 6.3 Empty states, loading, aksesibilitas. (NFR2)
- [ ] 6.4 Pastikan data ikut ekspor/impor platform. (H6.3)

Acceptance: terlokalisasi, rapi, datanya ikut backup.

## Fase 7 — Verifikasi

- [ ] 7.1 Build + seluruh test hijau.
- [ ] 7.2 Uji persistensi (buka-tutup) di Android, termasuk perhitungan streak
      lintas hari (ubah tanggal perangkat untuk uji manual).
- [ ] 7.3 Tinjau kriteria penerimaan requirements §7.

---

## Catatan

- Logika streak/jadwal harus **murni** (input: daftar log + definisi habit;
  output: angka) agar mudah diuji tanpa DB — ini bagian paling rawan bug.
- Hati-hati zona waktu: selalu pakai tanggal lokal `YYYY-MM-DD` (NFR5).
- Reuse util tanggal/penjadwalan bersama Todo & keuangan bila memungkinkan.
