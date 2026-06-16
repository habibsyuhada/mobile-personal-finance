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
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  useIonAlert,
} from '@ionic/react';
import { add, appsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useHabitStore, habitService } from '../store/habit.store';
import { useT } from '@/i18n/useT';
import HabitForm from '../components/HabitForm';
import HabitRow from '../components/HabitRow';
import { haptics } from '@/lib/haptics';
import { checkAchievements } from '../lib/achievements';
import { currentStreak } from '../lib/schedule';
import { useCelebration } from '@/store/celebration.store';
import ModuleEmpty from '@/lib/ModuleEmpty';
import type { Habit } from '../data/models';

export default function TodayHabitsPage() {
  const today = useHabitStore((s) => s.today);
  const refreshToday = useHabitStore((s) => s.refreshToday);
  const refreshHabits = useHabitStore((s) => s.refreshHabits);
  const toggleBinary = useHabitStore((s) => s.toggleBinary);
  const addAmount = useHabitStore((s) => s.addAmount);
  const archiveHabit = useHabitStore((s) => s.archiveHabit);
  const deleteHabit = useHabitStore((s) => s.deleteHabit);
  const tr = useT();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const showCelebration = useCelebration((s) => s.show);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [streaks, setStreaks] = useState<Record<string, number>>({});

  useEffect(() => {
    refreshHabits();
    refreshToday();
  }, [refreshHabits, refreshToday]);

  // Hitung streak per habit saat daftar berubah.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result: Record<string, number> = {};
      for (const { habit } of today) {
        const logs = await habitService().logsForHabit(habit.id);
        result[habit.id] = currentStreak(habit, logs);
      }
      if (!cancelled) setStreaks(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const handleToggle = async (habit: Habit) => {
    await toggleBinary(habit);
    const logs = await habitService().logsForHabit(habit.id);
    const streak = currentStreak(habit, logs);
    setStreaks((s) => ({ ...s, [habit.id]: streak }));
    if (streak > 0) {
      const newBadges = await checkAchievements(habit.id, streak);
      if (newBadges.length > 0) {
        haptics.success();
        const last = newBadges[newBadges.length - 1];
        showCelebration('🏆');
        presentAlert({
          header: tr('habit.achievement.title'),
          message: tr('habit.achievement.body', { days: last, name: habit.name }),
          buttons: ['OK'],
        });
      } else {
        showCelebration('✨');
      }
    } else {
      showCelebration('✨');
    }
  };

  const handleAdd = async (habit: Habit, delta: number) => {
    await addAmount(habit, delta);
    const logs = await habitService().logsForHabit(habit.id);
    const streak = currentStreak(habit, logs);
    setStreaks((s) => ({ ...s, [habit.id]: streak }));
    if (streak > 0) {
      const newBadges = await checkAchievements(habit.id, streak);
      if (newBadges.length > 0) {
        haptics.success();
        showCelebration('🏆');
      } else if (delta > 0) {
        haptics.tap();
      }
    }
  };

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
          <ModuleEmpty
            emoji="🌱"
            title={tr('habit.emptyToday.title')}
            body={tr('habit.emptyToday.body')}
          />
        ) : (
          <IonList lines="none">
            {today.map((p) => (
              <HabitRow
                key={p.habit.id}
                progress={p}
                streak={streaks[p.habit.id] ?? 0}
                onToggle={handleToggle}
                onAdd={handleAdd}
                onEdit={(h) => {
                  setEditing(h);
                  setFormOpen(true);
                }}
                onDelete={confirmDelete}
                onArchive={(h) => archiveHabit(h.id, !h.archived)}
              />
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
