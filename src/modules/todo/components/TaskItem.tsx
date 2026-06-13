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
import { trash, create as editIcon, star } from 'ionicons/icons';
import type { Task } from '../data/models';
import { useT } from '@/i18n/useT';
import { formatDate } from '@/lib/date';
import { useSettingsStore } from '@/store/settings.store';

const PRIORITY_COLOR = ['#94a3b8', '#0ea5e9', '#f59e0b', '#ef4444'];

interface Props {
  task: Task;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  const tr = useT();
  const locale = useSettingsStore((s) => s.locale);

  const overdue =
    !task.completed && task.dueAt && new Date(task.dueAt).getTime() < Date.now();

  return (
    <IonItemSliding>
      <IonItem className="tx-item">
        <IonCheckbox
          slot="start"
          checked={task.completed}
          onIonChange={() => onToggle(task)}
          aria-label={task.title}
        />
        <IonLabel
          onClick={() => onEdit(task)}
          style={{
            textDecoration: task.completed ? 'line-through' : 'none',
            opacity: task.completed ? 0.55 : 1,
          }}
        >
          <h2>
            {task.priority > 0 && (
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginRight: 8,
                  background: PRIORITY_COLOR[task.priority],
                }}
              />
            )}
            {task.title}
            {task.starred && (
              <IonIcon icon={star} style={{ color: '#f59e0b', marginLeft: 6, fontSize: 14 }} />
            )}
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
        <IonItemOption onClick={() => onEdit(task)}>
          <IonIcon slot="icon-only" icon={editIcon} />
        </IonItemOption>
        <IonItemOption color="danger" onClick={() => onDelete(task)}>
          <IonIcon slot="icon-only" icon={trash} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
}
