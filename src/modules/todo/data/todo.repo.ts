import type { Database } from '@/data/db/database';
import { persistWeb } from '@/data/db/database';
import { newId, nowIso } from '@/lib/id';
import type {
  NewList,
  NewTask,
  Subtask,
  Tag,
  Task,
  TaskFilter,
  TodoList,
} from './models';

type Row = Record<string, unknown>;

function mapList(r: Row): TodoList {
  return {
    id: String(r.id),
    name: String(r.name),
    color: (r.color as string) ?? null,
    icon: (r.icon as string) ?? null,
    isDefault: Number(r.is_default) === 1,
    sortOrder: Number(r.sort_order),
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapTask(r: Row): Task {
  return {
    id: String(r.id),
    listId: String(r.list_id),
    title: String(r.title),
    note: (r.note as string) ?? null,
    priority: Number(r.priority) as Task['priority'],
    dueAt: (r.due_at as string) ?? null,
    hasTime: Number(r.has_time) === 1,
    starred: Number(r.starred) === 1,
    completed: Number(r.completed) === 1,
    completedAt: (r.completed_at as string) ?? null,
    sortOrder: Number(r.sort_order),
    recurFreq: (r.recur_freq as Task['recurFreq']) ?? null,
    recurInterval: r.recur_interval != null ? Number(r.recur_interval) : null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function mapSubtask(r: Row): Subtask {
  return {
    id: String(r.id),
    taskId: String(r.task_id),
    title: String(r.title),
    completed: Number(r.completed) === 1,
    sortOrder: Number(r.sort_order),
  };
}

function mapTag(r: Row): Tag {
  return {
    id: String(r.id),
    name: String(r.name),
    color: (r.color as string) ?? null,
  };
}

export interface ITodoRepository {
  listLists(): Promise<TodoList[]>;
  createList(input: NewList): Promise<TodoList>;
  updateList(id: string, patch: Partial<NewList>): Promise<TodoList>;
  removeList(id: string, reassignToId?: string): Promise<void>;
  countActiveByList(): Promise<Record<string, number>>;
  ensureDefaultList(): Promise<TodoList>;

  listTasks(filter?: TaskFilter): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(input: NewTask): Promise<Task>;
  updateTask(id: string, patch: Partial<NewTask>): Promise<Task>;
  setCompleted(id: string, completed: boolean): Promise<void>;
  removeTask(id: string): Promise<void>;

  listSubtasks(taskId: string): Promise<Subtask[]>;
  addSubtask(taskId: string, title: string): Promise<Subtask>;
  toggleSubtask(id: string, completed: boolean): Promise<void>;
  removeSubtask(id: string): Promise<void>;

  listTags(): Promise<Tag[]>;
  createTag(name: string, color?: string | null): Promise<Tag>;
  removeTag(id: string): Promise<void>;
  tagsForTask(taskId: string): Promise<Tag[]>;
  setTaskTags(taskId: string, tagIds: string[]): Promise<void>;
}

export class SqliteTodoRepository implements ITodoRepository {
  constructor(private db: Database) {}

  // ---- Lists ----
  async listLists(): Promise<TodoList[]> {
    const res = await this.db.query(
      `SELECT * FROM todo_lists ORDER BY is_default DESC, sort_order, name COLLATE NOCASE;`
    );
    return res.values.map(mapList);
  }

  async ensureDefaultList(): Promise<TodoList> {
    const res = await this.db.query(`SELECT * FROM todo_lists WHERE is_default = 1 LIMIT 1;`);
    if (res.values.length) return mapList(res.values[0]);
    const now = nowIso();
    const list: TodoList = {
      id: newId(),
      name: 'Inbox',
      color: '#6366f1',
      icon: null,
      isDefault: true,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO todo_lists (id, name, color, icon, is_default, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, ?, ?);`,
      [list.id, list.name, list.color, list.icon, now, now]
    );
    await persistWeb();
    return list;
  }

  async createList(input: NewList): Promise<TodoList> {
    const now = nowIso();
    const list: TodoList = {
      id: newId(),
      name: input.name,
      color: input.color ?? null,
      icon: input.icon ?? null,
      isDefault: input.isDefault ?? false,
      sortOrder: input.sortOrder ?? 0,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO todo_lists (id, name, color, icon, is_default, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [list.id, list.name, list.color, list.icon, list.isDefault ? 1 : 0, list.sortOrder, now, now]
    );
    await persistWeb();
    return list;
  }

  async updateList(id: string, patch: Partial<NewList>): Promise<TodoList> {
    const res = await this.db.query(`SELECT * FROM todo_lists WHERE id = ?;`, [id]);
    if (!res.values.length) throw new Error('List not found');
    const existing = mapList(res.values[0]);
    const merged = { ...existing, ...patch, updatedAt: nowIso() };
    await this.db.run(
      `UPDATE todo_lists SET name = ?, color = ?, icon = ?, sort_order = ?, updated_at = ? WHERE id = ?;`,
      [merged.name, merged.color ?? null, merged.icon ?? null, merged.sortOrder, merged.updatedAt, id]
    );
    await persistWeb();
    return merged;
  }

  async removeList(id: string, reassignToId?: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      if (reassignToId) {
        await tx.run(`UPDATE todo_tasks SET list_id = ? WHERE list_id = ?;`, [reassignToId, id]);
      } else {
        await tx.run(`DELETE FROM todo_tasks WHERE list_id = ?;`, [id]);
      }
      await tx.run(`DELETE FROM todo_lists WHERE id = ?;`, [id]);
    });
    await persistWeb();
  }

  async countActiveByList(): Promise<Record<string, number>> {
    const res = await this.db.query(
      `SELECT list_id, COUNT(*) AS c FROM todo_tasks WHERE completed = 0 GROUP BY list_id;`
    );
    const map: Record<string, number> = {};
    for (const r of res.values) map[String(r.list_id)] = Number(r.c);
    return map;
  }

  // ---- Tasks ----
  async listTasks(filter: TaskFilter = {}): Promise<Task[]> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (filter.listId) {
      where.push('list_id = ?');
      params.push(filter.listId);
    }
    if (filter.completed != null) {
      where.push('completed = ?');
      params.push(filter.completed ? 1 : 0);
    }
    if (filter.search) {
      where.push('(title LIKE ? OR note LIKE ?)');
      params.push(`%${filter.search}%`, `%${filter.search}%`);
    }
    if (filter.view === 'today') {
      where.push('completed = 0 AND due_at IS NOT NULL AND due_at <= ?');
      params.push(endOfTodayIso());
    } else if (filter.view === 'upcoming') {
      where.push('completed = 0 AND due_at IS NOT NULL AND due_at > ?');
      params.push(endOfTodayIso());
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const order =
      filter.view === 'today' || filter.view === 'upcoming'
        ? 'ORDER BY due_at ASC'
        : 'ORDER BY completed ASC, sort_order ASC, created_at DESC';
    const res = await this.db.query(`SELECT * FROM todo_tasks ${whereClause} ${order};`, params);
    let tasks = res.values.map(mapTask);
    if (filter.tagId) {
      const tt = await this.db.query(`SELECT task_id FROM todo_task_tags WHERE tag_id = ?;`, [
        filter.tagId,
      ]);
      const ids = new Set(tt.values.map((r) => String(r.task_id)));
      tasks = tasks.filter((t) => ids.has(t.id));
    }
    return tasks;
  }

  async getTask(id: string): Promise<Task | null> {
    const res = await this.db.query(`SELECT * FROM todo_tasks WHERE id = ?;`, [id]);
    if (!res.values.length) return null;
    const task = mapTask(res.values[0]);
    task.subtasks = await this.listSubtasks(id);
    task.tags = await this.tagsForTask(id);
    return task;
  }

  async createTask(input: NewTask): Promise<Task> {
    const now = nowIso();
    const task: Task = {
      id: newId(),
      listId: input.listId,
      title: input.title,
      note: input.note ?? null,
      priority: input.priority ?? 0,
      dueAt: input.dueAt ?? null,
      hasTime: input.hasTime ?? false,
      starred: input.starred ?? false,
      completed: input.completed ?? false,
      completedAt: null,
      sortOrder: input.sortOrder ?? 0,
      recurFreq: input.recurFreq ?? null,
      recurInterval: input.recurInterval ?? null,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO todo_tasks
        (id, list_id, title, note, priority, due_at, has_time, starred, completed,
         completed_at, sort_order, recur_freq, recur_interval, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        task.id,
        task.listId,
        task.title,
        task.note,
        task.priority,
        task.dueAt,
        task.hasTime ? 1 : 0,
        task.starred ? 1 : 0,
        task.completed ? 1 : 0,
        task.completedAt,
        task.sortOrder,
        task.recurFreq,
        task.recurInterval,
        task.createdAt,
        task.updatedAt,
      ]
    );
    await persistWeb();
    return task;
  }

  async updateTask(id: string, patch: Partial<NewTask>): Promise<Task> {
    const existing = await this.getTask(id);
    if (!existing) throw new Error('Task not found');
    const merged: Task = { ...existing, ...patch, updatedAt: nowIso() };
    await this.db.run(
      `UPDATE todo_tasks SET list_id = ?, title = ?, note = ?, priority = ?, due_at = ?,
         has_time = ?, starred = ?, recur_freq = ?, recur_interval = ?, updated_at = ? WHERE id = ?;`,
      [
        merged.listId,
        merged.title,
        merged.note ?? null,
        merged.priority,
        merged.dueAt ?? null,
        merged.hasTime ? 1 : 0,
        merged.starred ? 1 : 0,
        merged.recurFreq ?? null,
        merged.recurInterval ?? null,
        merged.updatedAt,
        id,
      ]
    );
    await persistWeb();
    return merged;
  }

  async setCompleted(id: string, completed: boolean): Promise<void> {
    await this.db.run(
      `UPDATE todo_tasks SET completed = ?, completed_at = ?, updated_at = ? WHERE id = ?;`,
      [completed ? 1 : 0, completed ? nowIso() : null, nowIso(), id]
    );
    await persistWeb();
  }

  async removeTask(id: string): Promise<void> {
    await this.db.run(`DELETE FROM todo_tasks WHERE id = ?;`, [id]);
    await persistWeb();
  }

  // ---- Subtasks ----
  async listSubtasks(taskId: string): Promise<Subtask[]> {
    const res = await this.db.query(
      `SELECT * FROM todo_subtasks WHERE task_id = ? ORDER BY sort_order, rowid;`,
      [taskId]
    );
    return res.values.map(mapSubtask);
  }

  async addSubtask(taskId: string, title: string): Promise<Subtask> {
    const sub: Subtask = { id: newId(), taskId, title, completed: false, sortOrder: 0 };
    await this.db.run(
      `INSERT INTO todo_subtasks (id, task_id, title, completed, sort_order) VALUES (?, ?, ?, 0, 0);`,
      [sub.id, taskId, title]
    );
    await persistWeb();
    return sub;
  }

  async toggleSubtask(id: string, completed: boolean): Promise<void> {
    await this.db.run(`UPDATE todo_subtasks SET completed = ? WHERE id = ?;`, [
      completed ? 1 : 0,
      id,
    ]);
    await persistWeb();
  }

  async removeSubtask(id: string): Promise<void> {
    await this.db.run(`DELETE FROM todo_subtasks WHERE id = ?;`, [id]);
    await persistWeb();
  }

  // ---- Tags ----
  async listTags(): Promise<Tag[]> {
    const res = await this.db.query(`SELECT * FROM todo_tags ORDER BY name COLLATE NOCASE;`);
    return res.values.map(mapTag);
  }

  async createTag(name: string, color?: string | null): Promise<Tag> {
    const tag: Tag = { id: newId(), name, color: color ?? null };
    await this.db.run(`INSERT INTO todo_tags (id, name, color) VALUES (?, ?, ?);`, [
      tag.id,
      tag.name,
      tag.color,
    ]);
    await persistWeb();
    return tag;
  }

  async removeTag(id: string): Promise<void> {
    await this.db.run(`DELETE FROM todo_tags WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async tagsForTask(taskId: string): Promise<Tag[]> {
    const res = await this.db.query(
      `SELECT t.* FROM todo_tags t
       JOIN todo_task_tags tt ON tt.tag_id = t.id
       WHERE tt.task_id = ? ORDER BY t.name COLLATE NOCASE;`,
      [taskId]
    );
    return res.values.map(mapTag);
  }

  async setTaskTags(taskId: string, tagIds: string[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.run(`DELETE FROM todo_task_tags WHERE task_id = ?;`, [taskId]);
      for (const tagId of tagIds) {
        await tx.run(`INSERT INTO todo_task_tags (task_id, tag_id) VALUES (?, ?);`, [taskId, tagId]);
      }
    });
    await persistWeb();
  }
}

function endOfTodayIso(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}
