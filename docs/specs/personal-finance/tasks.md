# Tasks — Aplikasi Pencatatan Keuangan Pribadi

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`, `design.md`

Konvensi:
- `[ ]` belum, `[~]` berjalan, `[x]` selesai.
- Tiap tugas menyebut requirement yang dipenuhi (mis. `R1.2`).
- Urutan dirancang agar selalu ada aplikasi yang bisa dijalankan di tiap fase.

---

## Fase 0 — Inisialisasi Proyek

- [ ] T0.1 Setup proyek Ionic React + Vite + TypeScript.
- [ ] T0.2 Tambah & konfigurasi Capacitor, target platform Android.
- [ ] T0.3 Pasang dependensi inti: sqlite, camera, filesystem, preferences,
      zustand, chart.js, react-hook-form, zod. (Pin versi — keamanan)
- [ ] T0.4 Setup struktur folder sesuai Design §2.
- [ ] T0.5 Setup linting/format (ESLint + Prettier) & skrip build.
- [ ] T0.6 Verifikasi: `npm run build` sukses & app jalan di emulator Android.

Acceptance: aplikasi kosong terbuka di Android, tab bar tampil.

## Fase 1 — Fondasi Data (SQLite + Repository)

- [ ] T1.1 Modul koneksi SQLite + fallback web (`jeep-sqlite`). (R7.1)
- [ ] T1.2 Sistem migrasi + tabel `meta`. (Design §10)
- [ ] T1.3 Buat DDL semua tabel (Design §5.1).
- [ ] T1.4 Tipe domain TS di `data/models`.
- [ ] T1.5 Interface repository (transaction, account, category, budget,
      receipt). (NFR6)
- [ ] T1.6 Implementasi SQLite repository + util uang (minor unit) & id (UUID).
- [ ] T1.7 Seed kategori default saat pertama jalan. (R3.1)
- [ ] T1.8 Unit test: util uang/tanggal, repository dasar.

Acceptance: data tertulis & terbaca dari SQLite; tetap ada setelah restart app
(uji manual buka-tutup). (R7.2)

## Fase 2 — Akun & Transaksi (inti)

- [ ] T2.1 AccountService + UI kelola akun (CRUD, saldo awal). (R2.1)
- [ ] T2.2 Hitung saldo & net worth via agregat. (R2.2)
- [ ] T2.3 TransactionService: create/update/delete transaksional. (R1.1–R1.4, NFR2)
- [ ] T2.4 UI tambah/edit transaksi (form + validasi Zod). (R1.1)
- [ ] T2.5 Daftar transaksi tervirtualisasi + filter + cari. (R1.5, R1.6, NFR1)
- [ ] T2.6 Transfer antar-akun. (R2.3)
- [ ] T2.7 Proteksi hapus akun yang masih punya transaksi. (R2.4)
- [ ] T2.8 Test service saldo & transfer.

Acceptance: bisa catat income/expense/transfer, saldo akurat & konsisten.

## Fase 3 — Kategori & Dashboard

- [ ] T3.1 UI kelola kategori (CRUD, ikon, warna, sub-kategori). (R3.2, R3.3)
- [ ] T3.2 Dashboard ringkasan periode (income/expense/saldo). (R6.1)
- [ ] T3.3 Pemilih periode (minggu/bulan/tahun/kustom). (R6.3)

Acceptance: dashboard menampilkan ringkasan benar untuk periode terpilih.

## Fase 4 — Scan Struk (fitur unggulan)

- [ ] T4.1 Layar Scan: kamera/galeri + kompres gambar. (R5.1)
- [ ] T4.2 Klien AI ke endpoint OpenAI-compatible (multimodal). (R5.2)
- [ ] T4.3 Prompt terstruktur + parsing & validasi Zod. (R5.3, Design §7.2)
- [ ] T4.4 Form pratinjau hasil scan untuk koreksi. (R5.4)
- [ ] T4.5 Simpan jadi transaksi + items + gambar struk. (R5.5)
- [ ] T4.6 Penanganan error/timeout + fallback manual. (R5.6, R5.7)
- [ ] T4.7 Simpan endpoint & API key aman di Preferences. (R8.3, NFR3)
- [ ] T4.8 VERIFIKASI DINI (RK1): cek apakah model mendukung input gambar.
      Jika tidak, eskalasi ke user untuk pilih model vision.
- [ ] T4.9 Test parser dengan beberapa contoh JSON struk.

Acceptance: foto struk -> data terisi otomatis -> bisa dikoreksi -> tersimpan.

## Fase 5 — Anggaran & Laporan

- [ ] T5.1 UI anggaran per kategori per bulan. (R4.1)
- [ ] T5.2 Indikator pemakaian + peringatan ambang. (R4.2, R4.3)
- [ ] T5.3 Grafik pengeluaran per kategori (donut). (R6.2)
- [ ] T5.4 Grafik tren income vs expense. (R6.2)

Acceptance: anggaran & grafik tampil akurat sesuai data.

## Fase 6 — Pengaturan, Ekspor/Impor, Tema

- [ ] T6.1 Pengaturan mata uang & format angka. (R8.1)
- [ ] T6.2 Tema terang/gelap. (R8.2)
- [ ] T6.3 Bahasa Indonesia default (i18n). (R8.4)
- [ ] T6.4 Ekspor data JSON + CSV. (R7.3)
- [ ] T6.5 Impor data JSON. (R7.4)
- [ ] T6.6 Reset seluruh data dengan konfirmasi. (R7.5)

Acceptance: data bisa diekspor & dipulihkan; tema & mata uang berfungsi.

## Fase 7 — Transaksi Berulang & Pemolesan

- [ ] T7.1 Aturan recurring + eksekusi saat app dibuka. (R1.7)
- [ ] T7.2 Aksesibilitas: kontras, target sentuh, label. (NFR5)
- [ ] T7.3 Optimasi performa daftar besar. (NFR1)
- [ ] T7.4 Empty states, loading, dan pesan error yang ramah.

Acceptance: recurring jalan; app lolos cek aksesibilitas dasar & performa.

## Fase 8 — Rilis MVP

- [ ] T8.1 Uji menyeluruh di perangkat Android nyata.
- [ ] T8.2 Uji persistensi: buka-tutup berkali-kali, data utuh. (R7.2)
- [ ] T8.3 Build APK rilis + ikon & splash.
- [ ] T8.4 Tinjau Kriteria Penerimaan MVP (requirements §9).

---

## Fase 9+ — Fase Lanjutan (di luar MVP)

- [ ] T9.1 Backend Node + Prisma + PostgreSQL. (memenuhi permintaan Postgres awal)
- [ ] T9.2 `ApiRepository` + sinkronisasi offline-first (queue & replay).
- [ ] T9.3 Proxy AI di backend agar API key tidak di device. (RK2)
- [ ] T9.4 Multi-user / login & backup cloud.
- [ ] T9.5 Build iOS.

---

## Catatan Eksekusi

- Setiap akhir fase: jalankan build & test sebelum lanjut.
- Tugas T4.8 adalah gerbang risiko — kerjakan lebih awal (bisa paralel dengan
  Fase 1–2) untuk memastikan fitur scan layak sebelum banyak UI dibangun.
- Jaga skema DB stabil sejak Fase 1 agar migrasi ke Postgres mulus.
