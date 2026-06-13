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
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCard,
  IonCardContent,
  IonChip,
  useIonAlert,
} from '@ionic/react';
import { add, trash, create as editIcon, archiveOutline, flame } from 'ionicons/icons';
import { useHabitStore, habitService } from '../store/habit.store';
import { iconForCategory } from '@/lib/categoryIcons';
import { useT } from '@/i18n/useT';
import HabitForm from '../components/HabitForm';
import Heatmap from '../components/Heatmap';
import type { Habit, HabitLog, HabitStats } from '../data/models';

export default function AllHabitsPage() {
  const habits = useHabitStore((s) => s.habits);
  const refreshHabits = useHabitStore((s) => s.refreshHabits);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const tr = useT();
  const [presentAlert] = useIonAlert();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [detail, setDetail] = useState<Habit | null>(null);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);

  useEffect(() => {
    refreshHabits();
  }, [refreshHabits]);

  useEffect(() => {
    if (!detail) return;
    (async () => {
      setStats(await habitService().stats(detail.id));
      setLogs(await habitService().logsForHabit(detail.id));
    })();
  }, [detail]);

  const confirmDelete = (h: Habit) => {
    presentAlert({
      header: tr('habit.deleteTitle'),
      message: tr('habit.deleteMsg'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        { text: tr('common.delete'), role: 'destructive', handler: () => deleteHabit(h.id) },
      ],
    });
  };

  // Detail view
  if (detail) {
    return (
      <IonPage>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setDetail(null)}>{tr('common.cancel')}</IonButton>
            </IonButtons>
            <IonTitle>{detail.name}</IonTitle>
            <IonButtons slot="end">
              <IonButton
                onClick={() => {
                  setEditing(detail);
                  setFormOpen(true);
                }}
              >
                <IonIcon slot="icon-only" icon={editIcon} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardContent>
              <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>
                    <IonIcon icon={flame} style={{ color: '#f59e0b', verticalAlign: 'middle' }} />{' '}
                    {stats?.currentStreak ?? 0}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    {tr('habit.streak')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>{stats?.bestStreak ?? 0}</div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    {tr('habit.bestStreak')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800 }}>
                    {Math.round((stats?.completionRate30 ?? 0) * 100)}%
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>
                    {tr('habit.completionRate')}
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardContent>
              <p style={{ fontWeight: 600, marginTop: 0 }}>{tr('habit.history')}</p>
              <Heatmap habit={detail} logs={logs} />
            </IonCardContent>
          </IonCard>
        </IonContent>

        <HabitForm
          isOpen={formOpen}
          editing={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
            refreshHabits();
            if (detail) habitService().getById(detail.id).then((h) => h && setDetail(h));
          }}
        />
      </IonPage>
    );
  }

  // List view
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{tr('habit.all')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <div className="center-empty">
            <p>{tr('habit.emptyAll')}</p>
          </div>
        ) : (
          <IonList lines="none">
            {habits.map((h) => (
              <IonItemSliding key={h.id}>
                <IonItem button className="tx-item" onClick={() => setDetail(h)}>
                  <div
                    className="cat-avatar"
                    slot="start"
                    style={{ background: h.color ?? '#94a3b8', opacity: h.archived ? 0.5 : 1 }}
                  >
                    <IonIcon icon={iconForCategory(h.icon)} />
                  </div>
                  <IonLabel>
                    <h2>{h.name}</h2>
                    <p>
                      {tr(`habit.type.${h.type}` as const)}
                      {h.archived ? ` · ${tr('habit.archived')}` : ''}
                    </p>
                  </IonLabel>
                  {h.archived && (
                    <IonChip slot="end" outline>
                      {tr('habit.archived')}
                    </IonChip>
                  )}
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption onClick={() => archiveHabit(h.id, !h.archived)}>
                    <IonIcon slot="icon-only" icon={archiveOutline} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => confirmDelete(h)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
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
