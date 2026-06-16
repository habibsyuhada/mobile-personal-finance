import { todayOutline, calendarOutline, listOutline } from 'ionicons/icons';
import type { ModuleTab } from '@/app/ModuleBottomNav';

export const TODO_TABS: ModuleTab[] = [
  { key: 'today', value: '/m/todo/today', icon: todayOutline, labelKey: 'todo.today' },
  { key: 'upcoming', value: '/m/todo/upcoming', icon: calendarOutline, labelKey: 'todo.upcoming' },
  { key: 'lists', value: '/m/todo/lists', icon: listOutline, labelKey: 'todo.lists' },
];
