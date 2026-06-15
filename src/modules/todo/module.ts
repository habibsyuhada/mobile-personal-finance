import { checkboxOutline } from 'ionicons/icons';
import type { ModuleDescriptor } from '@/platform/types';
import type { Database } from '@/data/db/database';
import { TODO_MIGRATIONS } from './data/migrations';
import { SqliteTodoRepository } from './data/todo.repo';
import { todoService } from './store/todo.store';
import { Notifications } from '@/platform/notifications';

// Seed: pastikan list default "Inbox" ada.
async function seedTodoDefaults(db: Database): Promise<void> {
  const repo = new SqliteTodoRepository(db);
  await repo.ensureDefaultList();
}

async function scheduleAllTaskReminders(): Promise<void> {
  const svc = todoService();
  const tasks = await svc.tasks({}); // semua task
  for (const t of tasks) {
    if (t.completed || !t.dueAt) continue;
    await svc.scheduleReminder(t);
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
