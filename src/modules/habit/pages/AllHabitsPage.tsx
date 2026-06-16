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
  IonModal,
  useIonToast,
} from '@ionic/react';
import { add, trash, create as editIcon, archiveOutline, flame, refreshCircle, flashOutline } from 'ionicons/icons';
import { useHabitStore, habitService } from '../store/habit.store';
import { iconForCategory } from '@/lib/categoryIcons';
import { useT } from '@/i18n/useT';
import HabitForm from '../components/HabitForm';
import Heatmap from '../components/Heatmap';
import { MILESTONES, MILESTONE_META, unlockedFor } from '../lib/achievements';
import { HABIT_BUNDLES, templateToNewHabit } from '@/features/templates/habits';
import ModuleEmpty from '@/lib/ModuleEmpty';
import type { Habit, HabitLog, HabitStats } from '../data/models';
import type { TranslationKey } from '@/i18n';

export default function AllHabitsPage() {
  const habits = useHabitStore((s) => s.habits);
  const refreshHabits = useHabitStore((s) => s.refreshHabits);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const restartStreak = useHabitStore((s) => s.restartStreak);
  const addHabit = useHabitStore((s) => s.addHabit);
  const tr = useT();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [detail, setDetail] = useState<Habit | null>(null);
  const [stats, setStats] = useState<HabitStats | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<number[]>([]);
  const [bundleOpen, setBundleOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    refreshHabits();
  }, [refreshHabits]);

  useEffect(() => {
    if (!detail) return;
    (async () => {
      setStats(await habitService().stats(detail.id));
      setLogs(await habitService().logsForHabit(detail.id));
      setUnlockedBadges(await unlockedFor(detail.id));
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

  const confirmRestartStreak = (h: Habit) => {
    presentAlert({
      header: tr('habit.restartStreak.title'),
      message: tr('habit.restartStreak.body'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('habit.restartStreak.confirm'),
          handler: async () => {
            await restartStreak(h);
            presentToast({
              message: tr('habit.restartStreak.done'),
              duration: 2200,
              position: 'bottom',
              icon: refreshCircle,
            });
          },
        },
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
              {(stats?.currentStreak ?? 0) === 0 && (stats?.bestStreak ?? 0) > 0 && (
                <div style={{ marginTop: 12, textAlign: 'center' }}>
                  <IonButton
                    size="small"
                    fill="outline"
                    color="warning"
                    onClick={() => confirmRestartStreak(detail)}
                  >
                    <IonIcon slot="start" icon={refreshCircle} />
                    {tr('habit.restartStreak')}
                  </IonButton>
                </div>
              )}
            </IonCardContent>
          </IonCard>

          <IonCard>
            <IonCardContent>
              <p style={{ fontWeight: 600, marginTop: 0 }}>🏆 Achievements</p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                  gap: 8,
                }}
              >
                {MILESTONES.map((m) => {
                  const unlocked = unlockedBadges.includes(m);
                  return (
                    <div
                      key={m}
                      title={`${m} days`}
                      style={{
                        textAlign: 'center',
                        padding: 8,
                        borderRadius: 12,
                        background: unlocked ? 'rgba(245,158,11,0.15)' : 'rgba(120,120,120,0.08)',
                        opacity: unlocked ? 1 : 0.4,
                        transition: 'transform 200ms ease, opacity 200ms ease',
                      }}
                    >
                      <div style={{ fontSize: 28, filter: unlocked ? 'none' : 'grayscale(1)' }}>
                        {MILESTONE_META.find((x) => x.milestone === m)?.emoji ?? '🎯'}
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>{m}d</div>
                    </div>
                  );
                })}
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
          <IonButtons slot="end">
            <IonButton onClick={() => setBundleOpen(true)}>
              <IonIcon slot="icon-only" icon={flashOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {habits.length === 0 ? (
          <ModuleEmpty
            emoji="🌱"
            title={tr('habit.emptyAll.title')}
            body={tr('habit.emptyAll.body')}
          />
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

        <IonModal isOpen={bundleOpen} onDidDismiss={() => setBundleOpen(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonButtons slot="start">
                <IonButton onClick={() => setBundleOpen(false)}>
                  {tr('common.cancel')}
                </IonButton>
              </IonButtons>
              <IonTitle>{tr('habit.bundle.title')}</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent>
            <p
              style={{
                padding: '12px 16px',
                color: 'var(--ion-color-medium)',
                fontSize: 13,
              }}
            >
              {tr('habit.bundle.subtitle')}
            </p>
            <IonList lines="none">
              {HABIT_BUNDLES.map((b) => (
                <IonItem
                  key={b.id}
                  button
                  disabled={creating}
                  onClick={async () => {
                    setCreating(true);
                    try {
                      for (const tmpl of b.habits) {
                        const input = templateToNewHabit(tmpl, b.reminderTime, (k) => tr(k as TranslationKey));
                        await addHabit(input);
                      }
                      setBundleOpen(false);
                      presentToast({
                        message: `${b.emoji} ${b.habits.length} habits added`,
                        duration: 2200,
                        position: 'bottom',
                        icon: flashOutline,
                      });
                    } catch (e) {
                      presentToast({
                        message: e instanceof Error ? e.message : String(e),
                        duration: 3000,
                        position: 'bottom',
                        color: 'danger',
                      });
                    } finally {
                      setCreating(false);
                    }
                  }}
                  className="tx-item"
                >
                  <div slot="start" style={{ fontSize: 28, marginRight: 12 }}>
                    {b.emoji}
                  </div>
                  <IonLabel>
                    <h2 style={{ fontWeight: 600 }}>{tr(b.titleKey)}</h2>
                    <p style={{ color: 'var(--ion-color-medium)' }}>
                      {tr(b.descriptionKey)}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--app-accent)',
                        marginTop: 4,
                      }}
                    >
                      {b.habits.length} habits · ⏰ {b.reminderTime}
                    </p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
