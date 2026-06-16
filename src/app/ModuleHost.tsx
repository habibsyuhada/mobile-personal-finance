import { Suspense, lazy, useEffect, useMemo } from 'react';
import {
  IonContent,
  IonPage,
  IonSpinner,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { useParams, useHistory } from 'react-router-dom';
import { homeOutline } from 'ionicons/icons';
import { getModule } from '@/platform/registry';
import { useT } from '@/i18n/useT';
import { ErrorBoundary } from './ErrorBoundary';
import ModuleBottomNav from './ModuleBottomNav';
import {
  FINANCE_MAIN_TABS,
  FINANCE_MORE_TABS,
} from '@/modules/finance/finance.tabs';
import { TODO_TABS } from '@/modules/todo/todo.tabs';
import { HABIT_TABS } from '@/modules/habit/habit.tabs';
import type { ModuleTab } from './ModuleBottomNav';

// Memuat modul berdasarkan :moduleId dari registry (lazy/code-split).
export default function ModuleHost() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const history = useHistory();
  const t = useT();
  const mod = getModule(moduleId);

  // Tandai modul aktif di <html> untuk CSS theming per-modul.
  useEffect(() => {
    const root = document.documentElement;
    if (mod) {
      root.setAttribute('data-module', mod.id);
      root.style.setProperty('--module-accent', mod.color);
    } else {
      root.removeAttribute('data-module');
      root.style.removeProperty('--module-accent');
    }
    return () => {
      root.removeAttribute('data-module');
      root.style.removeProperty('--module-accent');
    };
  }, [mod]);

  const LazyModule = useMemo(
    () => (mod ? lazy(mod.component) : null),
    [mod]
  );

  const fallback = (
    <IonPage>
      <IonContent className="ion-padding">
        <div className="center-empty">
          <p>{t('launcher.moduleUnavailable')}</p>
          <IonButton onClick={() => history.replace('/')}>
            <IonIcon slot="start" icon={homeOutline} />
            {t('launcher.backToHome')}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );

  if (!mod || !LazyModule) return fallback;

  // Bottom-nav per modul: pilih set tab sesuai modul aktif.
  const { tabs, moreTabs, accentRgb } = pickModuleNav(mod.id);

  return (
    <ErrorBoundary fallback={fallback}>
      <Suspense
        fallback={
          <IonPage>
            <IonContent>
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IonSpinner name="crescent" />
              </div>
            </IonContent>
          </IonPage>
        }
      >
        <LazyModule />
      </Suspense>
      {tabs.length > 0 && (
        <ModuleBottomNav
          tabs={tabs}
          moreTabs={moreTabs}
          accentRgb={accentRgb}
        />
      )}
    </ErrorBoundary>
  );
}

function pickModuleNav(moduleId: string): {
  tabs: ModuleTab[];
  moreTabs: ModuleTab[];
  accentRgb: string;
} {
  if (moduleId === 'finance') {
    return {
      tabs: FINANCE_MAIN_TABS,
      moreTabs: FINANCE_MORE_TABS,
      accentRgb: '99, 102, 241',
    };
  }
  if (moduleId === 'todo') {
    return { tabs: TODO_TABS, moreTabs: [], accentRgb: '14, 165, 233' };
  }
  if (moduleId === 'habit') {
    return { tabs: HABIT_TABS, moreTabs: [], accentRgb: '245, 158, 11' };
  }
  return { tabs: [], moreTabs: [], accentRgb: '99, 102, 241' };
}
