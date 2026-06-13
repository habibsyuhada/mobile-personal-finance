import {
  fastFood,
  car,
  cart,
  receipt,
  gameController,
  medkit,
  school,
  home,
  ellipsisHorizontal,
  wallet,
  gift,
  trendingUp,
  sparkles,
  addCircle,
  pricetag,
  swapHorizontal,
} from 'ionicons/icons';

// Peta nama ikon (string yang disimpan di kategori) -> ikon ionicons.
const ICON_MAP: Record<string, string> = {
  'fast-food': fastFood,
  car,
  cart,
  receipt,
  'game-controller': gameController,
  medkit,
  school,
  home,
  'ellipsis-horizontal': ellipsisHorizontal,
  wallet,
  gift,
  'trending-up': trendingUp,
  sparkles,
  'add-circle': addCircle,
};

export function iconForCategory(iconName?: string | null): string {
  if (iconName && ICON_MAP[iconName]) return ICON_MAP[iconName];
  return pricetag;
}

export const transferIcon = swapHorizontal;

/** Warna default bila kategori tidak punya warna. */
export function colorForCategory(color?: string | null): string {
  return color ?? '#94a3b8';
}
