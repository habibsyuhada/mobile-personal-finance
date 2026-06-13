import { describe, it, expect, vi } from 'vitest';
import { TodoService, TodoValidationError } from './todo.service';
import type { ITodoRepository } from '../data/todo.repo';
import type { Task } from '../data/models';

function fakeRepo(): ITodoRepository {
  const created: unknown[] = [];
  const repo = {
    listLists: vi.fn(),
    createList: vi.fn(),
    updateList: vi.fn(),
    removeList: vi.fn(),
    countActiveByList: vi.fn(),
    ensureDefaultList: vi.fn(),
    listTasks: vi.fn(),
    getTask: vi.fn(),
    createTask: vi.fn(async (i) => {
      created.push(i);
      return { ...i, id: 'x', createdAt: 'x', updatedAt: 'x' } as Task;
    }),
    updateTask: vi.fn(),
    setCompleted: vi.fn(),
    removeTask: vi.fn(),
    listSubtasks: vi.fn(),
    addSubtask: vi.fn(),
    toggleSubtask: vi.fn(),
    removeSubtask: vi.fn(),
    listTags: vi.fn(),
    createTag: vi.fn(),
    removeTag: vi.fn(),
    tagsForTask: vi.fn(),
    setTaskTags: vi.fn(),
  } as unknown as ITodoRepository;
  return repo;
}

describe('TodoService', () => {
  it('rejects empty title', async () => {
    const svc = new TodoService(fakeRepo());
    await expect(
      svc.createTask({ listId: 'l', title: '   ', priority: 0, hasTime: false, starred: false })
    ).rejects.toBeInstanceOf(TodoValidationError);
  });

  it('trims title on create', async () => {
    const repo = fakeRepo();
    const svc = new TodoService(repo);
    await svc.createTask({ listId: 'l', title: '  Buy milk ', priority: 0, hasTime: false, starred: false });
    expect(repo.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Buy milk' })
    );
  });

  it('creates next occurrence when completing a recurring task', async () => {
    const repo = fakeRepo();
    const svc = new TodoService(repo);
    const task: Task = {
      id: 't1',
      listId: 'l',
      title: 'Weekly review',
      priority: 0,
      dueAt: '2026-01-01T09:00:00.000Z',
      hasTime: true,
      starred: false,
      completed: false,
      sortOrder: 0,
      recurFreq: 'weekly',
      recurInterval: 1,
      createdAt: 'x',
      updatedAt: 'x',
    };
    await svc.toggleComplete(task);
    expect(repo.setCompleted).toHaveBeenCalledWith('t1', true);
    expect(repo.createTask).toHaveBeenCalledWith(
      expect.objectContaining({ dueAt: '2026-01-08T09:00:00.000Z', recurFreq: 'weekly' })
    );
  });

  it('does not create occurrence when un-completing', async () => {
    const repo = fakeRepo();
    const svc = new TodoService(repo);
    const task = {
      id: 't2',
      listId: 'l',
      title: 'x',
      priority: 0,
      dueAt: '2026-01-01T00:00:00.000Z',
      hasTime: false,
      starred: false,
      completed: true,
      sortOrder: 0,
      recurFreq: 'daily',
      recurInterval: 1,
      createdAt: 'x',
      updatedAt: 'x',
    } as Task;
    await svc.toggleComplete(task);
    expect(repo.createTask).not.toHaveBeenCalled();
  });
});
