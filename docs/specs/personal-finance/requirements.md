# Requirements — Aplikasi Pencatatan Keuangan Pribadi

Status: Draft v1
Tanggal: 2026-06-13

## 1. Ringkasan Produk

Aplikasi mobile (Android, dibungkus Capacitor) untuk mencatat keuangan pribadi.
Aplikasi bekerja **offline-first** dengan penyimpanan lokal yang persisten di
device, tanpa login (single user per device). Fitur unggulan: **scan struk**
menggunakan AI vision untuk mengekstrak data transaksi secara otomatis.

## 2. Stack & Keputusan Kunci

| Aspek | Keputusan | Alasan |
|---|---|---|
| UI Framework | React + Ionic | Komponen mobile matang, integrasi Capacitor baik |
| Native shell | Capacitor | Target Android (iOS opsional di masa depan) |
| Bahasa | TypeScript | Tipe aman untuk data keuangan |
| Penyimpanan | SQLite via `@capacitor-community/sqlite` | Persisten, terstruktur, andal untuk query |
| Auth | Tidak ada (single user lokal) | Sesuai kebutuhan MVP |
| Mode | Offline-first | Tidak butuh server untuk MVP |
| Scan struk | API OpenAI-compatible (vision) | Endpoint disediakan user |

### Catatan penting (dari diskusi)

- Permintaan awal menyebut **PostgreSQL**. Untuk MVP, data disimpan **lokal**
  di device. PostgreSQL + sinkronisasi server dijadikan **fitur fase lanjutan**
  (lihat Design — Repository Pattern). Lapisan data dirancang agar migrasi ke
  Postgres tidak membongkar UI.
- **`localStorage` browser tidak dipakai** untuk data utama karena tidak cocok
  untuk data relasional/keuangan dan punya batas ukuran. Dipakai SQLite lokal.
  `Preferences` (key-value) hanya untuk setting ringan.

## 3. Definisi Istilah

- **Transaksi**: catatan pemasukan (income) atau pengeluaran (expense).
- **Akun (Account)**: sumber dana — mis. Tunai, Bank, E-wallet.
- **Kategori (Category)**: klasifikasi transaksi — mis. Makan, Transport, Gaji.
- **Anggaran (Budget)**: batas pengeluaran per kategori per periode.
- **Struk (Receipt)**: foto bukti transaksi yang di-scan AI.

## 4. Persyaratan Fungsional (format EARS)

Notasi EARS:
- Ubiquitous: "The system shall ..."
- Event-driven: "When <event>, the system shall ..."
- State-driven: "While <state>, the system shall ..."
- Optional: "Where <feature>, the system shall ..."

### R1 — Manajemen Transaksi

- R1.1 The system shall menyimpan transaksi dengan field: jumlah, tipe
  (income/expense), kategori, akun, tanggal, catatan, dan lampiran opsional.
- R1.2 When pengguna menyimpan transaksi baru, the system shall memperbarui
  saldo akun terkait secara otomatis.
- R1.3 The system shall mengizinkan pengguna mengedit dan menghapus transaksi.
- R1.4 When sebuah transaksi diedit atau dihapus, the system shall menghitung
  ulang saldo akun yang terdampak.
- R1.5 The system shall menampilkan daftar transaksi terurut dari terbaru,
  dapat difilter berdasarkan rentang tanggal, kategori, akun, dan tipe.
- R1.6 Where pengguna mencari, the system shall memfilter transaksi berdasarkan
  teks pada catatan/kategori.
- R1.7 The system shall mendukung transaksi berulang (recurring) dengan
  frekuensi harian/mingguan/bulanan.

### R2 — Akun & Saldo

- R2.1 The system shall mengizinkan pembuatan beberapa akun (Tunai, Bank,
  E-wallet, dll) dengan saldo awal.
- R2.2 The system shall menampilkan saldo terkini tiap akun dan total kekayaan
  bersih (net worth) seluruh akun.
- R2.3 The system shall mendukung transfer antar-akun tanpa mengubah net worth
  total.
- R2.4 While sebuah akun masih memiliki transaksi, the system shall mencegah
  penghapusan akun kecuali pengguna mengonfirmasi pemindahan/penghapusan
  transaksi terkait.

### R3 — Kategori

- R3.1 The system shall menyediakan kategori default untuk income dan expense
  saat pertama kali dijalankan.
- R3.2 The system shall mengizinkan pengguna menambah, mengubah, dan menghapus
  kategori beserta ikon dan warna.
- R3.3 The system shall mendukung sub-kategori (opsional, kedalaman 1 level).

### R4 — Anggaran (Budget)

- R4.1 The system shall mengizinkan penetapan anggaran per kategori per periode
  (bulanan).
- R4.2 While periode anggaran berjalan, the system shall menampilkan persentase
  pemakaian terhadap anggaran.
- R4.3 When pengeluaran kategori melampaui ambang (mis. 80% dan 100%), the
  system shall menampilkan peringatan visual.

### R5 — Scan Struk (AI Vision) — Fitur Unggulan

- R5.1 When pengguna memilih "Scan Struk", the system shall membuka kamera atau
  galeri untuk mengambil gambar struk.
- R5.2 When gambar struk dikirim, the system shall memanggil endpoint
  OpenAI-compatible di `https://openai.bacanovelindo.casa/v1` dengan model
  `openrouter/google/gemma-4-31b-it:free` untuk mengekstrak data.
