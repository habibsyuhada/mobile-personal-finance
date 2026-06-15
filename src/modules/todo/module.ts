import { checkboxOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import type { Database } from '@/data/db/database';
import { TODO_MIGRATIONS } from './data/migrations';
import { SqliteTodoRepository } from './data/todo.repo';
import { todoService } from './store/todo.store';
import { Notifications } from '@/platform/notifications';
import { useSettingsStore } from '@/store/settings.store';

// Seed: pastikan list default "Inbox" ada.
async function seedTodoDefaults(db: Database): Promise<void> {
  const repo = new SqliteTodoRepository(db);
  await repo.ensureDefaultList();
}

const NOON_ID = 'task:noon-summary';
const NOON_HOUR = 12;

function todayNoon(): Date {
  const d = new Date();
  d.setHours(NOON_HOUR, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d;
}

async function scheduleAllTaskReminders(): Promise<void> {
  const svc = todoService();
  const tasks = await svc.tasks({}); // semua task
  // Per-task reminders (due date).
  for (const t of tasks) {
    if (t.completed || !t.dueAt) continue;
    await svc.scheduleReminder(t);
  }
  // Noon summary: list up to 3 task due today/overdue yang belum selesai.
  if (useSettingsStore.getState().notifTaskNoonEnabled) {
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const dueToday = tasks
      .filter(
        (t) =>
          !t.completed && t.dueAt && new Date(t.dueAt).getTime() <= todayEnd.getTime()
      )
      .slice(0, 3);
    if (dueToday.length > 0) {
      const list = dueToday.map((t) => `• ${t.title}`).join('\n');
      const title =
        dueToday.length === 1
          ? 'Tenggat hari ini'
          : `${dueToday.length} tenggat hari ini`;
      await Notifications.schedule({
        id: NOON_ID,
        title,
        body: list,
        at: todayNoon().toISOString(),
        channel: Notifications.channelFor('task').id,
        extra: {
          kind: 'task',
          icon: null,
          categoryColor: null,
          priority: 2,
        },
      });
    }
  }
}

async function cancelAllTaskReminders(): Promise<void> {
  await Notifications.cancelChannel(Notifications.channelFor('task').id);
}

export const todoModule: ModuleDescriptor = {
  id: 'todo',
  nameKey: 'module.todo.name',
  icon: checkboxOutline,
  color: '#0ea5e9',
  order: 2,
  enabled: true,
  routePath: '/m/todo',
  component: () => import('./TodoRoot'),
  migrations: TODO_MIGRATIONS,
  init: seedTodoDefaults,
  tables: ['todo_lists', 'todo_tasks', 'todo_subtasks', 'todo_tags', 'todo_task_tags'],
  scheduleReminders: scheduleAllTaskReminders,
  cancelAllReminders: cancelAllTaskReminders,
};
