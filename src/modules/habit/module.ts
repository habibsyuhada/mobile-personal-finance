import { flameOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import { HABIT_MIGRATIONS } from './data/migrations';
import { Notifications } from '@/platform/notifications';
import { habitService } from './store/habit.store';
import { useSettingsStore } from '@/store/settings.store';

const NOON_ID_PREFIX = 'habit:noon:';
const NOON_HOUR = 12; // 12:00 local
const NOON_MINUTE = 0;

function todayNoon(): Date {
  const d = new Date();
  d.setHours(NOON_HOUR, NOON_MINUTE, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

async function scheduleAllHabitReminders(): Promise<void> {
  const habits = await habitService().list(false);
  for (const h of habits) {
    if (h.archived) continue;
    // Reminder harian dari reminderTime.
    if (h.reminderTime) {
      const [hh, mm] = h.reminderTime.split(':').map(Number);
      if (!Number.isNaN(hh) && !Number.isNaN(mm)) {
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
  }
  // Noon nudge per habit: "belum check-in hari ini" (satu notif per habit).
  if (useSettingsStore.getState().notifHabitNoonEnabled) {
    for (const h of habits) {
      if (h.archived) continue;
      const noon = todayNoon();
      await Notifications.schedule({
        id: `${NOON_ID_PREFIX}${h.id}`,
        title: 'Habit Reminder',
        body: `Jangan lupa cek-in: ${h.name}`,
        at: noon.toISOString(),
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
