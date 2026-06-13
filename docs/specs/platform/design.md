# Design — Platform (Personal Super App Shell)

Status: Draft v1
Tanggal: 2026-06-13
Mengacu pada: `requirements.md`

## 1. Konsep

Aplikasi = **Shell** + banyak **Module**. Shell tahu daftar modul lewat
**Module Registry**, membangun routing & launcher otomatis, dan menyediakan
infrastruktur bersama (DB, tema, i18n, settings).

```
+-----------------------------------------------------------+
|                          Shell                            |
|  Providers (theme, i18n, settings)  |  Root Router        |
|                                                           |
|   +--------------------+      +------------------------+  |
|   |     Launcher       |      |   Module Container     |  |
|   |  (grid ikon modul) |      |  /m/:moduleId/*        |  |
|   +--------------------+      +------------------------+  |
|             |                          |                  |
|     Module Registry  ----------------- +                  |
|     [finance, todo, habit, ...]                           |
+-----------------------------------------------------------+
                 |
        Shared infra: SQLite (1 DB), migrations runner,
        theme tokens, i18n, global settings store
```

## 2. Perubahan Arsitektur dari Kondisi Saat Ini

Saat ini: `App.tsx` langsung memuat `Tabs` keuangan di `/tabs/...`.

Setelah platform:
- Root router punya dua cabang: `/` (launcher) dan `/m/:moduleId/*` (modul).
- Modul keuangan dipindah ke `/m/finance/...` (sebelumnya `/tabs/...`).
- `App.tsx` hanya mengurus bootstrap + provider + root router; tidak tahu detail
  modul apa pun.

## 3. Struktur Folder Target

```
src/
├─ app/
│  ├─ App.tsx               # bootstrap + providers + root router
│  ├─ Launcher.tsx          # grid ikon modul (baca dari registry)
│  └─ ModuleHost.tsx        # memuat modul berdasarkan :moduleId
├─ platform/
│  ├─ registry.ts           # daftar ModuleDescriptor
│  ├─ types.ts              # tipe ModuleDescriptor & lifecycle
│  ├─ migrations.ts         # runner migrasi gabungan semua modul
│  └─ settings/             # pengaturan global (pindahan dari finance)
├─ modules/
│  ├─ finance/              # modul keuangan (pindahan dari kode lama)
│  │  ├─ module.ts          # ModuleDescriptor + init() + migrations
│  │  ├─ routes.tsx         # tab/stack internal modul
│  │  ├─ pages/  data/  services/  store/  i18n/
│  ├─ todo/                 # modul Todo (lihat specs/todo)
│  └─ habit/                # modul Habit (lihat specs/habit-tracker)
├─ data/db/                 # koneksi SQLite (tetap, dipakai semua modul)
├─ i18n/                    # i18n inti + namespace platform
├─ lib/                     # util bersama (currency, date, id, dst.)
└─ theme/
```

Catatan: pemindahan `pages/`, `services/`, `store/`, `data/repositories`
keuangan ke `modules/finance/` adalah refactor terstruktur (lihat `tasks.md`).

## 4. Module Descriptor

```ts
// src/platform/types.ts
import type { ComponentType } from 'react';
import type { Database } from '@/data/db/database';

export interface ModuleMigration {
  version: number;        // versi internal modul
  statements: string[];
}

export interface ModuleDescriptor {
  id: string;             // 'finance' | 'todo' | 'habit'
  nameKey: string;        // key i18n, mis. 'module.finance.name'
  icon: string;           // ionicon
  color: string;          // warna kartu launcher
  order: number;          // urutan tampil
  enabled: boolean;
  routePath: string;      // '/m/finance'
  // Komponen root modul (berisi tab/stack internal). Lazy untuk code-split.
  component: () => Promise<{ default: ComponentType }>;
  // Migrasi tabel khusus modul (prefix tabel sendiri).
  migrations: ModuleMigration[];
  // Hook opsional dijalankan setelah migrasi (seed, proses jadwal, dst.).
  init?: (db: Database) => Promise<void>;
  // Penanda untuk ekspor/impor (nama tabel yang dimiliki modul).
  tables: string[];
}
```

## 5. Module Registry

```ts
// src/platform/registry.ts
import { financeModule } from '@/modules/finance/module';
import { todoModule } from '@/modules/todo/module';
import { habitModule } from '@/modules/habit/module';

export const MODULES: ModuleDescriptor[] = [
  financeModule,
  todoModule,
  habitModule,
].sort((a, b) => a.order - b.order);

export function enabledModules() {
  return MODULES.filter((m) => m.enabled);
}
export function getModule(id: string) {
  return MODULES.find((m) => m.id === id) ?? null;
}
```

