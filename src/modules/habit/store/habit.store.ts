import { create } from 'zustand';
import { getDatabase } from '@/data/db/database';
import { SqliteHabitRepository } from '../data/habit.repo';
import { HabitService } from '../services/habit.service';
import type { Habit, HabitProgressToday, NewHabit } from '../data/models';

let service: HabitService | null = null;
export function habitService(): HabitService {
  if (!service) service = new HabitService(new SqliteHabitRepository(getDatabase()));
  return service;
}

interface HabitState {
  habits: Habit[];
  today: HabitProgressToday[];
  loading: boolean;

  refreshHabits: () => Promise<void>;
  refreshToday: () => Promise<void>;

  addHabit: (input: NewHabit) => Promise<void>;
  editHabit: (id: string, patch: Partial<NewHabit>) => Promise<void>;
  archiveHabit: (id: string, archived: boolean) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;

  toggleBinary: (habit: Habit) => Promise<void>;
  addAmount: (habit: Habit, delta: number) => Promise<void>;
  restartStreak: (habit: Habit) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  today: [],
  loading: false,

  refreshHabits: async () => {
    set({ habits: await habitService().list(true) });
  },

  refreshToday: async () => {
    set({ loading: true });
    try {
      set({ today: await habitService().todayProgress() });
    } finally {
      set({ loading: false });
    }
  },

  addHabit: async (input) => {
    const created = await habitService().create(input);
    await habitService().scheduleReminder(created);
    await get().refreshHabits();
    await get().refreshToday();
  },

  editHabit: async (id, patch) => {
    const updated = await habitService().update(id, patch);
    await habitService().scheduleReminder(updated);
    await get().refreshHabits();
    await get().refreshToday();
  },

  archiveHabit: async (id, archived) => {
    await habitService().archive(id, archived);
    if (archived) {
      await habitService().cancelReminder(id);
    } else {
      const updated = await habitService().getById(id);
      if (updated) await habitService().scheduleReminder(updated);
    }
    await get().refreshHabits();
    await get().refreshToday();
  },

  deleteHabit: async (id) => {
    await habitService().cancelReminder(id);
    await habitService().remove(id);
    await get().refreshHabits();
    await get().refreshToday();
  },

  toggleBinary: async (habit) => {
    await habitService().toggleBinary(habit);
    await get().refreshToday();
  },

  addAmount: async (habit, delta) => {
    await habitService().addAmount(habit, delta);
    await get().refreshToday();
  },

  restartStreak: async (habit) => {
    await habitService().logToday(habit);
    await get().refreshHabits();
    await get().refreshToday();
  },
}));
