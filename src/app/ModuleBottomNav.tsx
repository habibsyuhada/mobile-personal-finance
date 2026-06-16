import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  useLocation,
  useHistory,
} from 'react-router-dom';
import {
  appsOutline,
  ellipsisHorizontalCircleOutline,
  chevronForward,
} from 'ionicons/icons';
import { useT } from '@/i18n/useT';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
} from '@ionic/react';

export interface ModuleTab {
  key: string;
  value: string;
  icon: string;
  labelKey: import('@/i18n').TranslationKey;
}

export interface ModuleBottomNavProps {
  /** Tab utama yang tampil di bottom (maks 4). */
  tabs: ModuleTab[];
  /** Tab tambahan (mis. Akun/Kategori/Anggaran) yang akan muncul di modal "Lainnya". */
  moreTabs: ModuleTab[];
  /** Accent RGB untuk active state (mis. '99, 102, 241'). */
  accentRgb: string;
  /** Path defaultHref untuk tombol home. */
  homeTo?: string;
}

/**
 * Bottom navigation khusus satu modul. Berisi:
 * - Tombol "Menu" (home) di paling kiri — kembali ke launcher.
 * - Sampai 4 tab utama modul.
 * - Bila ada moreTabs: tombol "Lainnya" yang membuka modal berisi tab sisanya.
 * Batas total: 5 item (4 tab + 1 Lainnya, atau 4 tab + 1 home).
 */
export default function ModuleBottomNav({
  tabs,
  moreTabs,
  accentRgb,
  homeTo = '/',
}: ModuleBottomNavProps) {
  const t = useT();
  const history = useHistory();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  const allTabs = [...tabs, ...moreTabs];
  const currentValue =
    allTabs.find((tab) => location.pathname.startsWith(tab.value))?.value ??
    tabs[0]?.value ??
    '';

  const visibleTabs = tabs.slice(0, 4);
  const showMore = moreTabs.length > 0;
  const activeInMore = showMore
    ? moreTabs.some((tab) => tab.value === currentValue)
    : false;

  const go = (to: string) => {
    if (to !== location.pathname) history.push(to);
  };

  return (
    <>
      <nav
        className="moraven-bottomnav module-bottomnav"
        aria-label={t('launcher.nav.label')}
        style={{ ['--module-accent-rgb' as string]: accentRgb }}
      >
        <button
          type="button"
          className={
            'moraven-bottomnav-btn' +
            (location.pathname === homeTo ? ' active' : '')
          }
          onClick={() => go(homeTo)}
          aria-label={t('launcher.nav.home')}
        >
          <IonIcon icon={appsOutline} aria-hidden="true" />
          <span>{t('launcher.nav.home')}</span>
        </button>
        {visibleTabs.map((tab) => {
          const isActive = tab.value === currentValue;
          return (
            <button
              key={tab.key}
              type="button"
              className={
                'moraven-bottomnav-btn' + (isActive ? ' active' : '')
              }
              onClick={() => go(tab.value)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={t(tab.labelKey)}
            >
              <IonIcon icon={tab.icon} aria-hidden="true" />
              <span>{t(tab.labelKey)}</span>
            </button>
          );
        })}
        {showMore && (
          <button
            type="button"
            className={
              'moraven-bottomnav-btn' + (activeInMore ? ' active' : '')
            }
            onClick={() => setMoreOpen(true)}
            aria-label={t('common.viewAll')}
          >
            <IonIcon icon={ellipsisHorizontalCircleOutline} aria-hidden="true" />
            <span>{t('common.viewAll')}</span>
          </button>
        )}
      </nav>
      <IonModal isOpen={moreOpen} onDidDismiss={() => setMoreOpen(false)}>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setMoreOpen(false)}>
                {t('common.cancel')}
              </IonButton>
            </IonButtons>
            <IonTitle>{t('common.viewAll')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonList lines="none">
            {moreTabs.map((tab) => {
              const isActive = tab.value === currentValue;
              return (
                <IonItem
                  key={tab.key}
                  button
                  onClick={() => {
                    setMoreOpen(false);
                    go(tab.value);
                  }}
                  detail={false}
                  style={
                    isActive
                      ? { background: 'rgba(var(--module-accent-rgb), 0.08)' }
                      : undefined
                  }
                >
                  <IonIcon
                    icon={tab.icon}
                    slot="start"
                    style={{
                      color: isActive
                        ? 'rgb(var(--module-accent-rgb))'
                        : 'var(--ion-color-medium)',
                    }}
                  />
                  <IonLabel>
                    <h2 style={{ fontWeight: 600 }}>{t(tab.labelKey)}</h2>
                  </IonLabel>
                  {isActive && <IonIcon icon={chevronForward} slot="end" />}
                </IonItem>
              );
            })}
          </IonList>
        </IonContent>
      </IonModal>
    </>
  );
}
