import { Preferences } from '@capacitor/preferences';

// Sistem achievement/badge lokal (offline-first, di device).
// Lencana disimpan sebagai Set<habitId+milestone>. Milestone didefinisikan
// oleh jumlah hari streak.

export const MILESTONES = [3, 7, 14, 30, 60, 100, 365] as const;

const KEY = 'habit.achievements';

interface AchievementsState {
  // Set key: `${habitId}:${milestone}`
  unlocked: string[];
}

async function load(): Promise<AchievementsState> {
  const { value } = await Preferences.get({ key: KEY });
  if (!value) return { unlocked: [] };
  try {
    const arr = JSON.parse(value) as string[];
    return { unlocked: Array.isArray(arr) ? arr : [] };
  } catch {
    return { unlocked: [] };
  }
}

async function save(state: AchievementsState): Promise<void> {
  await Preferences.set({ key: KEY, value: JSON.stringify(state.unlocked) });
}

const memo: { data: AchievementsState | null } = { data: null };

async function getState(): Promise<AchievementsState> {
  if (!memo.data) memo.data = await load();
  return memo.data;
}

function makeKey(habitId: string, milestone: number): string {
  return `${habitId}:${milestone}`;
}

/** Cek streak: lencana baru yang baru dibuka pada run ini. */
export async function checkAchievements(
  habitId: string,
  currentStreak: number
): Promise<number[]> {
  const newly: number[] = [];
  const state = await getState();
  for (const m of MILESTONES) {
    if (currentStreak >= m && !state.unlocked.includes(makeKey(habitId, m))) {
      state.unlocked.push(makeKey(habitId, m));
      newly.push(m);
    }
  }
  if (newly.length) await save(state);
  return newly;
}

export async function unlockedFor(habitId: string): Promise<number[]> {
  const state = await getState();
  return MILESTONES.filter((m) => state.unlocked.includes(makeKey(habitId, m)));
}

/** Reset (untuk testing / reset data). */
export async function clearAchievements(): Promise<void> {
  memo.data = { unlocked: [] };
  await save({ unlocked: [] });
}

export interface MilestoneMeta {
  milestone: number;
  title: string;
  emoji: string;
}

// Lookup emoji + label per milestone (dibagi i18n di pemanggil).
export const MILESTONE_META: MilestoneMeta[] = [
  { milestone: 3, title: 'Starter', emoji: '🌱' },
  { milestone: 7, title: 'Week Warrior', emoji: '⚡' },
  { milestone: 14, title: 'Fortnight', emoji: '🔥' },
  { milestone: 30, title: 'Monthly Master', emoji: '🏆' },
  { milestone: 60, title: 'Unstoppable', emoji: '💎' },
  { milestone: 100, title: 'Centurion', emoji: '💯' },
  { milestone: 365, title: 'Year Legend', emoji: '👑' },
];
