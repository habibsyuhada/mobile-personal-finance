import { flameOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import { HABIT_MIGRATIONS } from './data/migrations';
import { Notifications } from '@/platform/notifications';
import { habitService } from './store/habit.store';

async function scheduleAllHabitReminders(): Promise<void> {
  if (!Notifications.isNative()) {
    // Di web, in-app banner otomatis dari schedule(); tapi schedule() butuh
    // recordId — kita panggil langsung via service agar banner konsisten.
  }
  const habits = await habitService().list(false);
  for (const h of habits) {
    if (!h.reminderTime || h.archived) continue;
    const [hh, mm] = h.reminderTime.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) continue;
    const now = new Date();
    const next = new Date();
    next.setHours(hh, mm, 0, 0);
    if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
    await Notifications.schedule({
      id: `habit:${h.id}`,
      title: 'Habit Reminder',
      body: `Waktunya: ${h.name}`,
      at: next.toISOString(),
      channel: Notifications.channelFor('habit').id,
      extra: {
        kind: 'habit',
        habitId: h.id,
        icon: h.icon ?? null,
        categoryColor: h.color ?? null,
      },
    });
  }
}

async function cancelAllHabitReminders(): Promise<void> {
  await Notifications.cancelChannel(Notifications.channelFor('habit').id);
}

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
  scheduleReminders: scheduleAllHabitReminders,
  cancelAllReminders: cancelAllHabitReminders,
};
