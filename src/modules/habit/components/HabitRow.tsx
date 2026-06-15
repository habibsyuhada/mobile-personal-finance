import {
  IonItem,
  IonLabel,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonButton,
  IonNote,
} from '@ionic/react';
import {
  trash,
  create as editIcon,
  removeCircle,
  addCircle,
  flame,
  archiveOutline,
} from 'ionicons/icons';
import type { Habit, HabitProgressToday } from '../data/models';
import { ProgressRing } from './ProgressRing';
import { haptics } from '@/lib/haptics';
import { iconForCategory } from '@/lib/categoryIcons';

interface Props {
  progress: HabitProgressToday;
  streak: number;
  onToggle: (h: Habit) => void;
  onAdd: (h: Habit, delta: number) => void;
  onEdit: (h: Habit) => void;
  onDelete: (h: Habit) => void;
  onArchive: (h: Habit) => void;
}

export default function HabitRow({
  progress,
  streak,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  onArchive,
}: Props) {
  const { habit, amount, done } = progress;
  const isQuant = habit.type === 'quantifiable';
  const ratio = isQuant && habit.target ? Math.min(1, amount / habit.target) : done ? 1 : 0;

  const handleToggle = () => {
    haptics.medium();
    onToggle(habit);
  };
  const handleAdd = (delta: number) => {
    haptics.tap();
    onAdd(habit, delta);
  };
  const handleEdit = () => {
    haptics.tap();
    onEdit(habit);
  };
  const handleArchive = () => {
    haptics.tap();
    onArchive(habit);
  };
  const handleDelete = () => {
    haptics.tap();
    onDelete(habit);
  };

  return (
    <IonItemSliding>
      <IonItem
        className="tx-item"
        style={{
          transition: 'opacity 280ms ease',
          opacity: done ? 0.7 : 1,
        }}
      >
        <div slot="start" style={{ display: 'flex', alignItems: 'center', marginRight: 12 }}>
          <ProgressRing
            value={ratio}
            color={habit.color ?? '#f59e0b'}
            size={52}
            stroke={5}
          >
            <button
              type="button"
              onClick={handleToggle}
              aria-label={habit.name}
              style={{
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: '50%',
                background: done ? (habit.color ?? '#f59e0b') : 'transparent',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 18,
                transition: 'background 200ms ease, transform 200ms ease',
                transform: done ? 'scale(1)' : 'scale(0.92)',
              }}
            >
              {done ? '✓' : ''}
            </button>
          </ProgressRing>
        </div>

        <IonLabel onClick={handleEdit}>
          <h2
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              textDecoration: done ? 'line-through' : 'none',
            }}
          >
            {habit.icon && (
              <IonIcon icon={iconForCategory(habit.icon)} style={{ fontSize: 14, opacity: 0.7 }} />
            )}
            {habit.name}
          </h2>
          {isQuant ? (
            <p>
              {amount} / {habit.target} {habit.unit ?? ''}
            </p>
          ) : streak > 0 ? (
            <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IonIcon
                icon={flame}
                style={{ color: '#f59e0b', fontSize: 14, verticalAlign: 'middle' }}
              />
              {streak} day{streak === 1 ? '' : 's'}
            </p>
          ) : null}
        </IonLabel>

        {streak > 0 && isQuant && (
          <IonNote
            slot="end"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              color: '#d97706',
              marginRight: 6,
              fontWeight: 700,
            }}
          >
            <IonIcon icon={flame} style={{ fontSize: 14 }} />
            {streak}
          </IonNote>
        )}

        {isQuant && (
          <div slot="end" style={{ display: 'flex', alignItems: 'center' }}>
            <IonButton fill="clear" size="small" onClick={() => handleAdd(-1)} aria-label="-">
              <IonIcon slot="icon-only" icon={removeCircle} />
            </IonButton>
            <IonButton fill="clear" size="small" onClick={() => handleAdd(1)} aria-label="+">
              <IonIcon slot="icon-only" icon={addCircle} />
            </IonButton>
          </div>
        )}
      </IonItem>

      <IonItemOptions side="end">
        <IonItemOption onClick={handleArchive}>
          <IonIcon slot="icon-only" icon={archiveOutline} />
        </IonItemOption>
        <IonItemOption onClick={handleEdit}>
          <IonIcon slot="icon-only" icon={editIcon} />
        </IonItemOption>
        <IonItemOption color="danger" onClick={handleDelete}>
          <IonIcon slot="icon-only" icon={trash} />
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  );
}
