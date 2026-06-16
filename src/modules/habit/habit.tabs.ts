import { todayOutline, listOutline } from 'ionicons/icons';
import type { ModuleTab } from '@/app/ModuleBottomNav';

export const HABIT_TABS: ModuleTab[] = [
  { key: 'today', value: '/m/habit/today', icon: todayOutline, labelKey: 'habit.today' },
  { key: 'all', value: '/m/habit/all', icon: listOutline, labelKey: 'habit.all' },
];