Menambah modul = tambahkan satu baris di array ini + folder modulnya. Launcher
dan router membaca dari sini, jadi tidak ada tempat lain yang perlu diubah
(memenuhi P2.2, NFR2).

## 6. Routing Root

```tsx
// inti App.tsx
<IonReactRouter>
  <IonRouterOutlet>
    <Route exact path="/" render={() => <Launcher />} />
    <Route path="/m/:moduleId" render={() => <ModuleHost />} />
    <Route path="/settings" render={() => <GlobalSettings />} />
  </IonRouterOutlet>
</IonReactRouter>
```

`ModuleHost` membaca `:moduleId`, mengambil deskriptor dari registry, lalu
me-render komponen root modul (lazy via `React.lazy`/dynamic import). Jika modul
tidak ditemukan/dinonaktifkan, tampilkan fallback "modul tidak tersedia"
(NFR3).

## 7. Launcher

- Grid responsif (2-3 kolom) berisi kartu modul: ikon dalam bulatan berwarna,
  nama terlokalisasi.
- Header: nama app + tanggal hari ini.
- Tombol pengaturan global di pojok (ikon gear) menuju `/settings`.
- Kartu dibangun dari `enabledModules()`; mengetuk → `history.push(routePath)`.

## 8. Migrasi Gabungan

Masalah: tiap modul punya migrasi sendiri, tapi DB satu. Solusi: namespacing
versi per modul di tabel `meta`.

```
meta:
  schema_version.core     = 1
  schema_version.finance  = 1
  schema_version.todo     = 1
  schema_version.habit    = 1
```

Runner saat start:
1. Jalankan migrasi core (tabel `meta`).
2. Untuk tiap modul di registry: baca `schema_version.<id>`, jalankan migrasi
   modul yang versinya lebih tinggi, masing-masing dalam transaksi (P5.3).
3. Jalankan `init()` modul (seed/jadwal) bila ada.

Karena tiap modul memakai prefix tabel sendiri (`todo_tasks`, `habit_habits`,
`fin_*`), tidak ada benturan. (Tabel keuangan lama bisa dipertahankan tanpa
rename untuk menghindari migrasi data; prefix `fin_` diberlakukan untuk modul
baru — keputusan final ada di tasks.)

## 9. Infrastruktur Bersama

- **DB**: `src/data/db/database.ts` tetap satu koneksi; runner migrasi dipindah
  ke `src/platform/migrations.ts` yang mengiterasi registry.
- **Tema**: token desain di `theme/variables.css` dipakai semua modul.
- **i18n**: inti i18n menyatukan kamus; tiap modul menyumbang namespace
  (`finance.*`, `todo.*`, `habit.*`, `module.*`, `launcher.*`).
- **Settings global**: store setting (tema, bahasa, currency, AI) dipindah ke
  `src/platform/settings/` agar tidak terikat ke modul keuangan.

## 10. Penanganan Kegagalan Modul (NFR3)

- Bootstrap membungkus init tiap modul dalam try/catch; modul yang gagal init
  ditandai error tetapi tidak menggagalkan modul lain.
- `ModuleHost` memakai error boundary; bila render modul gagal, tampilkan layar
  error lokal dengan tombol kembali ke launcher.

## 11. Ekspor/Impor Lintas Modul

Bundle JSON:
```jsonc
{
  "app": "personal-super-app",
  "exportedAt": "...",
  "schemaVersions": { "finance": 1, "todo": 1, "habit": 1 },
  "modules": {
    "finance": { "fin_accounts": [...], "fin_transactions": [...] },
    "todo":    { "todo_tasks": [...] },
    "habit":   { "habit_habits": [...], "habit_logs": [...] }
  }
}
```
Importer memetakan per modul berdasarkan `tables` di deskriptor; modul tak
dikenal dilewati dengan peringatan (P6.2).

## 12. Strategi Refactor (tanpa merusak yang sudah jalan)

1. Tambah lapisan platform & launcher di samping kode lama (rute `/m/finance`
   menunjuk ke `Tabs` keuangan yang ada, dibungkus adapter).
2. Setelah launcher + routing modul stabil, pindahkan file keuangan ke
   `modules/finance/` secara bertahap.
3. Generalisasi runner migrasi & settings.
4. Baru tambah modul Todo & Habit di atas fondasi ini.

## 13. Pengujian

- Unit: registry (enabled/order/getModule), runner migrasi multi-modul
  (versi naik per modul, idempoten), importer (routing per modul).
- Integrasi: buka launcher → masuk modul → back ke launcher.
- Regression: pastikan modul keuangan tetap berfungsi setelah pindah namespace.
