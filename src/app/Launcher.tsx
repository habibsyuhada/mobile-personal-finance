import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { enabledModules } from '@/platform/registry';
import { useT } from '@/i18n/useT';
import { formatDate } from '@/lib/date';
import { useSettingsStore } from '@/store/settings.store';

export default function Launcher() {
  const history = useHistory();
  const t = useT();
  const locale = useSettingsStore((s) => s.locale);
  const modules = enabledModules();

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{t('launcher.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => history.push('/settings')}>
              <IonIcon slot="icon-only" icon={settingsOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="launcher-head">
          <h1>{t('launcher.title')}</h1>
          <p>{formatDate(new Date().toISOString(), locale)}</p>
        </div>

        <div className="launcher-grid">
          {modules.map((m) => (
            <button
              key={m.id}
              className="launcher-card"
              onClick={() => history.push(m.routePath)}
              aria-label={t(m.nameKey)}
            >
              <span className="launcher-icon" style={{ background: m.color }}>
                <IonIcon icon={m.icon} />
              </span>
              <span className="launcher-label">{t(m.nameKey)}</span>
            </button>
          ))}
        </div>
      </IonContent>
    </IonPage>
  );
}
