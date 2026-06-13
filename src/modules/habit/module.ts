import { flameOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import { HABIT_MIGRATIONS } from './data/migrations';

export const habitModule: ModuleDescriptor = {
  id: 'habit',
  nameKey: 'module.habit.name',
  icon: flameOutline,
  color: '#f59e0b',
  order: 3,
  enabled: true,
  routePath: '/m/habit',
  component: () => import('./HabitRoot'),
  migrations: HABIT_MIGRATIONS,
  tables: ['habit_habits', 'habit_logs'],
};
