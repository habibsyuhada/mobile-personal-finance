import type { Insight } from '@/lib/insights';
import { todoService } from '../store/todo.store';
import { formatDate } from '@/lib/date';
import { useSettingsStore } from '@/store/settings.store';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export async function generateTaskInsights(): Promise<Insight[]> {
  const s = useSettingsStore.getState();
  const all = await todoService().tasks({});
  const out: Insight[] = [];
  if (all.length === 0) return out;

  const completed = all.filter((t) => t.completed);
  const overdue = all.filter(
    (t) => !t.completed && t.dueAt && new Date(t.dueAt).getTime() < Date.now() - MS_PER_DAY
  );

  // Completion rate last 7 days.
  const last7 = Date.now() - 7 * MS_PER_DAY;
  const last7Completed = completed.filter((t) => {
    const ts = t.completedAt ? new Date(t.completedAt).getTime() : 0;
    return ts >= last7;
  });
  if (completed.length > 0) {
    const rate = (last7Completed.length / Math.max(1, all.length)) * 100;
    out.push({
      id: 'task.week-rate',
      emoji: '📊',
      title: 'This week',
      body: `${last7Completed.length} task${last7Completed.length === 1 ? '' : 's'} completed · ${Math.round(rate)}% of total.`,
      priority: 'low',
    });
  }

  // Overdue warning.
  if (overdue.length > 0) {
    out.push({
      id: 'task.overdue',
      emoji: '⏰',
      title: 'Overdue tasks',
      body: `${overdue.length} task${overdue.length === 1 ? '' : 's'} past due. Want to reschedule?`,
      priority: overdue.length > 3 ? 'high' : 'medium',
    });
  }

  // Starred attention.
  const starred = all.filter((t) => t.starred && !t.completed);
  if (starred.length > 0) {
    out.push({
      id: 'task.starred',
      emoji: '⭐',
      title: 'Starred tasks',
      body: `${starred.length} important task${starred.length === 1 ? '' : 's'} pending. ${formatDate(starred[0].dueAt ?? '', s.locale)}`,
      priority: 'low',
    });
  }

  return out.slice(0, 3);
}
