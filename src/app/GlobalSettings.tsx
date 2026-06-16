import { useHistory } from 'react-router-dom';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/react';
import {
  settingsOutline,
  walletOutline,
  checkboxOutline,
  flameOutline,
  cloudDownloadOutline,
  chevronForward,
} from 'ionicons/icons';
import { useT } from '@/i18n/useT';
import type { TranslationKey } from '@/i18n';

/**
 * Menu utama pengaturan. Berisi tile kategori (Umum, Keuangan, Tugas,
 * Kebiasaan, Data) yang masing-masing menavigasi ke sub-halaman.
 * Untuk mobile: tetap pakai single full-page (bukan modal) sesuai
 * preferensi user — halaman terpisah lebih mudah dinavigasi dengan
 * tombol back dan tetap ringan.
 */
export default function SettingsMenu() {
  const history = useHistory();
  const t = useT();

  const tiles: Array<{
    key: string;
    labelKey: TranslationKey;
    descKey: TranslationKey;
    icon: string;
    color: string;
    to: string;
  }> = [
    {
      key: 'general',
      labelKey: 'settingsMenu.general',
      descKey: 'settingsMenu.generalDesc',
      icon: settingsOutline,
      color: '#6366f1',
      to: '/settings/general',
    },
    {
      key: 'finance',
      labelKey: 'settingsMenu.finance',
      descKey: 'settingsMenu.financeDesc',
      icon: walletOutline,
      color: '#6366f1',
      to: '/settings/finance',
    },
    {
      key: 'todo',
      labelKey: 'settingsMenu.todo',
      descKey: 'settingsMenu.todoDesc',
      icon: checkboxOutline,
      color: '#0ea5e9',
      to: '/settings/todo',
    },
    {
      key: 'habit',
      labelKey: 'settingsMenu.habit',
      descKey: 'settingsMenu.habitDesc',
      icon: flameOutline,
      color: '#f59e0b',
      to: '/settings/habit',
    },
    {
      key: 'data',
      labelKey: 'settingsMenu.data',
      descKey: 'settingsMenu.dataDesc',
      icon: cloudDownloadOutline,
      color: '#ef4444',
      to: '/settings/data',
    },
  ];

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{t('settingsMenu.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div style={{ padding: '8px 20px 12px', color: 'var(--ion-color-medium)', fontSize: 13 }}>
          {t('settingsMenu.subtitle')}
        </div>
        <div className="settings-menu-grid">
          {tiles.map((tile) => (
            <button
              key={tile.key}
              type="button"
              className="settings-menu-tile"
              style={{ ['--tile-color' as string]: tile.color }}
              onClick={() => history.push(tile.to)}
              aria-label={t(tile.labelKey)}
            >
              <span className="smt-icon" style={{ background: tile.color }}>
                <IonIcon icon={tile.icon} aria-hidden="true" />
              </span>
              <span className="smt-body">
                <span className="smt-label">{t(tile.labelKey)}</span>
                <span className="smt-desc">{t(tile.descKey)}</span>
              </span>
              <IonIcon icon={chevronForward} className="smt-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}
