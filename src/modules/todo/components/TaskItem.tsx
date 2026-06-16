import {
  IonItem,
  IonLabel,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCheckbox,
  IonNote,
} from '@ionic/react';
import { trash, create as editIcon, star, calendarOutline } from 'ionicons/icons';
import type { Task } from '../data/models';
import { useT } from '@/i18n/useT';
import { formatDate } from '@/lib/date';
import { useSettingsStore } from '@/store/settings.store';
import { haptics } from '@/lib/haptics';

const PRIORITY_COLOR = ['#94a3b8', '#0ea5e9', '#f59e0b', '#ef4444'];

interface Props {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onPostpone?: (t: Task) => void;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete, onPostpone }: Props) {
  const tr = useT();
  const locale = useSettingsStore((s) => s.locale);

  const overdue =
    !task.completed && task.dueAt && new Date(task.dueAt).getTime() < Date.now();

  return (
    <IonItemSliding>
      <IonItem
        className="tx-item"
        style={{
          transition: 'opacity 280ms ease, transform 320ms ease',
          opacity: task.completed ? 0.55 : 1,
        }}
      >
        {/* Priority ring (kiri) */}
        <div
          slot="start"
          aria-hidden="true"
          style={{
            width: 4,
            alignSelf: 'stretch',
            borderRadius: 4,
            background:
              task.priority > 0
                ? `linear-gradient(180deg, ${PRIORITY_COLOR[task.priority]}, ${PRIORITY_COLOR[task.priority]}88)`
                : 'transparent',
            marginRight: 12,
          }}
        />

        <IonCheckbox
          checked={task.completed}
          onIonChange={() => {
            haptics.medium();
            onToggle(task);
          }}
          aria-label={task.title}
          style={{ marginRight: 12 }}
        />

        <IonLabel onClick={() => onEdit(task)}>
          <h2
            style={{
              textDecoration: task.completed ? 'line-through' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {task.starred && (
              <IonIcon
                icon={star}
                style={{ color: '#f59e0b', fontSize: 14 }}
                aria-label="Starred"
              />
            )}
            {task.title}
          </h2>
          {task.dueAt && (
            <p style={{ color: overdue ? 'var(--app-expense)' : undefined }}>
              {overdue ? `${tr('todo.overdue')} · ` : ''}
              {formatDate(task.dueAt, locale)}
            </p>
          )}
          {task.note && <p>{task.note}</p>}
        </IonLabel>

        {task.subtasks && task.subtasks.length > 0 && (
          <IonNote slot="end">
            {task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length}
          </IonNote>
        )}
      </IonItem>
      <IonItemOptions side="end">
        {onPostpone && task.dueAt && !task.completed && (
          <IonItemOption color="primary" onClick={() => { haptics.tap(); onPostpone(task); }}>
            <IonIcon slot="icon-only" icon={calendarOutline} />
          </IonItemOption>
        )}
        <IonItemOption onClick={() => { haptics.tap(); onEdit(task); }}>
          <IonIcon slot="icon-only" icon={editIcon} />
        </IonItemOption>
        <IonItemOption color="danger" onClick={() => { haptics.tap(); onDelete(task); }}>
          <IonIcon slot="icon-only" icon={trash} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
}
