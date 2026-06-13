import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  IonCheckbox,
  IonNote,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/react';
import { add, appsOutline, removeCircle, addCircle, flame } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useHabitStore } from '../store/habit.store';
import { iconForCategory } from '@/lib/categoryIcons';
import { useT } from '@/i18n/useT';
import HabitForm from '../components/HabitForm';
import type { Habit } from '../data/models';

export default function TodayHabitsPage() {
  const today = useHabitStore((s) => s.today);
  const refreshToday = useHabitStore((s) => s.refreshToday);
  const refreshHabits = useHabitStore((s) => s.refreshHabits);
  const toggleBinary = useHabitStore((s) => s.toggleBinary);
  const addAmount = useHabitStore((s) => s.addAmount);
  const tr = useT();
  const history = useHistory();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);

  useEffect(() => {
    refreshHabits();
    refreshToday();
  }, [refreshHabits, refreshToday]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/')}>
              <IonIcon slot="icon-only" icon={appsOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{tr('habit.today')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => refreshToday().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {today.length === 0 ? (
          <div className="center-empty">
            <p>{tr('habit.emptyToday')}</p>
          </div>
        ) : (
          <IonList lines="none">
            {today.map(({ habit, amount, done }) => (
              <IonItem key={habit.id} className="tx-item">
                <div
                  className="cat-avatar"
                  slot="start"
                  style={{ background: habit.color ?? '#94a3b8', opacity: done ? 1 : 0.6 }}
                >
                  <IonIcon icon={iconForCategory(habit.icon)} />
                </div>
                <IonLabel>
                  <h2>{habit.name}</h2>
                  {habit.type === 'quantifiable' && (
                    <p>
                      {amount} / {habit.target} {habit.unit ?? ''}
                    </p>
                  )}
                </IonLabel>

                {habit.type === 'binary' ? (
                  <IonCheckbox
                    slot="end"
                    checked={done}
                    onIonChange={() => toggleBinary(habit)}
                    aria-label={habit.name}
                  />
                ) : (
                  <div slot="end" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <IonButton fill="clear" onClick={() => addAmount(habit, -1)}>
                      <IonIcon slot="icon-only" icon={removeCircle} />
                    </IonButton>
                    <IonButton fill="clear" onClick={() => addAmount(habit, 1)}>
                      <IonIcon slot="icon-only" icon={addCircle} />
                    </IonButton>
                  </div>
                )}
                {done && (
                  <IonNote slot="end" color="warning" style={{ display: 'flex', alignItems: 'center' }}>
                    <IonIcon icon={flame} />
                  </IonNote>
                )}
              </IonItem>
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <HabitForm
          isOpen={formOpen}
          editing={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </IonContent>
    </IonPage>
  );
}
