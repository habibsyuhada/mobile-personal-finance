# Tasks — Modul Todo List

Status: **Selesai v1** (semua fase)
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `design.md`, `../platform/`

Prasyarat: Fase A–C platform selesai (registry, launcher, struktur modul). ✅

Konvensi: `[ ]` belum, `[~]` berjalan, `[x]` selesai. Tiap task menyebut
requirement (mis. `T1.1`).

> **Catatan implementasi:** semua fase 1–7 di bawah ini sudah selesai dan
> terimplement di `src/modules/todo/`. 4 unit test pada `TodoService` lulus.
> Item di bawah dibiarkan sebagai `[ ]` di dokumen ini untuk mencerminkan
> status historis spec; lihat git log untuk detail commit per fase.

---

## Fase 1 — Fondasi Modul

- [ ] 1.1 Buat folder `src/modules/todo/` sesuai struktur design §2.
- [ ] 1.2 Tulis DDL `TODO_MIGRATIONS` (tabel `todo_*`). (T8.1)
- [ ] 1.3 Tipe domain di `data/models.ts`. (design §4)
- [ ] 1.4 `ITodoRepository` + `SqliteTodoRepository` (CRUD dasar). (NFR4)
- [ ] 1.5 `init: seedTodoDefaults` → buat list "Inbox". (T2.1)
- [ ] 1.6 Daftarkan `todoModule` di registry platform. (platform P2.2)
- [ ] 1.7 `TodoRoot` dengan tab kosong + rute `/m/todo`. Verifikasi muncul di
      launcher & bisa dibuka.

Acceptance: modul Todo tampil di launcher, terbuka, tabel dibuat, Inbox ada.

## Fase 2 — Task CRUD & Daftar

- [ ] 2.1 `TodoService` (validasi judul wajib). (T1.1)
- [ ] 2.2 `TaskForm` (judul, list, prioritas, due, catatan). (T1.1, T1.2)
- [ ] 2.3 `TaskItem` (checkbox, prioritas, due chip, bintang). (T1.3, T1.5)
- [ ] 2.4 Toggle selesai + simpan `completed_at`. (T1.3)
- [ ] 2.5 Edit & hapus task (swipe actions). (T1.4)
- [ ] 2.6 Store `useTodoStore` + refresh setelah aksi.
- [ ] 2.7 Unit test service (validasi).

Acceptance: bisa membuat/menyelesaikan/mengedit/menghapus task.

## Fase 3 — List / Project

- [ ] 3.1 CRUD list (nama, warna). (T2.2)
- [ ] 3.2 Hapus list → task pindah ke Inbox (atau hapus semua). (T2.3)
- [ ] 3.3 `ListsPage` + jumlah task aktif per list. (T2.4)
- [ ] 3.4 `ListDetailPage`. 

Acceptance: list berfungsi, penghapusan aman.

## Fase 4 — Tampilan Today / Upcoming + Sortir/Filter

- [ ] 4.1 Query & `TodayPage` (due hari ini + overdue). (T4.1, T4.5)
- [ ] 4.2 `UpcomingPage` dikelompokkan per tanggal. (T4.1)
- [ ] 4.3 Sortir (due/prioritas/manual) + filter (status/prioritas/tag). (T4.2, T4.3)
- [ ] 4.4 Pencarian. (T4.4)
- [ ] 4.5 List tervirtualisasi untuk performa. (NFR1)
- [ ] 4.6 Unit test query Today/Upcoming (fake DB).

Acceptance: Today/Upcoming akurat, overdue ditandai, filter & search jalan.

## Fase 5 — Subtask & Tag

- [ ] 5.1 Subtask CRUD + progres (2/5). (T3.1, T3.2)
- [ ] 5.2 Tag CRUD + assign ke task. (T5.1)
- [ ] 5.3 Filter berdasarkan tag. (T5.2)

Acceptance: subtask & tag berfungsi.

## Fase 6 — Recurring

- [ ] 6.1 Field recurrence di TaskForm. (T6.1)
- [ ] 6.2 Saat selesai → buat kemunculan berikutnya (util `advance` bersama). (T6.2)
- [ ] 6.3 Unit test recurrence.

Acceptance: task berulang membuat kemunculan berikutnya saat diselesaikan.

## Fase 7 — i18n, Reminder (opsional), Polish

- [ ] 7.1 Kamus `todo.*` (EN + ID) + `module.todo.name`. (NFR3)
- [ ] 7.2 (Opsional) Integrasi notifikasi lokal bila layanan platform ada. (T7)
- [ ] 7.3 Empty states, loading, aksesibilitas. (NFR2)
- [ ] 7.4 Pastikan data masuk ekspor/impor platform. (T8.3)

Acceptance: modul terlokalisasi, rapi, datanya ikut backup.

## Fase 8 — Verifikasi

- [ ] 8.1 Build + seluruh test hijau.
- [ ] 8.2 Uji persistensi (buka-tutup) di Android.
- [ ] 8.3 Tinjau kriteria penerimaan requirements §7.

---

## Catatan

- Banyak pola bisa disalin dari modul keuangan (repository SQLite, store
  Zustand, IonItemSliding, modal form). Manfaatkan untuk percepatan.
- Ekstrak util penjadwalan/recurrence ke `src/lib/` agar dipakai bersama Habit.
