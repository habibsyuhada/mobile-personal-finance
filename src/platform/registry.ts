import type { ModuleDescriptor } from './types';
import { financeModule } from '@/modules/finance/module';

// Registry terpusat semua modul. Menambah modul cukup tambahkan deskriptornya
// di array ini; launcher & routing membaca dari sini (tidak ada tempat lain
// yang perlu diubah).
export const MODULES: ModuleDescriptor[] = [financeModule].sort(
  (a, b) => a.order - b.order
);

export function enabledModules(): ModuleDescriptor[] {
  return MODULES.filter((m) => m.enabled);
}

export function getModule(id: string): ModuleDescriptor | null {
  return MODULES.find((m) => m.id === id) ?? null;
}
