// Task templates yang ditawarkan saat membuat task baru.
// Definisi tetap di kode (bukan DB) agar kualitas terjaga — user tidak perlu manage-nya.

import type { NewTask, Priority, RecurFreq } from '@/modules/todo/data/models';

export interface TaskTemplate {
  id: string;
  emoji: string;
  /** Translation key untuk judul (i18n) */
  titleKey:
    | 'tmpl.task.weeklyReview.title'
    | 'tmpl.task.errands.title'
    | 'tmpl.task.deepWork.title'
    | 'tmpl.task.inboxZero.title'
    | 'tmpl.task.workout.title'
    | 'tmpl.task.mealPrep.title';
  descriptionKey:
    | 'tmpl.task.weeklyReview.desc'
    | 'tmpl.task.errands.desc'
    | 'tmpl.task.deepWork.desc'
    | 'tmpl.task.inboxZero.desc'
    | 'tmpl.task.workout.desc'
    | 'tmpl.task.mealPrep.desc';
  priority: Priority;
  recurFreq?: RecurFreq;
  starred?: boolean;
  noteKey?:
    | 'tmpl.task.weeklyReview.note'
    | 'tmpl.task.errands.note'
    | 'tmpl.task.deepWork.note'
    | 'tmpl.task.inboxZero.note'
    | 'tmpl.task.workout.note'
    | 'tmpl.task.mealPrep.note';
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'weekly-review',
    emoji: '🗓️',
    titleKey: 'tmpl.task.weeklyReview.title',
    descriptionKey: 'tmpl.task.weeklyReview.desc',
    noteKey: 'tmpl.task.weeklyReview.note',
    priority: 2,
    recurFreq: 'weekly',
    starred: false,
  },
  {
    id: 'errands',
    emoji: '🛒',
    titleKey: 'tmpl.task.errands.title',
    descriptionKey: 'tmpl.task.errands.desc',
    noteKey: 'tmpl.task.errands.note',
    priority: 1,
    recurFreq: 'weekly',
  },
  {
    id: 'deep-work',
    emoji: '🧠',
    titleKey: 'tmpl.task.deepWork.title',
    descriptionKey: 'tmpl.task.deepWork.desc',
    priority: 3,
    starred: true,
  },
  {
    id: 'inbox-zero',
    emoji: '📥',
    titleKey: 'tmpl.task.inboxZero.title',
    descriptionKey: 'tmpl.task.inboxZero.desc',
    noteKey: 'tmpl.task.inboxZero.note',
    priority: 2,
    recurFreq: 'daily',
  },
  {
    id: 'workout',
    emoji: '🏋️',
    titleKey: 'tmpl.task.workout.title',
    descriptionKey: 'tmpl.task.workout.desc',
    priority: 2,
    recurFreq: 'weekly',
  },
  {
    id: 'meal-prep',
    emoji: '🍱',
    titleKey: 'tmpl.task.mealPrep.title',
    descriptionKey: 'tmpl.task.mealPrep.desc',
    priority: 1,
    recurFreq: 'weekly',
  },
];

/** Konversi template menjadi input NewTask (tanpa listId, akan diisi oleh caller). */
export function templateToNewTask(
  tmpl: TaskTemplate,
  translate: (k: string) => string,
  extras: Partial<NewTask> = {}
): NewTask {
  return {
    listId: extras.listId ?? '',
    title: translate(tmpl.titleKey),
    note: tmpl.noteKey ? translate(tmpl.noteKey) : null,
    priority: tmpl.priority,
    dueAt: extras.dueAt ?? null,
    hasTime: extras.hasTime ?? false,
    starred: tmpl.starred ?? false,
    recurFreq: tmpl.recurFreq ?? null,
    recurInterval: tmpl.recurFreq ? 1 : null,
    ...extras,
  };
}
