# Requirements — Platform (Personal Super App Shell)

Status: Draft v1
Tanggal: 2026-06-13

## 1. Ringkasan

Mengubah aplikasi dari "aplikasi keuangan" menjadi **personal super app**
multi-modul. Lapisan **platform/shell** menyediakan:

- **Launcher**: layar pertama berisi grid ikon modul (mirip home screen desktop).
- **Module registry**: daftar modul terdaftar beserta metadata (nama, ikon,
  warna, rute, status aktif).
- **Infrastruktur bersama**: koneksi DB, migrasi, tema, i18n, pengaturan global.
- **Navigasi antar-modul**: masuk ke modul, kembali ke launcher.

Keuangan (Personal Finance) menjadi **modul pertama**, bukan keseluruhan app.

## 2. Definisi

- **Modul (Module)**: unit fitur mandiri (Keuangan, Todo, Habit) dengan UI,
  data, dan rute sendiri.
- **Launcher**: halaman beranda platform berisi kartu/ikon tiap modul.
- **Module registry**: struktur data terpusat yang mendaftarkan semua modul.
- **Shell**: kerangka aplikasi (routing root, providers, tema) yang memuat
  launcher dan modul.

## 3. Persyaratan Fungsional (EARS)

### P1 — Launcher

- P1.1 When aplikasi dibuka dan inisialisasi selesai, the system shall
  menampilkan launcher berisi grid modul yang tersedia.
- P1.2 The system shall menampilkan tiap modul sebagai kartu dengan ikon, nama
  (terlokalisasi), dan warna khas modul.
- P1.3 When pengguna mengetuk kartu modul, the system shall membuka modul
  tersebut pada rute awalnya.
- P1.4 The system shall menyediakan cara kembali ke launcher dari dalam modul
  (mis. tombol/tab "Home Platform" atau gesture back dari root modul).
- P1.5 Where sebuah modul dinonaktifkan, the system shall menyembunyikannya dari
  launcher.
- P1.6 The system shall menampilkan header/sapaan ringkas di launcher (mis.
  nama app dan tanggal), tanpa data sensitif.

### P2 — Module Registry

- P2.1 The system shall mendefinisikan tiap modul melalui satu deskriptor:
  `id`, `name` (key i18n), `icon`, `color`, `routePath`, `enabled`, `order`.
- P2.2 The system shall membangun routing root secara otomatis dari registry,
  sehingga menambah modul baru tidak mengharuskan mengubah komponen launcher.
- P2.3 The system shall mengizinkan tiap modul mendaftarkan inisialisasinya
  sendiri (migrasi tabel, seed) melalui hook lifecycle yang dipanggil shell.
- P2.4 The system shall memuat modul secara malas (lazy/code-split) bila
  memungkinkan untuk menjaga waktu start tetap cepat.

### P3 — Navigasi & Routing

- P3.1 The system shall memberi tiap modul namespace rute sendiri
  (`/m/finance/...`, `/m/todo/...`, `/m/habit/...`).
- P3.2 While berada di dalam modul, the system shall mempertahankan navigasi
  internal modul (tab/stack) tanpa bocor ke modul lain.
- P3.3 When pengguna menekan back di layar root sebuah modul, the system shall
  kembali ke launcher.

### P4 — Pengaturan Global vs Modul

- P4.1 The system shall menyediakan Pengaturan global (tema, bahasa, mata uang
  default, kelola data, konfigurasi AI) yang dapat diakses dari launcher.
- P4.2 Where sebuah modul punya pengaturan khusus, the system shall menempatkan
  pengaturan itu di dalam modul, bukan di pengaturan global.

### P5 — Data & Migrasi Bersama

- P5.1 The system shall memakai satu database SQLite untuk semua modul.
- P5.2 The system shall memberi tiap modul prefix tabel unik (`fin_`, `todo_`,
  `habit_`) untuk mencegah benturan nama.
- P5.3 The system shall menjalankan migrasi seluruh modul secara berurutan dan
  idempoten saat start; kegagalan satu migrasi tidak boleh merusak data modul
  lain (transaksional per langkah).
- P5.4 The system shall mempertahankan seluruh data lintas buka-tutup aplikasi.

### P6 — Ekspor/Impor Lintas Modul

- P6.1 The system shall mengekspor data seluruh modul dalam satu berkas cadangan
  (JSON) yang menyertakan penanda modul & versi skema.
- P6.2 When mengimpor, the system shall memulihkan data per modul sesuai
  penanda, dan mengabaikan/menandai modul yang tidak dikenal dengan aman.

### P7 — Konsistensi & Lokalisasi

- P7.1 The system shall memakai satu set token desain (warna, radius, spacing)
  untuk semua modul.
- P7.2 The system shall menyediakan teks platform (judul launcher, label umum)
  dalam English (default) dan Bahasa Indonesia; tiap modul menambah namespace
  i18n-nya sendiri.

## 4. Persyaratan Non-Fungsional

- NFR1 (Performa) Launcher tampil < 1 detik setelah inisialisasi; membuka modul
  terasa instan (lazy-load di balik transisi).
- NFR2 (Skalabilitas) Menambah modul ke-N tidak menambah kompleksitas pada modul
  lain; perubahan terbatas pada registry + folder modul baru.
- NFR3 (Isolasi) Bug atau kegagalan migrasi satu modul tidak boleh
  membuat seluruh aplikasi gagal dimuat; shell harus menangani kegagalan modul
  secara anggun.
- NFR4 (Portabilitas) Lapisan data tetap memakai repository pattern agar siap
  migrasi ke backend Postgres.
- NFR5 (Konsistensi) Semua modul mengikuti panduan UI yang sama.

## 5. Asumsi

- A1 Jumlah modul tumbuh bertahap; tidak ada marketplace/instalasi dinamis di
  MVP (modul di-bundle bersama aplikasi).
- A2 Single user per device tetap berlaku; tidak ada pemisahan data antar-user.

## 6. Di Luar Cakupan (untuk fase platform ini)

- Marketplace modul / unduh modul dinamis dari server.
- Sinkronisasi cloud multi-device.
- Antar-modul saling memanggil data (mis. Habit otomatis bikin transaksi).
  Integrasi lintas modul dipertimbangkan setelah 3+ modul stabil.

## 7. Kriteria Penerimaan

- Membuka app menampilkan launcher dengan minimal 3 kartu modul (Keuangan, Todo,
  Habit).
- Mengetuk kartu membuka modul yang benar; back kembali ke launcher.
- Menambah modul baru cukup dengan menambahkan deskriptor + folder modul, tanpa
  menyentuh modul lain.
- Data semua modul persisten lintas buka-tutup.
