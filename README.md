# Moraven

Aplikasi mobile pencatatan keuangan pribadi. Offline-first, tanpa login, dengan
fitur scan struk berbasis AI. Dibangun dengan React + Ionic + Capacitor, data
tersimpan lokal di SQLite (persisten lintas buka-tutup aplikasi).

Spec lengkap ada di `docs/specs/personal-finance/`.

## Fitur

- Pencatatan transaksi (pemasukan, pengeluaran, transfer antar-akun)
- Multi akun (Tunai, Bank, E-wallet) dengan saldo & net worth otomatis
- Kategori dengan warna (income/expense), bisa dikustomisasi
- Anggaran bulanan per kategori dengan indikator pemakaian
- Dashboard ringkasan + laporan grafik (donut & bar)
- Scan struk: foto → AI mengisi data transaksi otomatis → koreksi → simpan
- Transaksi berulang (harian/mingguan/bulanan), diproses saat app dibuka
- Ekspor/impor data (JSON & CSV) untuk cadangan
- Tema terang/gelap, pilihan mata uang, Bahasa Indonesia

## Arsitektur

```
UI (React + Ionic)
  → Store (Zustand)
    → Service (logika bisnis: validasi, saldo, anggaran)
      → Repository interface (abstraksi data)
        → SQLite (lokal)   [MVP]
        → ApiRepository    [fase lanjutan: Postgres]
```

UI tidak pernah menyentuh SQLite langsung. Pemilihan implementasi repository
ada di `src/data/index.ts` (composition root) — satu-satunya tempat yang berubah
saat migrasi ke backend PostgreSQL.

## Struktur

```
src/
├─ app/            App shell, routing, tabs
├─ pages/          Dashboard, Transactions, Scan, Reports, Settings, dll
├─ features/       transactions (form), receipts (AI client), backup
├─ data/
│  ├─ db/          koneksi SQLite + migrasi
│  ├─ models/      tipe domain
│  ├─ repositories/ interface + implementasi SQLite
│  ├─ index.ts     composition root (wiring repository)
│  └─ seed.ts      kategori default
├─ services/       AccountService, TransactionService, dll
├─ store/          Zustand stores
└─ lib/            currency, date, settings, id
```

## Menjalankan

Prasyarat: Node.js 20+, npm. Untuk build Android: Android Studio + JDK 17.

```bash
npm install          # pasang dependensi
npm run dev          # jalankan di browser (SQLite via fallback IndexedDB)
npm test             # unit test (Vitest)
npm run build        # type-check + build produksi ke dist/
npm run lint         # ESLint
```

### Build Android

```bash
npm run build        # build web dulu
npx cap sync android # salin ke proyek Android
npx cap open android # buka di Android Studio, lalu Run / build APK
```

Catatan: data SQLite tersimpan di penyimpanan internal aplikasi dan persisten
lintas sesi. Data hilang hanya bila aplikasi di-uninstall atau data app
dibersihkan — gunakan Ekspor JSON di Pengaturan untuk cadangan.

## Konfigurasi Scan Struk

Buka Pengaturan → Konfigurasi AI:

- Endpoint (default): `https://openai.bacanovelindo.casa/v1`
- Model (default): `openrouter/google/gemma-4-31b-it:free`
- API Key: opsional, tergantung endpoint

Penting:
- Model harus mendukung input gambar (vision). Jika tidak, ganti dengan model
  vision lain. Lihat risiko RK1 di spec.
- API key tersimpan di perangkat (tidak terenkripsi penuh). Untuk produksi,
  gunakan proxy backend agar key tidak ada di device (rencana fase lanjutan).
- Gambar struk dikirim ke layanan AI eksternal saat scan.

## Pengujian

31 unit test mencakup: util mata uang & tanggal, perhitungan saldo & transfer,
validasi transaksi, parser respons AI struk, dan penjadwalan transaksi berulang.

## Status & Rencana Lanjutan

MVP lengkap (offline, lokal). Belum termasuk:
- Backend Node + Prisma + PostgreSQL + sinkronisasi multi-device
- Proxy AI di backend (keamanan API key)
- Multi-user / login, backup cloud, build iOS

Lihat `docs/specs/personal-finance/tasks.md` Fase 9 untuk detail.
