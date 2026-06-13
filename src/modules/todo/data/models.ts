export type Priority = 0 | 1 | 2 | 3; // none, low, medium, high
export type RecurFreq = 'daily' | 'weekly' | 'monthly';

export interface TodoList {
  id: string;
  name: string;
  color?: string | null;
  icon?: string | null;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string | null;
}

export interface Task {
  id: string;
  listId: string;
  title: string;
  note?: string | null;
  priority: Priority;
  dueAt?: string | null;
  hasTime: boolean;
  starred: boolean;
  completed: boolean;
  completedAt?: string | null;
  sortOrder: number;
  recurFreq?: RecurFreq | null;
  recurInterval?: number | null;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
  tags?: Tag[];
}

export type NewTask = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'completed' | 'completedAt' | 'subtasks' | 'tags' | 'sortOrder'
> & {
  completed?: boolean;
  sortOrder?: number;
};

export type NewList = Omit<TodoList, 'id' | 'createdAt' | 'updatedAt' | 'isDefault' | 'sortOrder'> & {
  isDefault?: boolean;
  sortOrder?: number;
};

export interface TaskFilter {
  listId?: string;
  completed?: boolean;
  search?: string;
  tagId?: string;
  /** 'today' = due <= akhir hari ini & belum selesai (termasuk overdue) */
  view?: 'today' | 'upcoming' | 'all';
}
