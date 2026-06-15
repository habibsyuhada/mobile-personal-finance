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
import { settingsOutline, cloudOfflineOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { enabledModules } from '@/platform/registry';
import { useT } from '@/i18n/useT';
import { useSettingsStore } from '@/store/settings.store';

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

export default function Launcher() {
  const history = useHistory();
  const t = useT();
  const locale = useSettingsStore((s) => s.locale);
  const modules = enabledModules();
  const now = new Date();

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
        <div className="launcher-head">
          <h1>
            {t(greetingKey(now))},<br />
            <span style={{ color: 'var(--ion-color-primary)' }}>{t('launcher.you')}</span>
          </h1>
          <p>{formatLongDate(now, locale)}</p>
        </div>

        <div
          className="launcher-grid"
          role="grid"
          aria-label={t('launcher.chooseModule')}
        >
          {modules.map((m) => (
            <button
              key={m.id}
              type="button"
              className="launcher-card"
              onClick={() => history.push(m.routePath)}
              aria-label={t(m.nameKey)}
              aria-haspopup="true"
            >
              <span
                className="launcher-icon"
                style={{ background: m.color }}
                aria-hidden="true"
              >
                <IonIcon icon={m.icon} />
              </span>
              <span className="launcher-label">{t(m.nameKey)}</span>
            </button>
          ))}
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
