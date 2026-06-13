import type { ICategoryRepository } from './repositories/interfaces';

interface SeedCategory {
  name: string;
  kind: 'income' | 'expense';
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: SeedCategory[] = [
  // Expense
  { name: 'Makanan & Minuman', kind: 'expense', icon: 'fast-food', color: '#f59e0b' },
  { name: 'Transportasi', kind: 'expense', icon: 'car', color: '#3b82f6' },
  { name: 'Belanja', kind: 'expense', icon: 'cart', color: '#ec4899' },
  { name: 'Tagihan', kind: 'expense', icon: 'receipt', color: '#ef4444' },
  { name: 'Hiburan', kind: 'expense', icon: 'game-controller', color: '#8b5cf6' },
  { name: 'Kesehatan', kind: 'expense', icon: 'medkit', color: '#10b981' },
  { name: 'Pendidikan', kind: 'expense', icon: 'school', color: '#06b6d4' },
  { name: 'Rumah', kind: 'expense', icon: 'home', color: '#f97316' },
  { name: 'Lainnya', kind: 'expense', icon: 'ellipsis-horizontal', color: '#6b7280' },
  // Income
  { name: 'Gaji', kind: 'income', icon: 'wallet', color: '#22c55e' },
  { name: 'Bonus', kind: 'income', icon: 'gift', color: '#14b8a6' },
  { name: 'Investasi', kind: 'income', icon: 'trending-up', color: '#0ea5e9' },
  { name: 'Hadiah', kind: 'income', icon: 'sparkles', color: '#a855f7' },
  { name: 'Lainnya', kind: 'income', icon: 'add-circle', color: '#6b7280' },
];

/** Seed kategori default hanya jika tabel masih kosong (R3.1). */
export async function seedDefaultCategories(repo: ICategoryRepository): Promise<void> {
  const count = await repo.count();
  if (count > 0) return;
  for (const c of DEFAULT_CATEGORIES) {
    await repo.create({
      name: c.name,
      kind: c.kind,
      icon: c.icon,
      color: c.color,
      isDefault: true,
    });
  }
}
