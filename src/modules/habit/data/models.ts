export type HabitType = 'binary' | 'quantifiable';
export type Polarity = 'good' | 'bad';
export type ScheduleType = 'daily' | 'weekdays' | 'times_per_week';

export interface Habit {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type: HabitType;
  polarity: Polarity;
  target?: number | null;
  unit?: string | null;
  scheduleType: ScheduleType;
  weekdays?: number[] | null; // 1=Mon .. 7=Sun
  timesPerWeek?: number | null;
  reminderTime?: string | null; // 'HH:mm'
  archived: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface HabitLog {
  id: string;
  habitId: string;
  logDate: string; // 'YYYY-MM-DD' (local)
  amount: number;
}

export type NewHabit = Omit<
  Habit,
  'id' | 'createdAt' | 'updatedAt' | 'archived' | 'sortOrder'
> & {
  archived?: boolean;
  sortOrder?: number;
};

export interface HabitProgressToday {
  habit: Habit;
  done: boolean;
  amount: number;
}

export interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  completionRate30: number; // 0..1
}
