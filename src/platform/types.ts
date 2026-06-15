import type { ComponentType } from 'react';
import type { Database } from '@/data/db/database';
import type { TranslationKey } from '@/i18n';

// Migrasi tabel khusus modul (dipakai mulai modul baru / Fase B).
export interface ModuleMigration {
  version: number;
  statements: string[];
}

/**
 * Deskriptor satu modul. Shell membaca ini dari registry untuk membangun
 * launcher & routing otomatis. Menambah modul = tambahkan deskriptor + folder.
 */
export interface ModuleDescriptor {
  id: string; // 'finance' | 'todo' | 'habit'
  nameKey: TranslationKey; // key i18n, mis. 'module.finance.name'
  icon: string; // ionicon
  color: string; // warna kartu launcher
  order: number; // urutan tampil di launcher
  enabled: boolean;
  routePath: string; // '/m/finance'
  // Komponen root modul (lazy untuk code-split).
  component: () => Promise<{ default: ComponentType }>;
  // Migrasi tabel khusus modul.
  migrations?: ModuleMigration[];
  // Hook opsional setelah migrasi (seed, proses jadwal).
  init?: (db: Database) => Promise<void>;
  // Nama tabel yang dimiliki modul (untuk ekspor/impor).
  tables?: string[];
  /**
   * Jadwalkan ulang SEMUA reminder milik modul. Dipanggil shell saat app
   * boot, setelah restore/import, dan saat modul diaktifkan/dimatikan.
   * Modul mengelola channel & ID-nya sendiri.
   */
  scheduleReminders?: () => Promise<void>;
  /** Batalkan SEMUA reminder milik modul (mis. saat modul disabled). */
  cancelAllReminders?: () => Promise<void>;
}
