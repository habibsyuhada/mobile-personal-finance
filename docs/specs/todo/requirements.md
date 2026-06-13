# Requirements — Modul Todo List

Status: Draft v1
Tanggal: 2026-06-13
Bagian dari: Personal Super App (lihat `../platform/`)

## 1. Ringkasan

Modul manajemen tugas (to-do) di dalam platform. Pengguna membuat tugas,
mengelompokkannya ke daftar/proyek, menandai selesai, menetapkan tenggat &
prioritas, dan melihat tugas hari ini / akan datang. Offline-first, data lokal,
namespace tabel `todo_`.

## 2. Definisi

- **Task**: satu item pekerjaan dengan judul, status selesai, prioritas,
  tenggat, catatan, dan sub-tugas opsional.
- **List/Project**: wadah pengelompokan task (mis. "Kerja", "Pribabi",
  "Belanja").
- **Subtask**: item kecil di dalam sebuah task (checklist).
- **Due date**: tanggal/waktu tenggat task.
- **Priority**: tingkat kepentingan (none, low, medium, high).

## 3. Persyaratan Fungsional (EARS)

### T1 — Task dasar

- T1.1 The system shall mengizinkan pembuatan task dengan minimal judul.
- T1.2 The system shall mengizinkan task memiliki: catatan, prioritas, due date
  (opsional, dengan/atau tanpa waktu), list, dan tag.
- T1.3 When pengguna menandai task selesai, the system shall menyimpan status
  selesai beserta waktu penyelesaian.
- T1.4 The system shall mengizinkan mengedit dan menghapus task.
- T1.5 The system shall mengizinkan menandai task sebagai "penting/bintang".

### T2 — List / Project

- T2.1 The system shall menyediakan list default "Inbox" untuk task tanpa list.
- T2.2 The system shall mengizinkan membuat, mengubah nama, mewarnai, dan
  menghapus list.
- T2.3 When sebuah list dihapus, the system shall memindahkan task-nya ke Inbox
  (bukan menghapus task) kecuali pengguna memilih hapus semua.
- T2.4 The system shall menampilkan jumlah task aktif per list.

### T3 — Subtask

- T3.1 The system shall mengizinkan menambah subtask (checklist) pada task.
- T3.2 The system shall menampilkan progres subtask (mis. 2/5 selesai).
- T3.3 Where semua subtask selesai, the system shall tidak otomatis menyelesaikan
  task induk (kecuali pengguna melakukannya), namun menampilkannya sebagai siap.

### T4 — Pengorganisasian & Tampilan

- T4.1 The system shall menyediakan tampilan: "Hari Ini" (due hari ini + telat),
  "Akan Datang" (terurut due), "Semua", dan per-list.
- T4.2 The system shall mengizinkan pengurutan berdasarkan due date, prioritas,
  atau urutan manual.
- T4.3 The system shall mengizinkan penyaringan: selesai/belum, prioritas, tag.
- T4.4 The system shall mendukung pencarian task berdasarkan judul/catatan.
- T4.5 While ada task yang telat (overdue), the system shall menandainya secara
  visual.

### T5 — Tag

- T5.1 The system shall mengizinkan pemberian beberapa tag pada task.
- T5.2 The system shall mengizinkan memfilter task berdasarkan tag.

### T6 — Tugas Berulang (Recurring)

- T6.1 The system shall mengizinkan task berulang (harian/mingguan/bulanan/
  kustom interval).
- T6.2 When task berulang ditandai selesai, the system shall membuat kemunculan
  berikutnya sesuai aturan.

### T7 — Pengingat (opsional, bergantung layanan platform)

- T7.1 Where layanan notifikasi platform tersedia, the system shall mengizinkan
  pengingat pada due date task melalui notifikasi lokal.
- T7.2 If layanan notifikasi belum tersedia, the system shall tetap berfungsi
  penuh tanpa pengingat (degradasi anggun).

### T8 — Data

- T8.1 The system shall menyimpan seluruh data di SQLite lokal (tabel `todo_*`).
- T8.2 While aplikasi ditutup-buka, the system shall mempertahankan data.
- T8.3 The system shall menyertakan data Todo dalam ekspor/impor platform.

## 4. Persyaratan Non-Fungsional

- NFR1 (Performa) Daftar 1.000+ task tetap mulus (virtualized).
- NFR2 (Konsistensi) Memakai token desain & komponen platform.
- NFR3 (Lokalisasi) Teks dalam English (default) & Bahasa Indonesia
  (namespace `todo.*`).
- NFR4 (Portabilitas) Repository pattern, siap migrasi ke Postgres.

## 5. Asumsi

- A1 Notifikasi lokal mungkin belum ada di MVP platform; T7 bersifat opsional.
- A2 Single user; tidak ada kolaborasi/berbagi list di MVP.

## 6. Di Luar Cakupan MVP

- Kolaborasi/berbagi, penugasan ke orang lain.
- Lampiran berkas pada task.
- Sinkronisasi cloud.

## 7. Kriteria Penerimaan

- Bisa membuat, menyelesaikan, mengedit, menghapus task.
- Tampilan "Hari Ini" dan "Akan Datang" akurat; overdue ditandai.
- List & subtask berfungsi; data persisten lintas buka-tutup.
- Teks tersedia EN & ID.
