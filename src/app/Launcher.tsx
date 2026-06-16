import { useEffect, useMemo, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonIcon,
  IonButton,
  IonButtons,
} from '@ionic/react';
import {
  settingsOutline,
  cloudOfflineOutline,
  chevronForward,
  walletOutline,
  checkboxOutline,
  flameOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { enabledModules } from '@/platform/registry';
import { useT } from '@/i18n/useT';
import { useSettingsStore } from '@/store/settings.store';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import { useTodoStore } from '@/modules/todo/store/todo.store';
import { useHabitStore, habitService } from '@/modules/habit/store/habit.store';
import { currentStreak } from '@/modules/habit/lib/schedule';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { RollingNumber } from '@/lib/RollingNumber';

function greetingKey(date: Date = new Date()): 'launcher.greeting.morning' | 'launcher.greeting.afternoon' | 'launcher.greeting.evening' {
  const h = date.getHours();
  if (h < 12) return 'launcher.greeting.morning';
  if (h < 18) return 'launcher.greeting.afternoon';
  return 'launcher.greeting.evening';
}

function formatLongDate(d: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toDateString();
  }
}

interface ModuleMeta {
  id: string;
  descKey: 'launcher.module.finance.desc' | 'launcher.module.todo.desc' | 'launcher.module.habit.desc' | 'launcher.module.notes.desc';
  icon: string;
}

const MODULE_META: Record<string, ModuleMeta> = {
  finance: { id: 'finance', descKey: 'launcher.module.finance.desc', icon: walletOutline },
  todo: { id: 'todo', descKey: 'launcher.module.todo.desc', icon: checkboxOutline },
  habit: { id: 'habit', descKey: 'launcher.module.habit.desc', icon: flameOutline },
  notes: { id: 'notes', descKey: 'launcher.module.notes.desc', icon: documentTextOutline },
};

export default function Launcher() {
  const history = useHistory();
  const t = useT();
  const locale = useSettingsStore((s) => s.locale);
  const modules = enabledModules();
  const now = new Date();

  // Data ringkas untuk hero stats — lazy supaya tidak menghambat mount.
  const netWorth = useFinanceStore((s) => s.netWorth);
  const refreshFinance = useFinanceStore((s) => s.refreshAll);
  const todoTasks = useTodoStore((s) => s.tasks);
  const refreshTodo = useTodoStore((s) => s.loadTasks);
  const refreshTodoLists = useTodoStore((s) => s.refreshLists);
  const habitToday = useHabitStore((s) => s.today);
  const refreshHabit = useHabitStore((s) => s.refreshToday);
  const fmt = useFormatMoney();

  // Best active streak untuk stat card.
  const [bestStreak, setBestStreak] = useState(0);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const habits = await habitService().list(false);
        let best = 0;
        for (const h of habits) {
          const logs = await habitService().logsForHabit(h.id);
          const s = currentStreak(h, logs);
          if (s > best) best = s;
        }
        if (!cancelled) setBestStreak(best);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [habitToday]);

  useEffect(() => {
    // Refresh data ringan saat launcher tampil. Tidak menunggu (no await
    // berganda) — masing-masing modul akan update state-nya sendiri.
    void refreshFinance().catch(() => undefined);
    void refreshTodoLists().catch(() => undefined);
    void refreshTodo({ view: 'today' }).catch(() => undefined);
    void refreshHabit().catch(() => undefined);
  }, [refreshFinance, refreshTodo, refreshTodoLists, refreshHabit]);

  const todoTodayCount = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return todoTasks.filter((task) => !task.completed).length;
  }, [todoTasks]);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{t('launcher.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton
              onClick={() => history.push('/settings')}
              aria-label={t('launcher.settings')}
            >
              <IonIcon slot="icon-only" icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {/* HERO */}
        <section className="launcher-hero" aria-label={t('launcher.title')}>
          <div className="l-greet">{t(greetingKey(now))},</div>
          <div className="l-name">
            <em>{t('launcher.you')}</em>
          </div>
          <div className="l-date">{formatLongDate(now, locale)}</div>
        </section>

        {/* STATS */}
        <div className="launcher-stats" aria-label="Statistik ringkas">
          <div className="launcher-stat">
            <div
              className="l-stat-icon"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
            >
              <IonIcon icon={walletOutline} />
            </div>
            <div className="l-stat-value">
              <RollingNumber value={netWorth} format={(n) => fmt(n)} />
            </div>
            <div className="l-stat-label">{t('launcher.stat.balance')}</div>
          </div>
          <div className="launcher-stat">
            <div
              className="l-stat-icon"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}
            >
              <IonIcon icon={checkboxOutline} />
            </div>
            <div className="l-stat-value">{todoTodayCount}</div>
            <div className="l-stat-label">{t('launcher.stat.tasks')}</div>
          </div>
          <div className="launcher-stat">
            <div
              className="l-stat-icon"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #fb923c)' }}
            >
              <IonIcon icon={flameOutline} />
            </div>
            <div className="l-stat-value">{bestStreak}</div>
            <div className="l-stat-label">{t('launcher.stat.streak')}</div>
          </div>
        </div>

        {/* MODULE CARDS */}
        <div className="launcher-section-title">{t('launcher.section.modules')}</div>
        <div className="launcher-grid" role="grid" aria-label={t('launcher.chooseModule')}>
          {modules.map((m) => {
            const meta = MODULE_META[m.id];
            const desc = meta ? t(meta.descKey) : '';
            return (
              <button
                key={m.id}
                type="button"
                className="launcher-card"
                style={{ ['--lc-color' as string]: m.color }}
                onClick={() => history.push(m.routePath)}
                aria-label={t(m.nameKey)}
              >
                <span
                  className="lc-icon"
                  style={{ background: m.color }}
                  aria-hidden="true"
                >
                  <IonIcon icon={meta?.icon ?? m.icon} />
                </span>
                <div className="lc-body">
                  <div className="lc-name">{t(m.nameKey)}</div>
                  <div className="lc-desc">{desc}</div>
                </div>
                <IonIcon icon={chevronForward} className="lc-arrow" aria-hidden="true" />
              </button>
            );
          })}
        </div>

        {modules.length === 0 && (
          <div className="center-empty">
            <IonIcon
              icon={cloudOfflineOutline}
              style={{ fontSize: 48, color: 'var(--ion-color-medium)' }}
            />
            <p>{t('launcher.noModules')}</p>
          </div>
        )}

        <div className="launcher-foot">
          <IonIcon icon={cloudOfflineOutline} aria-hidden="true" />
          <span>{t('launcher.offlineNote')}</span>
        </div>
      </IonContent>
    </IonPage>
  );
}
