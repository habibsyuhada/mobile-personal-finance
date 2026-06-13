# Requirements — Modul Habit Tracker

Status: Draft v1
Tanggal: 2026-06-13
Bagian dari: Personal Super App (lihat `../platform/`)

## 1. Ringkasan

Modul pelacak kebiasaan. Pengguna mendefinisikan kebiasaan (mis. "Minum air",
"Olahraga", "Baca 10 halaman"), menjadwalkannya (harian/hari tertentu/x kali per
minggu), lalu mencatat penyelesaian harian. Modul menampilkan streak (rentetan),
kalender riwayat, dan statistik. Offline-first, namespace tabel `habit_`.

## 2. Definisi

- **Habit**: kebiasaan yang ingin dibangun/dihentikan, punya jadwal & target.
- **Schedule**: aturan kapan habit perlu dilakukan (tiap hari, hari tertentu,
  N kali/minggu).
- **Log/Check-in**: catatan bahwa habit dilakukan pada tanggal tertentu (dan,
  untuk habit terukur, berapa banyak).
- **Streak**: jumlah hari/periode berturut-turut habit terpenuhi.
- **Target/Goal**: nilai sasaran untuk habit terukur (mis. 8 gelas air).

## 3. Persyaratan Fungsional (EARS)

### H1 — Definisi Habit

- H1.1 The system shall mengizinkan pembuatan habit dengan: nama, ikon, warna,
  tipe, dan jadwal.
- H1.2 The system shall mendukung dua tipe habit:
  - **Binary** (selesai/tidak), mis. "Olahraga".
  - **Quantifiable** (terukur dengan target & satuan), mis. "Minum 8 gelas".
- H1.3 The system shall mengizinkan menandai habit sebagai "good" (dibangun)
  atau "bad" (dikurangi/dihindari).
- H1.4 The system shall mengizinkan mengedit, mengarsipkan, dan menghapus habit.

### H2 — Penjadwalan

- H2.1 The system shall mendukung jadwal: setiap hari; hari tertentu dalam
  minggu (mis. Sen/Rab/Jum); N kali per minggu.
- H2.2 The system shall menentukan habit mana yang "jatuh tempo hari ini"
  berdasarkan jadwalnya.
- H2.3 Where habit tidak dijadwalkan hari ini, the system shall tidak
  menghitungnya sebagai terlewat pada hari itu.

### H3 — Check-in / Log Harian

- H3.1 When pengguna menandai habit selesai untuk suatu tanggal, the system
  shall menyimpan log (binary) atau menambah jumlah (quantifiable).
- H3.2 The system shall mengizinkan membatalkan/mengubah check-in pada tanggal
  tertentu (termasuk mengisi hari sebelumnya).
- H3.3 For habit quantifiable, the system shall menganggap hari "terpenuhi" bila
  jumlah >= target.
- H3.4 The system shall menampilkan daftar habit "Hari Ini" beserta status
  check-in dan progres (untuk quantifiable).

### H4 — Streak & Statistik

- H4.1 The system shall menghitung current streak dan best streak per habit
  berdasarkan jadwal (hari tidak terjadwal tidak memutus streak).
- H4.2 The system shall menampilkan persentase penyelesaian (mis. 30 hari
  terakhir) per habit.
- H4.3 The system shall menampilkan kalender heatmap riwayat per habit.
- H4.4 The system shall menampilkan ringkasan harian (berapa habit selesai dari
  yang terjadwal).

### H5 — Pengingat (opsional, bergantung layanan platform)

- H5.1 Where layanan notifikasi platform tersedia, the system shall mengizinkan
  pengingat harian per habit pada waktu tertentu.
- H5.2 If layanan notifikasi belum tersedia, the system shall tetap berfungsi
  penuh tanpa pengingat.

### H6 — Data

- H6.1 The system shall menyimpan data di SQLite lokal (tabel `habit_*`).
- H6.2 While aplikasi ditutup-buka, the system shall mempertahankan data.
- H6.3 The system shall menyertakan data Habit dalam ekspor/impor platform.

## 4. Persyaratan Non-Fungsional

- NFR1 (Performa) Perhitungan streak & heatmap efisien untuk 1+ tahun riwayat.
- NFR2 (Konsistensi) Memakai token desain & komponen platform.
- NFR3 (Lokalisasi) EN (default) & ID (namespace `habit.*`).
- NFR4 (Portabilitas) Repository pattern, siap migrasi ke Postgres.
- NFR5 (Akurasi waktu) Tanggal lokal pengguna jadi acuan "hari"; hindari
  pergeseran zona waktu (simpan tanggal sebagai `YYYY-MM-DD` lokal).

## 5. Asumsi

- A1 Notifikasi lokal mungkin belum ada di MVP platform; H5 opsional.
- A2 "Hari" mengikuti tanggal lokal perangkat.

## 6. Di Luar Cakupan MVP

- Habit dengan jadwal berbasis jam ganda per hari.
- Sosial/akuntabilitas, berbagi progres.
- Sinkronisasi cloud.

## 7. Kriteria Penerimaan

- Bisa membuat habit binary & quantifiable dengan jadwal.
- "Hari Ini" menampilkan habit terjadwal; check-in tersimpan & bisa diubah.
- Current/best streak dan persentase 30 hari benar; heatmap tampil.
- Data persisten lintas buka-tutup; tersedia EN & ID.
