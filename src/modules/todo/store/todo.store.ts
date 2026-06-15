import { create } from 'zustand';
import { getDatabase } from '@/data/db/database';
import { SqliteTodoRepository } from '../data/todo.repo';
import { TodoService } from '../services/todo.service';
import type { Task, TodoList, Tag, TaskFilter, NewTask } from '../data/models';

let service: TodoService | null = null;
export function todoService(): TodoService {
  if (!service) service = new TodoService(new SqliteTodoRepository(getDatabase()));
  return service;
}

interface TodoState {
  lists: TodoList[];
  counts: Record<string, number>;
  tasks: Task[];
  tags: Tag[];
  loading: boolean;

  refreshLists: () => Promise<void>;
  refreshTags: () => Promise<void>;
  loadTasks: (filter?: TaskFilter) => Promise<void>;

  addTask: (input: NewTask) => Promise<void>;
  editTask: (id: string, patch: Partial<NewTask>, filter?: TaskFilter) => Promise<void>;
  toggle: (task: Task, filter?: TaskFilter) => Promise<void>;
  deleteTask: (id: string, filter?: TaskFilter) => Promise<void>;
}

export const useTodoStore = create<TodoState>((set, get) => ({
  lists: [],
  counts: {},
  tasks: [],
  tags: [],
  loading: false,

  refreshLists: async () => {
    const svc = todoService();
    const [lists, counts] = await Promise.all([svc.lists(), svc.countActiveByList()]);
    set({ lists, counts });
  },

  refreshTags: async () => {
    set({ tags: await todoService().tags() });
  },

  loadTasks: async (filter) => {
    set({ loading: true });
    try {
      set({ tasks: await todoService().tasks(filter) });
    } finally {
      set({ loading: false });
    }
  },

  addTask: async (input) => {
    const created = await todoService().createTask(input);
    await todoService().scheduleReminder(created);
    await get().refreshLists();
  },

  editTask: async (id, patch, filter) => {
    const updated = await todoService().updateTask(id, patch);
    await todoService().scheduleReminder(updated);
    await get().loadTasks(filter);
    await get().refreshLists();
  },

  toggle: async (task, filter) => {
    await todoService().toggleComplete(task);
    // Selesai -> cancel reminder; toggle ke uncompleted -> reschedule.
    const fresh = await todoService().getTask(task.id);
    if (fresh) await todoService().scheduleReminder(fresh);
    else await todoService().cancelReminder(task.id);
    await get().loadTasks(filter);
    await get().refreshLists();
  },

  deleteTask: async (id, filter) => {
    await todoService().cancelReminder(id);
    await todoService().removeTask(id);
    await get().loadTasks(filter);
    await get().refreshLists();
  },
}));
