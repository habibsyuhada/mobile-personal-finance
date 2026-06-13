# Spec — Aplikasi Pencatatan Keuangan Pribadi

Spec-driven development untuk aplikasi mobile pencatatan keuangan pribadi.

## Ringkasan

Aplikasi mobile **Android** (React + Ionic dibungkus **Capacitor**) untuk
mencatat keuangan pribadi. Bekerja **offline-first** dengan penyimpanan lokal
**SQLite** yang persisten, **tanpa login** (single user per device). Fitur
unggulan: **scan struk** dengan AI vision untuk mengisi transaksi otomatis.

## Dokumen

| Dokumen | Isi |
|---|---|
| [requirements.md](./requirements.md) | Persyaratan fungsional (EARS), non-fungsional, asumsi, risiko |
| [design.md](./design.md) | Arsitektur, model data, repository pattern, desain scan struk |
| [tasks.md](./tasks.md) | Breakdown implementasi bertahap (Fase 0–9) |

## Keputusan Kunci

- **UI**: React + Ionic + TypeScript, build dengan Vite.
- **Native**: Capacitor 6 (target Android).
- **Data MVP**: SQLite lokal (persisten lintas buka-tutup app).
- **Auth**: tidak ada (single user lokal).
- **Mode**: offline-first; hanya scan struk butuh internet.
- **Scan struk**: endpoint OpenAI-compatible
  `https://openai.bacanovelindo.casa/v1`, model
  `openrouter/google/gemma-4-31b-it:free` (konfigurabel).

## Catatan tentang PostgreSQL

Permintaan awal menyebut PostgreSQL. Karena Capacitor tidak bisa menyambung ke
Postgres langsung dari device dan MVP dipilih offline tanpa server, Postgres
dipindah ke **fase lanjutan** (lihat `tasks.md` Fase 9). Lapisan data memakai
**repository pattern** sehingga migrasi ke backend Node + Prisma + PostgreSQL
nanti tidak membongkar UI. Skema SQLite sudah dirancang sejajar dengan Postgres.

## Risiko utama yang perlu dicek dini

1. **Model vision** — pastikan `gemma-4-31b-it:free` di endpoint mendukung input
   gambar. Jika tidak, fitur scan butuh model lain (lihat `tasks.md` T4.8).
2. **API key di device** — risiko keamanan; rencana mitigasi via proxy backend
   di fase lanjutan.
3. **Kehilangan data saat uninstall** — dimitigasi dengan ekspor/impor JSON.

## Cara pakai spec ini

1. Baca `requirements.md` untuk menyepakati cakupan.
2. Tinjau `design.md` sebelum menulis kode.
3. Ikuti `tasks.md` fase demi fase; jalankan build & test di tiap akhir fase.
