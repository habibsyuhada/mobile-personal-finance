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
    </ErrorBoundary>
  );
}
