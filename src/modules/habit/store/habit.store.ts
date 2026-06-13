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
    await habitService().create(input);
    await get().refreshHabits();
    await get().refreshToday();
  },

  editHabit: async (id, patch) => {
    await habitService().update(id, patch);
    await get().refreshHabits();
    await get().refreshToday();
  },

  archiveHabit: async (id, archived) => {
    await habitService().archive(id, archived);
    await get().refreshHabits();
    await get().refreshToday();
  },

  deleteHabit: async (id) => {
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
}));
