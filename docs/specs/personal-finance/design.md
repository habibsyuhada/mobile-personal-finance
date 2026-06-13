# Design — Aplikasi Pencatatan Keuangan Pribadi

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`

## 1. Arsitektur Tingkat Tinggi

```
+---------------------------------------------------------+
|                     Capacitor (Android)                 |
|                                                         |
|  +---------------------------------------------------+  |
|  |                React + Ionic (UI)                 |  |
|  |   Pages  |  Components  |  Hooks  |  State (Zustand)| |
|  +-----------------------+---------------------------+  |
|                          |                              |
|  +-----------------------v---------------------------+  |
|  |              Service Layer (use-cases)            |  |
|  |  TransactionService | AccountService | ReceiptAI  |  |
|  +-----------------------+---------------------------+  |
|                          |                              |
|  +-----------------------v---------------------------+  |
|  |        Repository Interface (abstraksi data)      |  |
|  |   ITransactionRepo | IAccountRepo | ICategoryRepo |  |
|  +-----------------------+---------------------------+  |
|         |                                    |          |
|  +------v---------+                  +--------v-------+  |
|  | SqliteRepo     |                  | (Fase 2)       |  |
|  | (lokal device) |                  | ApiRepo->PG    |  |
|  +------+---------+                  +----------------+  |
+---------|-----------------------------------------------+
          |                                  |
   +------v-------+               +-----------v----------+
   | SQLite (lokal)|              | AI Vision Endpoint   |
   | persisten     |              | openai-compatible    |
   +---------------+              +----------------------+
