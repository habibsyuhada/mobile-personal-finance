import type { ITodoRepository } from '../data/todo.repo';
import type { NewTask, Task, TaskFilter } from '../data/models';
import { advanceDate } from '@/lib/recurrence';
import { Notifications } from '@/platform/notifications';

export class TodoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TodoValidationError';
  }
}

export class TodoService {
  constructor(private repo: ITodoRepository) {}

  lists() {
    return this.repo.listLists();
  }
  countActiveByList() {
    return this.repo.countActiveByList();
  }
  createList(name: string, color?: string | null) {
    if (!name.trim()) throw new TodoValidationError('List name is required');
    return this.repo.createList({ name: name.trim(), color });
  }
  updateList(id: string, patch: { name?: string; color?: string | null }) {
    return this.repo.updateList(id, patch);
  }
  removeList(id: string, reassignToId?: string) {
    return this.repo.removeList(id, reassignToId);
  }

  tasks(filter?: TaskFilter) {
    return this.repo.listTasks(filter);
  }
  getTask(id: string) {
    return this.repo.getTask(id);
  }

  createTask(input: NewTask): Promise<Task> {
    return (async () => {
      if (!input.title.trim()) throw new TodoValidationError('Title is required');
      return this.repo.createTask({ ...input, title: input.title.trim() });
    })();
  }

  updateTask(id: string, patch: Partial<NewTask>) {
    return this.repo.updateTask(id, patch);
  }

  removeTask(id: string) {
    return this.repo.removeTask(id);
  }

  /**
   * Toggle selesai. Jika menyelesaikan task berulang yang punya due date,
   * buat kemunculan berikutnya (T6.2).
   */
  async toggleComplete(task: Task): Promise<void> {
    const completing = !task.completed;
    await this.repo.setCompleted(task.id, completing);
    if (completing && task.recurFreq && task.dueAt) {
      const next = advanceDate(
        new Date(task.dueAt),
        task.recurFreq,
        task.recurInterval ?? 1
      );
      await this.repo.createTask({
        listId: task.listId,
        title: task.title,
        note: task.note ?? null,
        priority: task.priority,
        dueAt: next.toISOString(),
        hasTime: task.hasTime,
        starred: task.starred,
        recurFreq: task.recurFreq,
        recurInterval: task.recurInterval ?? 1,
        alarmTime: task.alarmTime ?? null,
      });
    }
  }

  // Subtasks
  listSubtasks(taskId: string) {
    return this.repo.listSubtasks(taskId);
  }
  addSubtask(taskId: string, title: string) {
    if (!title.trim()) throw new TodoValidationError('Subtask title is required');
    return this.repo.addSubtask(taskId, title.trim());
  }
  toggleSubtask(id: string, completed: boolean) {
    return this.repo.toggleSubtask(id, completed);
  }
  removeSubtask(id: string) {
    return this.repo.removeSubtask(id);
  }

  // Tags
  tags() {
    return this.repo.listTags();
  }
  createTag(name: string, color?: string | null) {
    if (!name.trim()) throw new TodoValidationError('Tag name is required');
    return this.repo.createTag(name.trim(), color);
  }
  removeTag(id: string) {
    return this.repo.removeTag(id);
  }
  setTaskTags(taskId: string, tagIds: string[]) {
    return this.repo.setTaskTags(taskId, tagIds);
  }

  /** Jadwalkan reminder due-date + alarm harian (jika ada) untuk satu task. */
  async scheduleReminder(task: Task): Promise<void> {
    await Notifications.cancel(`task:${task.id}`);
    await Notifications.cancel(`task:alarm:${task.id}`);
    if (task.completed) return;

    // 1) Reminder due date.
    if (task.dueAt) {
      const at = new Date(task.dueAt);
      if (!Number.isNaN(at.getTime())) {
        if (!task.hasTime) at.setHours(9, 0, 0, 0);
        if (at.getTime() > Date.now()) {
          await Notifications.schedule({
            id: `task:${task.id}`,
            title: 'Tenggat Tugas',
            body: task.title,
            at: at.toISOString(),
            channel: Notifications.channelFor('task').id,
            extra: {
              kind: 'task',
              taskId: task.id,
              icon: null,
              categoryColor: null,
              priority: task.priority,
            },
          });
        }
      }
    }

    // 2) Alarm harian absolut (jika user set 'HH:mm'). Fire tiap hari pada
    // jam tsb. Berhenti otomatis saat task ditandai selesai.
    if (task.alarmTime) {
      const m = /^(\d{1,2}):(\d{2})$/.exec(task.alarmTime);
      if (m) {
        const hh = Number(m[1]);
        const mm = Number(m[2]);
        const at = new Date();
        at.setHours(hh, mm, 0, 0);
        if (at.getTime() <= Date.now()) {
          // Lewat hari ini → jadwal besok.
          at.setDate(at.getDate() + 1);
        }
        await Notifications.schedule({
          id: `task:alarm:${task.id}`,
          title: 'Alarm Tugas',
          body: task.title,
          at: at.toISOString(),
          channel: Notifications.channelFor('task').id,
          extra: {
            kind: 'task',
            taskId: task.id,
            alarm: true,
            icon: null,
            categoryColor: null,
            priority: task.priority,
          },
        });
      }
    }
  }

  async cancelReminder(taskId: string): Promise<void> {
    await Notifications.cancel(`task:${taskId}`);
    await Notifications.cancel(`task:alarm:${taskId}`);
  }

  /** Tunda task 1 hari (atau jumlah hari tertentu) ke depan. */
  async postpone(task: Task, days = 1): Promise<Task | null> {
    if (!task.dueAt) return null;
    const current = new Date(task.dueAt);
    current.setDate(current.getDate() + days);
    const updated = await this.repo.updateTask(task.id, {
      dueAt: current.toISOString(),
      hasTime: task.hasTime,
    });
    await this.scheduleReminder(updated);
    return updated;
  }
}
