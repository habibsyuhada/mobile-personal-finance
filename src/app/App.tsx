import { useEffect, useState } from 'react';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route, useLocation } from 'react-router-dom';
import { initDatabase, getDatabase } from '@/data/db/database';
import { runModuleMigrations, runModuleInit } from '@/platform/migrations';
import { Notifications } from '@/platform/notifications';
import { runModuleScheduleReminders } from '@/platform/registry';
import { useSettingsStore, onNotifSettingChange } from '@/store/settings.store';
import { useBannerStore } from '@/store/banner.store';
import { useOnboardingStore } from '@/store/onboarding.store';
import { useCelebration } from '@/store/celebration.store';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import { useTodoStore } from '@/modules/todo/store/todo.store';
import { useHabitStore } from '@/modules/habit/store/habit.store';
import { computeWidgetSnapshot, pushWidgetSnapshot } from '@/platform/widgetSnapshot';
import Launcher from './Launcher';
import ModuleHost from './ModuleHost';
import GlobalSettings from './GlobalSettings';
import {
  GeneralSettingsPage,
  FinanceSettingsPage,
  TodoSettingsPage,
  HabitSettingsPage,
  DataSettingsPage,
} from './SettingsPages';
import Onboarding from './Onboarding';
import { BannerHost } from './BannerHost';
import { Celebration } from './Celebration';

/* Ionic core + utility CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/display.css';
import '@ionic/react/css/palettes/dark.class.css';
import '../theme/variables.css';

setupIonicReact({ mode: 'md' });

// Bootstrap singleton: dijamin hanya berjalan sekali walau React StrictMode
// memanggil effect dua kali di dev (mencegah migrasi paralel/benturan transaksi).
// Bersifat module-agnostic: shell hanya menyiapkan DB lalu menjalankan migrasi
// & init tiap modul dari registry (tiap modul mengurus seed/service-nya).
let bootstrapPromise: Promise<void> | null = null;
function bootstrapOnce(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      await useSettingsStore.getState().load();
      await useOnboardingStore.getState().load();
      await initDatabase();
      await runModuleMigrations(getDatabase());
      await runModuleInit(getDatabase());
      // Siapkan channel notifikasi + emit ke banner store (web/fallback).
      await Notifications.ensureDefaultChannels();
      await Notifications.requestPermission();
      Notifications.onBanner((e) => {
        useBannerStore.getState().push({
          id: e.id,
          title: e.title,
          body: e.body,
          kind: e.kind,
          meta: e.meta,
          at: e.at,
        });
      });
      // Minta tiap modul menjadwalkan reminder-nya.
      await runModuleScheduleReminders();
      // Re-schedule ulang saat user mengubah setting notifikasi.
      onNotifSettingChange((changes) => {
        if (
          'notifFinanceEnabled' in changes ||
          'notifFinanceTime' in changes ||
          'notifFinanceNoonEnabled' in changes
        ) {
          import('@/modules/finance/features/notifications').then((m) =>
            m.scheduleFinanceSummary()
          );
        }
        if (
          'notifHabitEnabled' in changes ||
          'notifHabitNoonEnabled' in changes
        ) {
          runModuleScheduleReminders();
        }
        if (
          'notifTaskEnabled' in changes ||
          'notifTaskNoonEnabled' in changes
        ) {
          runModuleScheduleReminders();
        }
      });
    })();
  }
  return bootstrapPromise;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bootstrapOnce()
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Widget snapshot: subscribe ke 3 store utama, push ke native bila berubah.
  // (No-op di platform non-Android.) Diletakkan di sini (di luar IonReactRouter)
  // karena tidak butuh akses ke router.
  useEffect(() => {
    if (!ready) return;
    let pending: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        void pushWidgetSnapshot(computeWidgetSnapshot());
      }, 400);
    };
    const us1 = useFinanceStore.subscribe(schedule);
    const us2 = useTodoStore.subscribe(schedule);
    const us3 = useHabitStore.subscribe(schedule);
    // Push sekali saat ready.
    schedule();
    return () => {
      us1();
      us2();
      us3();
      if (pending) clearTimeout(pending);
    };
  }, [ready]);

  if (error) {
    return (
      <IonApp>
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2>Error</h2>
          <p style={{ color: 'var(--ion-color-danger)' }}>{error}</p>
        </div>
      </IonApp>
    );
  }

  if (!ready) {
    return (
      <IonApp>
        <div
          style={{
            display: 'flex',
            height: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IonSpinner name="crescent" />
        </div>
      </IonApp>
    );
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/onboarding" render={() => <Onboarding />} />
          <Route exact path="/" render={() => <LauncherOrOnboarding />} />
          <Route exact path="/settings" render={() => <GlobalSettings />} />
          <Route exact path="/settings/general" render={() => <GeneralSettingsPage />} />
          <Route exact path="/settings/finance" render={() => <FinanceSettingsPage />} />
          <Route exact path="/settings/todo" render={() => <TodoSettingsPage />} />
          <Route exact path="/settings/habit" render={() => <HabitSettingsPage />} />
          <Route exact path="/settings/data" render={() => <DataSettingsPage />} />
          <Route path="/m/:moduleId" render={() => <ModuleHost />} />
          {/* Kompatibilitas rute lama */}
          <Route exact path="/tabs" render={() => <Redirect to="/m/finance/dashboard" />} />
        </IonRouterOutlet>
        <ShellChrome />
      </IonReactRouter>
      <BannerHost />
      <CelebrationOverlay />
    </IonApp>
  );
}

/**
 * Komponen anak yang hidup di dalam <IonReactRouter>. Tugasnya: toggle
 * kelas global pada <html> sesuai pathname untuk styling shell. Bottom-nav
 * sekarang di-render oleh masing-masing modul, bukan global.
 */
function ShellChrome() {
  const location = useLocation();
  useEffect(() => {
    const root = document.documentElement;
    const inModule = /^\/m\//.test(location.pathname);
    if (inModule) root.classList.add('has-bottomnav');
    else root.classList.remove('has-bottomnav');
  }, [location.pathname]);

  return null;
}

function LauncherOrOnboarding() {
  const completed = useOnboardingStore((s) => s.completed);
  return completed ? <Launcher /> : <Onboarding />;
}

function CelebrationOverlay() {
  const emoji = useCelebration((s) => s.emoji);
  const clear = useCelebration((s) => s.clear);
  return <Celebration show={!!emoji} emoji={emoji ?? '✨'} onDone={clear} />;
}