```

Prinsip utama:
- **UI tidak pernah memanggil SQLite langsung.** UI -> Service -> Repository
  interface -> implementasi. Ini kunci agar migrasi ke Postgres (fase 2) hanya
  mengganti implementasi repository (NFR6).
- **Offline-first**: semua operasi baca/tulis ke SQLite lokal, instan, tanpa
  jaringan. Hanya scan struk yang butuh internet.

## 2. Struktur Folder Proyek

```
mobile-personal-finance/
├─ docs/specs/personal-finance/      # dokumen spec (file ini)
├─ src/
│  ├─ app/                           # routing, layout, providers
│  ├─ pages/                         # Dashboard, Transactions, Scan, Reports, Settings
│  ├─ components/                    # komponen UI reusable
│  ├─ features/
│  │  ├─ transactions/
│  │  ├─ accounts/
│  │  ├─ categories/
│  │  ├─ budgets/
│  │  ├─ receipts/                   # scan struk + AI client
│  │  └─ reports/
│  ├─ data/
│  │  ├─ repositories/               # interface + impl SQLite
│  │  ├─ db/                         # koneksi, migrasi, schema SQL
│  │  └─ models/                     # tipe domain (TS)
│  ├─ services/                      # use-case orchestration
│  ├─ store/                         # Zustand stores
│  ├─ lib/                           # util: currency, date, id, config
│  └─ i18n/                          # teks Bahasa Indonesia
├─ capacitor.config.ts
└─ package.json
```

## 3. Pilihan Teknologi Detail

| Kebutuhan | Pustaka | Catatan |
|---|---|---|
| UI | React 18 + Ionic React 7 | komponen mobile siap pakai |
| Build | Vite | cepat, standar Ionic React modern |
| Native | Capacitor 6 | target Android |
| DB lokal | `@capacitor-community/sqlite` | persisten, transaksional |
| Kamera | `@capacitor/camera` | ambil foto struk |
| Filesystem | `@capacitor/filesystem` | simpan gambar struk, ekspor/impor |
| Secure store | `@capacitor/preferences` + enkripsi | simpan API key (R8.3/NFR3) |
| State | Zustand | ringan, sederhana |
| Grafik | Chart.js via `react-chartjs-2` | laporan (R6) |
| Form & validasi | React Hook Form + Zod | validasi tipe aman |
| HTTP | `@capacitor/http` / fetch | panggilan AI endpoint |

## 4. Strategi Penyimpanan Persisten (kritis)

Kekhawatiran utama dari kamu: **data harus tetap ada setelah buka-tutup
aplikasi berkali-kali** (R7.2).

- Memakai `@capacitor-community/sqlite`. Di Android, DB disimpan di penyimpanan
  internal aplikasi sebagai berkas `.db` yang **persisten** lintas sesi.
- DB hanya hilang bila aplikasi di-uninstall atau data app dibersihkan manual.
- Untuk web/dev, plugin pakai `jeep-sqlite` (IndexedDB) sebagai fallback agar
  bisa dikembangkan di browser.
- Mitigasi kehilangan data: ekspor/impor JSON (R7.3/R7.4); rencana backup cloud
  di fase lanjutan.

`localStorage`/`Preferences` hanya untuk: pilihan tema, locale, mata uang,
endpoint & API key. Data keuangan inti **selalu** di SQLite.

## 5. Model Data

Skema dirancang stabil agar bisa langsung dipetakan ke PostgreSQL di fase 2
(nama tabel & kolom sama; tipe disesuaikan). Semua `id` memakai UUID (TEXT) agar
aman saat sinkronisasi multi-device nanti. Nilai uang disimpan sebagai
**integer minor unit** (mis. sen/rupiah bulat) untuk menghindari galat
floating point.

### 5.1 Skema (SQLite DDL)

```sql
CREATE TABLE accounts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,          -- cash | bank | ewallet | other
  currency      TEXT NOT NULL DEFAULT 'IDR',
  initial_balance INTEGER NOT NULL DEFAULT 0,  -- minor unit
  icon          TEXT,
  color         TEXT,
  archived      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL,            -- income | expense
  parent_id   TEXT REFERENCES categories(id),
  icon        TEXT,
  color       TEXT,
  is_default  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE TABLE transactions (
  id           TEXT PRIMARY KEY,
  type         TEXT NOT NULL,           -- income | expense | transfer
  amount       INTEGER NOT NULL,        -- minor unit, selalu positif
  account_id   TEXT NOT NULL REFERENCES accounts(id),
  to_account_id TEXT REFERENCES accounts(id),  -- hanya untuk transfer
  category_id  TEXT REFERENCES categories(id),
  occurred_at  TEXT NOT NULL,           -- ISO datetime
  note         TEXT,
  receipt_id   TEXT REFERENCES receipts(id),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_tx_occurred ON transactions(occurred_at);
CREATE INDEX idx_tx_category ON transactions(category_id);
CREATE INDEX idx_tx_account  ON transactions(account_id);

CREATE TABLE transaction_items (   -- baris detail dari struk (opsional)
  id             TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  qty            REAL,
  unit_price     INTEGER,              -- minor unit
  line_total     INTEGER               -- minor unit
);

CREATE TABLE receipts (
  id            TEXT PRIMARY KEY,
  image_path    TEXT NOT NULL,         -- path di Filesystem
  merchant      TEXT,
  raw_json      TEXT,                  -- hasil mentah dari AI
  status        TEXT NOT NULL,         -- pending | parsed | failed
  created_at    TEXT NOT NULL
);

CREATE TABLE budgets (
  id           TEXT PRIMARY KEY,
  category_id  TEXT NOT NULL REFERENCES categories(id),
  period       TEXT NOT NULL,          -- 'YYYY-MM'
  amount_limit INTEGER NOT NULL,       -- minor unit
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE TABLE recurring_rules (
  id           TEXT PRIMARY KEY,
  template_json TEXT NOT NULL,         -- pola transaksi
  frequency    TEXT NOT NULL,          -- daily | weekly | monthly
  next_run_at  TEXT NOT NULL,
  active       INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE meta (                    -- versi skema migrasi
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### 5.2 Perhitungan Saldo

Saldo akun = `initial_balance` + Σ(income) − Σ(expense) ± transfer.
Untuk performa, saldo dihitung via query agregat ber-index, bukan disimpan
sebagai kolom yang mudah tidak sinkron. Transfer menambah ke `to_account_id`
dan mengurangi dari `account_id` dalam satu transaksi DB (NFR2).

## 6. Repository Pattern (jembatan ke Postgres di fase 2)

```ts
// src/data/repositories/transaction.repo.ts
export interface ITransactionRepository {
  list(filter: TxFilter): Promise<Transaction[]>;
  getById(id: string): Promise<Transaction | null>;
  create(input: NewTransaction): Promise<Transaction>;
  update(id: string, patch: Partial<NewTransaction>): Promise<Transaction>;
  remove(id: string): Promise<void>;
}
```

- MVP: `SqliteTransactionRepository implements ITransactionRepository`.
- Fase 2: `ApiTransactionRepository` memanggil backend Node + Prisma + Postgres,
  dengan logika sinkron (queue offline -> replay saat online).
- Service & UI hanya bergantung pada **interface**, bukan implementasi.
  Pemilihan implementasi dilakukan di satu tempat (composition root /
  dependency container).

## 7. Desain Fitur Scan Struk (R5)

### 7.1 Alur

```
Kamera/Galeri -> kompres gambar -> base64
   -> POST /v1/chat/completions (image + prompt terstruktur)
   -> parse JSON respons -> form pratinjau (user koreksi)
   -> simpan transaction + transaction_items + receipt + gambar
```

### 7.2 Klien AI

- Endpoint: `https://openai.bacanovelindo.casa/v1/chat/completions`
- Model (konfigurabel): `openrouter/google/gemma-4-31b-it:free`
- Format: OpenAI Chat Completions dengan konten multimodal (gambar + teks).
- Minta keluaran **JSON terstruktur** lewat prompt + `response_format` bila
  didukung. Contoh payload:

```jsonc
{
  "model": "openrouter/google/gemma-4-31b-it:free",
  "messages": [
    { "role": "system",
      "content": "Ekstrak data struk. Balas HANYA JSON valid sesuai skema." },
    { "role": "user", "content": [
      { "type": "text", "text": "Ekstrak merchant, date, currency, total, items[]." },
      { "type": "image_url",
        "image_url": { "url": "data:image/jpeg;base64,<...>" } }
    ]}
  ],
  "temperature": 0
}
```

Skema hasil yang divalidasi dengan Zod:

```ts
const ReceiptSchema = z.object({
  merchant: z.string().nullable(),
  date: z.string().nullable(),           // ISO bila bisa
  currency: z.string().default('IDR'),
  total: z.number().nullable(),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number().nullable(),
    price: z.number().nullable(),
  })).default([]),
});
```

### 7.3 Penanganan kesalahan (R5.6)

- Timeout (mis. 30s) -> tawarkan coba ulang / input manual.
- JSON tidak valid -> coba sekali lagi dengan instruksi lebih ketat, lalu
  fallback ke input manual.
- Validasi Zod gagal -> tampilkan field yang bisa diisi, sisanya manual.

### 7.4 Keamanan API key (NFR3, RK2)

- API key TIDAK di-hardcode. Disimpan via `Preferences` (idealnya terenkripsi).
- Diperingatkan ke pengguna: gambar dikirim ke layanan eksternal (NFR4).
- Catatan utang teknis: menaruh key di device berisiko (RK2). Rencana fase 2:
  proxy lewat backend agar key tidak pernah ada di device.

## 8. Manajemen State (Zustand)

- `useTransactionStore`, `useAccountStore`, `useCategoryStore`,
  `useBudgetStore`, `useSettingsStore`.
- Store memanggil Service; Service memanggil Repository. Store menyimpan
  cache UI + status loading/error. Sumber kebenaran tetap SQLite.

## 9. Navigasi & Layar Utama

- Tab bar (Ionic `IonTabs`): Dashboard, Transaksi, Scan (tombol tengah), 
  Laporan, Pengaturan.
- Dashboard: ringkasan periode + akses cepat tambah transaksi.
- Transaksi: daftar tervirtualisasi + filter + pencarian.
- Scan: kamera -> pratinjau -> simpan.
- Laporan: grafik kategori & tren.
- Pengaturan: akun, kategori, anggaran, mata uang, tema, AI config,
  ekspor/impor, reset.

## 10. Migrasi Skema

- Tabel `meta(key='schema_version')` menyimpan versi.
- Saat start, jalankan migrasi berurutan sampai versi terkini. Penting agar
  update aplikasi tidak merusak data lama (R7.2).

## 11. Pengujian

- Unit: util (currency, date), service (perhitungan saldo, transfer), parser
  struk (validasi Zod terhadap contoh JSON).
- Integrasi: repository SQLite (memakai fallback web saat CI).
- E2E manual: smoke test di perangkat Android nyata, termasuk uji
  buka-tutup berkali-kali untuk memastikan persistensi (R7.2).
