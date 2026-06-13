import { useEffect, useState } from 'react';
import { IonApp, IonRouterOutlet, IonSpinner, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Redirect, Route } from 'react-router-dom';
import { initData } from '@/data';
import { seedDefaultCategories } from '@/data/seed';
import { getRepositories } from '@/data';
import { initServices, getServices } from '@/services';
import { getDatabase } from '@/data/db/database';
import { runModuleMigrations, runModuleInit } from '@/platform/migrations';
import { useFinanceStore } from '@/store/finance.store';
import { useSettingsStore } from '@/store/settings.store';
import Launcher from './Launcher';
import ModuleHost from './ModuleHost';
import GlobalSettings from './GlobalSettings';

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

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refreshAll = useFinanceStore((s) => s.refreshAll);
  const loadSettings = useSettingsStore((s) => s.load);

  useEffect(() => {
    (async () => {
      try {
        await loadSettings();
        await initData();
        await seedDefaultCategories(getRepositories().categories);
        initServices();
        // Migrasi & init modul (Todo, Habit, dst.) di atas DB bersama.
        await runModuleMigrations(getDatabase());
        await runModuleInit(getDatabase());
        // Proses transaksi berulang yang jatuh tempo (R1.7).
        await getServices().recurring.processDue();
        await refreshAll();
        setReady(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [loadSettings, refreshAll]);

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
          <Route exact path="/" render={() => <Launcher />} />
          <Route exact path="/settings" render={() => <GlobalSettings />} />
          <Route path="/m/:moduleId" render={() => <ModuleHost />} />
          {/* Kompatibilitas rute lama */}
          <Route exact path="/tabs" render={() => <Redirect to="/m/finance/dashboard" />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
}