- R5.3 The system shall mengekstrak minimal: nama merchant, tanggal, total,
  daftar item (nama + harga), dan mata uang bila tersedia.
- R5.4 When ekstraksi berhasil, the system shall menampilkan form pratinjau yang
  sudah terisi agar pengguna dapat mengoreksi sebelum menyimpan.
- R5.5 When pengguna mengonfirmasi hasil scan, the system shall menyimpannya
  sebagai transaksi (R1) dan menyimpan gambar struk sebagai lampiran.
- R5.6 If panggilan AI gagal atau timeout, the system shall menampilkan pesan
  error yang jelas dan mengizinkan input manual atau coba ulang.
- R5.7 The system shall tetap dapat dipakai tanpa fitur scan (scan tidak boleh
  jadi syarat pencatatan).

### R6 — Laporan & Statistik

- R6.1 The system shall menampilkan ringkasan dashboard: total pemasukan,
  pengeluaran, dan saldo untuk periode berjalan.
- R6.2 The system shall menampilkan grafik pengeluaran per kategori (pie/donut)
  dan tren pemasukan vs pengeluaran (line/bar) per periode.
- R6.3 The system shall mengizinkan pemilihan periode laporan (minggu, bulan,
  tahun, kustom).

### R7 — Penyimpanan, Persistensi & Cadangan

- R7.1 The system shall menyimpan seluruh data di SQLite lokal device.
- R7.2 While aplikasi ditutup dan dibuka kembali (berapa kali pun), the system
  shall mempertahankan seluruh data tanpa kehilangan.
- R7.3 The system shall mengizinkan ekspor seluruh data ke berkas (JSON dan
  CSV).
- R7.4 The system shall mengizinkan impor data dari berkas hasil ekspor (JSON)
  untuk pemulihan.
- R7.5 Where pengguna meminta, the system shall menghapus seluruh data (reset)
  dengan konfirmasi.

### R8 — Pengaturan & Preferensi

- R8.1 The system shall mengizinkan pemilihan mata uang utama dan format angka.
- R8.2 The system shall mendukung tema terang/gelap.
- R8.3 The system shall menyimpan endpoint & kredensial AI (API key) secara
  aman di device (lihat Persyaratan Keamanan).
- R8.4 The system shall mendukung Bahasa Indonesia sebagai bahasa default.

## 5. Persyaratan Non-Fungsional

- NFR1 (Performa) The system shall menampilkan daftar 1.000+ transaksi dengan
  scroll mulus (virtualized list), waktu buka layar < 1 detik pada device
  kelas menengah.
- NFR2 (Keandalan) Operasi tulis ke DB harus transaksional; kegagalan parsial
  tidak boleh meninggalkan saldo tidak konsisten.
- NFR3 (Keamanan) API key tidak boleh ter-hardcode di kode; disimpan via
  Capacitor Secure Storage/Preferences terenkripsi; tidak di-log.
- NFR4 (Privasi) Gambar struk dikirim ke endpoint AI hanya saat pengguna
  memicu scan; pengguna diberi tahu data dikirim ke layanan eksternal.
- NFR5 (Aksesibilitas) Kontras warna memenuhi WCAG AA; target sentuh >= 44px;
  label pada kontrol form.
- NFR6 (Portabilitas Data) Lapisan data memakai repository pattern agar dapat
  diganti ke backend Postgres tanpa mengubah UI.
- NFR7 (Lokalisasi) Format mata uang & tanggal mengikuti locale yang dipilih.

## 6. Asumsi

- A1 Model `openrouter/google/gemma-4-31b-it:free` di endpoint tersebut
  **mendukung input gambar (vision)**. Jika tidak, fitur scan perlu model
  vision lain (lihat Risiko).
- A2 Endpoint mengikuti skema OpenAI Chat Completions (`/v1/chat/completions`).
- A3 Target rilis MVP: Android. iOS menyusul (Capacitor mendukung keduanya).

## 7. Risiko & Mitigasi

| ID | Risiko | Dampak | Mitigasi |
|---|---|---|---|
| RK1 | Model bukan vision-capable | Scan struk gagal total | Verifikasi dini; sediakan input manual; buat model dapat dikonfigurasi |
| RK2 | API key tersimpan di device dapat diekstrak | Penyalahgunaan kredensial | Simpan terenkripsi; rencanakan proxy backend di fase lanjutan |
| RK3 | Akurasi OCR/ekstraksi rendah pada struk buram | Data salah | Wajib langkah pratinjau & koreksi (R5.4) |
| RK4 | Migrasi lokal → Postgres rumit | Utang teknis | Repository pattern + skema stabil sejak awal (NFR6) |
| RK5 | Data hilang saat uninstall | Pengguna kehilangan catatan | Fitur ekspor/impor (R7.3–R7.4); rencana backup cloud |

## 8. Di Luar Cakupan MVP

- Sinkronisasi multi-device & backend PostgreSQL (fase 2).
- Multi-user / login (fase 2).
- Integrasi rekening bank otomatis (open banking).
- Mata uang ganda dengan konversi kurs real-time.

## 9. Kriteria Penerimaan MVP

MVP dianggap selesai bila: R1, R2, R3, R5, R6 (dasar), R7.1–R7.2, R8.1–R8.2
terpenuhi, dan data tetap ada setelah aplikasi ditutup-buka berkali-kali pada
perangkat Android nyata.
