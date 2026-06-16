// Habit bundles: kumpulan habit preset yang dibuat bersamaan dengan
// reminder time yang disinkronkan.

import type { NewHabit } from '@/modules/habit/data/models';

export interface HabitTemplate {
  nameKey: string;
  descriptionKey?: string;
  type: 'binary' | 'quantifiable';
  color: string;
  icon?: string;
  polarity: 'good' | 'bad';
  target?: number;
  unit?: string;
  scheduleType: 'daily' | 'weekdays' | 'times_per_week';
  weekdays?: number[];
  timesPerWeek?: number;
}

export interface HabitBundle {
  id: string;
  emoji: string;
  titleKey:
    | 'tmpl.habit.healthyMorning.title'
    | 'tmpl.habit.mindfulEvening.title'
    | 'tmpl.habit.fitnessBasics.title'
    | 'tmpl.habit.studyFlow.title';
  descriptionKey:
    | 'tmpl.habit.healthyMorning.desc'
    | 'tmpl.habit.mindfulEvening.desc'
    | 'tmpl.habit.fitnessBasics.desc'
    | 'tmpl.habit.studyFlow.desc';
  /** Reminder HH:mm yang diterapkan ke semua habit dalam bundle. */
  reminderTime: string;
  habits: HabitTemplate[];
}

export const HABIT_BUNDLES: HabitBundle[] = [
  {
    id: 'healthy-morning',
    emoji: '🌅',
    titleKey: 'tmpl.habit.healthyMorning.title',
    descriptionKey: 'tmpl.habit.healthyMorning.desc',
    reminderTime: '06:30',
    habits: [
      {
        nameKey: 'tmpl.habit.healthyMorning.water.name',
        type: 'quantifiable',
        target: 1,
        unit: 'glass',
        color: '#0ea5e9',
        polarity: 'good',
        scheduleType: 'daily',
      },
      {
        nameKey: 'tmpl.habit.healthyMorning.exercise.name',
        type: 'quantifiable',
        target: 30,
        unit: 'min',
        color: '#16a34a',
        polarity: 'good',
        scheduleType: 'daily',
      },
      {
        nameKey: 'tmpl.habit.healthyMorning.meditate.name',
        type: 'quantifiable',
        target: 10,
        unit: 'min',
        color: '#8b5cf6',
        polarity: 'good',
        scheduleType: 'daily',
      },
    ],
  },
  {
    id: 'mindful-evening',
    emoji: '🌙',
    titleKey: 'tmpl.habit.mindfulEvening.title',
    descriptionKey: 'tmpl.habit.mindfulEvening.desc',
    reminderTime: '21:30',
    habits: [
      {
        nameKey: 'tmpl.habit.mindfulEvening.read.name',
        type: 'quantifiable',
        target: 20,
        unit: 'min',
        color: '#6366f1',
        polarity: 'good',
        scheduleType: 'daily',
      },
      {
        nameKey: 'tmpl.habit.mindfulEvening.journal.name',
        type: 'binary',
        color: '#ec4899',
        polarity: 'good',
        scheduleType: 'daily',
      },
      {
        nameKey: 'tmpl.habit.mindfulEvening.noscreen.name',
        type: 'binary',
        color: '#f59e0b',
        polarity: 'bad',
        scheduleType: 'daily',
      },
    ],
  },
  {
    id: 'fitness-basics',
    emoji: '💪',
    titleKey: 'tmpl.habit.fitnessBasics.title',
    descriptionKey: 'tmpl.habit.fitnessBasics.desc',
    reminderTime: '18:00',
    habits: [
      {
        nameKey: 'tmpl.habit.fitnessBasics.steps.name',
        type: 'quantifiable',
        target: 8000,
        unit: 'steps',
        color: '#16a34a',
        polarity: 'good',
        scheduleType: 'daily',
      },
      {
        nameKey: 'tmpl.habit.fitnessBasics.water.name',
        type: 'quantifiable',
        target: 8,
        unit: 'glasses',
        color: '#0ea5e9',
        polarity: 'good',
        scheduleType: 'daily',
      },
      {
        nameKey: 'tmpl.habit.fitnessBasics.sleep.name',
        type: 'quantifiable',
        target: 7,
        unit: 'h',
        color: '#6366f1',
        polarity: 'good',
        scheduleType: 'daily',
      },
    ],
  },
  {
    id: 'study-flow',
    emoji: '📚',
    titleKey: 'tmpl.habit.studyFlow.title',
    descriptionKey: 'tmpl.habit.studyFlow.desc',
    reminderTime: '20:00',
    habits: [
      {
        nameKey: 'tmpl.habit.studyFlow.read.name',
        type: 'quantifiable',
        target: 30,
        unit: 'min',
        color: '#8b5cf6',
        polarity: 'good',
        scheduleType: 'weekdays',
        weekdays: [1, 2, 3, 4, 5],
      },
      {
        nameKey: 'tmpl.habit.studyFlow.review.name',
        type: 'binary',
        color: '#ec4899',
        polarity: 'good',
        scheduleType: 'times_per_week',
        timesPerWeek: 3,
      },
    ],
  },
];

/** Konversi template habit menjadi NewHabit siap pakai (sama reminder time). */
export function templateToNewHabit(
  tmpl: HabitTemplate,
  reminderTime: string,
  translate: (k: string) => string
): NewHabit {
  return {
    name: translate(tmpl.nameKey),
    icon: tmpl.icon ?? null,
    color: tmpl.color,
    type: tmpl.type,
    polarity: tmpl.polarity,
    target: tmpl.target ?? null,
    unit: tmpl.unit ?? null,
    scheduleType: tmpl.scheduleType,
    weekdays: tmpl.weekdays ?? null,
    timesPerWeek: tmpl.timesPerWeek ?? null,
    reminderTime,
  };
}
