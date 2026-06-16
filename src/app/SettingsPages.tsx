import { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonInput,
  IonListHeader,
  IonButton,
  IonText,
  IonNote,
  IonIcon,
  IonToggle,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import {
  downloadOutline,
  cloudUploadOutline,
  trashBinOutline,
  walletOutline,
  pricetagsOutline,
  pieChartOutline,
  storefrontOutline,
  notificationsOutline,
} from 'ionicons/icons';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useSettingsStore } from '@/store/settings.store';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import type { ThemeMode } from '@/lib/settings';
import { NOTIF_SOUND_OPTIONS, type NotifSound } from '@/lib/settings';
import { LANGUAGES, type Language } from '@/i18n';
import { useT } from '@/i18n/useT';
import {
  exportToJson,
  exportTransactionsCsv,
  importFromJson,
  resetAllData,
} from '@/features/backup/backup';

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY'];

const THEMES: Array<{
  id: 'indigo' | 'sunset' | 'forest' | 'mono';
  nameKey: string;
  gradient: string;
}> = [
  { id: 'indigo', nameKey: 'settings.theme.preset.indigo', gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)' },
  { id: 'sunset', nameKey: 'settings.theme.preset.sunset', gradient: 'linear-gradient(135deg, #fb923c, #f472b6, #ef4444)' },
  { id: 'forest', nameKey: 'settings.theme.preset.forest', gradient: 'linear-gradient(135deg, #10b981, #14b8a6, #0ea5e9)' },
  { id: 'mono', nameKey: 'settings.theme.preset.mono', gradient: 'linear-gradient(135deg, #475569, #64748b)' },
];

function SettingsHeader({ titleKey, fallback }: { titleKey: string; fallback: string }) {
  const t = useT();
  return (
    <IonHeader className="ion-no-border">
      <IonToolbar>
        <IonButtons slot="start">
          <IonBackButton defaultHref="/settings" />
        </IonButtons>
        <IonTitle>{t(titleKey as never) || fallback}</IonTitle>
      </IonToolbar>
    </IonHeader>
  );
}

/** Umum: tema, bahasa, mata uang, notifikasi global (suara/getar), data. */
export function GeneralSettingsPage() {
  const s = useSettingsStore();
  const refreshAll = useFinanceStore((st) => st.refreshAll);
  const t = useT();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const [showKey, setShowKey] = useState(false);

  const doExport = async (kind: 'json' | 'csv') => {
    try {
      const content = kind === 'json' ? await exportToJson() : await exportTransactionsCsv();
      const filename = `moraven-backup-${Date.now()}.${kind}`;
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      presentToast({ message: t('settings.exportSaved', { file: filename }), duration: 2500 });
    } catch (e) {
      presentToast({
        message: t('settings.exportFailed', { error: e instanceof Error ? e.message : String(e) }),
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const doImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importFromJson(text);
        await refreshAll();
        presentToast({ message: t('settings.importSuccess'), duration: 2500 });
      } catch (e) {
        presentToast({
          message: t('settings.importFailed', { error: e instanceof Error ? e.message : String(e) }),
          duration: 3000,
          color: 'danger',
        });
      }
    };
    input.click();
  };

  const confirmReset = () => {
    presentAlert({
      header: t('settings.resetTitle'),
      message: t('settings.resetMsg'),
      buttons: [
        { text: t('common.cancel'), role: 'cancel' },
        {
          text: t('common.deleteAll'),
          role: 'destructive',
          handler: async () => {
            await resetAllData();
            await refreshAll();
            presentToast({ message: t('settings.resetDone'), duration: 2500 });
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <SettingsHeader titleKey="settingsMenu.general" fallback="Umum" />
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonLabel>{t('settings.display')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>{t('settings.language')}</IonLabel>
            <IonSelect
              value={s.language}
              onIonChange={(e) => s.set('language', e.detail.value as Language)}
            >
              {LANGUAGES.map((l) => (
                <IonSelectOption key={l.code} value={l.code}>
                  {l.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>{t('settings.theme')}</IonLabel>
            <IonSelect
              value={s.theme}
              onIonChange={(e) => s.set('theme', e.detail.value as ThemeMode)}
            >
              <IonSelectOption value="system">{t('settings.theme.system')}</IonSelectOption>
              <IonSelectOption value="light">{t('settings.theme.light')}</IonSelectOption>
              <IonSelectOption value="dark">{t('settings.theme.dark')}</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>{t('settings.currency')}</IonLabel>
            <IonSelect value={s.currency} onIonChange={(e) => s.set('currency', e.detail.value)}>
              {CURRENCIES.map((c) => (
                <IonSelectOption key={c} value={c}>
                  {c}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem lines="none">
            <IonLabel position="stacked">{t('settings.themePicker')}</IonLabel>
            <div className="theme-preset-row">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  className={
                    'theme-preset-chip' +
                    (s.themePreset === th.id && !s.themeAccent ? ' active' : '')
                  }
                  style={{ background: th.gradient }}
                  onClick={() => s.set('themePreset', th.id)}
                  aria-label={t(th.nameKey as never)}
                />
              ))}
            </div>
          </IonItem>
          <IonItem lines="none">
            <IonLabel>{t('settings.trueBlack')}</IonLabel>
            <IonToggle
              checked={s.trueBlack}
              onIonChange={(e) => s.set('trueBlack', e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>{t('settings.notifications')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>{t('settings.sound')}</IonLabel>
            <IonSelect
              value={s.notifSound}
              onIonChange={(e) => s.set('notifSound', e.detail.value as NotifSound)}
            >
              {NOTIF_SOUND_OPTIONS.map((opt) => (
                <IonSelectOption key={opt.value} value={opt.value}>
                  {t(opt.labelKey as never)}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>{t('settings.vibration')}</IonLabel>
            <IonToggle
              checked={s.notifVibration}
              onIonChange={(e) => s.set('notifVibration', e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>
            <IonLabel>{t('settings.aiConfig')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel position="stacked">{t('settings.endpoint')}</IonLabel>
            <IonInput
              value={s.aiEndpoint}
              onIonInput={(e) => s.set('aiEndpoint', e.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('settings.model')}</IonLabel>
            <IonInput
              value={s.aiModel}
              onIonInput={(e) => s.set('aiModel', e.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{t('settings.apiKey')}</IonLabel>
            <IonInput
              type={showKey ? 'text' : 'password'}
              value={s.aiApiKey}
              placeholder={t('common.optional')}
              onIonInput={(e) => s.set('aiApiKey', e.detail.value ?? '')}
            />
            <IonButton slot="end" fill="clear" size="small" onClick={() => setShowKey((v) => !v)}>
              {showKey ? t('settings.hide') : t('settings.show')}
            </IonButton>
          </IonItem>
          <IonItem lines="none">
            <IonNote>{t('settings.apiKeyNote')}</IonNote>
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>
            <IonLabel>{t('settings.data')}</IonLabel>
          </IonListHeader>
          <IonItem button onClick={() => doExport('json')}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>{t('settings.exportJson')}</IonLabel>
          </IonItem>
          <IonItem button onClick={() => doExport('csv')}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>{t('settings.exportCsv')}</IonLabel>
          </IonItem>
          <IonItem button onClick={doImport}>
            <IonIcon icon={cloudUploadOutline} slot="start" />
            <IonLabel>{t('settings.importJson')}</IonLabel>
          </IonItem>
          <IonItem button onClick={confirmReset}>
            <IonIcon icon={trashBinOutline} slot="start" color="danger" />
            <IonText color="danger">
              <IonLabel>{t('settings.resetAll')}</IonLabel>
            </IonText>
          </IonItem>
        </IonList>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}

/** Keuangan: navigasi ke halaman Akun/Kategori/Anggaran + notifikasi finance. */
export function FinanceSettingsPage() {
  const s = useSettingsStore();
  const t = useT();
  return (
    <IonPage>
      <SettingsHeader titleKey="settingsMenu.finance" fallback="Keuangan" />
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonLabel>{t('settings.manage')}</IonLabel>
          </IonListHeader>
          <IonItem button routerLink="/m/finance/accounts">
            <IonIcon icon={walletOutline} slot="start" />
            <IonLabel>{t('settings.accounts')}</IonLabel>
          </IonItem>
          <IonItem button routerLink="/m/finance/categories">
            <IonIcon icon={pricetagsOutline} slot="start" />
            <IonLabel>{t('settings.categories')}</IonLabel>
          </IonItem>
          <IonItem button routerLink="/m/finance/budgets">
            <IonIcon icon={pieChartOutline} slot="start" />
            <IonLabel>{t('settings.budgets')}</IonLabel>
          </IonItem>
        </IonList>
        <IonList>
          <IonListHeader>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>{t('notif.finance.title')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>{t('notif.enabled.finance')}</IonLabel>
            <IonToggle
              checked={s.notifFinanceEnabled}
              onIonChange={(e) => s.set('notifFinanceEnabled', e.detail.checked)}
              slot="end"
            />
          </IonItem>
          <IonItem>
            <IonLabel>{t('notif.financeTime')}</IonLabel>
            <IonInput
              type="time"
              value={s.notifFinanceTime}
              onIonChange={(e) => s.set('notifFinanceTime', String(e.detail.value ?? '20:00'))}
            />
          </IonItem>
        </IonList>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}

/** Tugas: notifikasi + template. */
export function TodoSettingsPage() {
  const s = useSettingsStore();
  const t = useT();
  return (
    <IonPage>
      <SettingsHeader titleKey="settingsMenu.todo" fallback="Tugas" />
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>{t('notif.task.title')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>{t('notif.enabled.task')}</IonLabel>
            <IonToggle
              checked={s.notifTaskEnabled}
              onIonChange={(e) => s.set('notifTaskEnabled', e.detail.checked)}
              slot="end"
            />
          </IonItem>
          <IonItem>
            <IonLabel>{t('notif.noon.task')}</IonLabel>
            <IonToggle
              checked={s.notifTaskNoonEnabled}
              onIonChange={(e) => s.set('notifTaskNoonEnabled', e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonList>
        <IonList>
          <IonListHeader>
            <IonIcon icon={storefrontOutline} slot="start" />
            <IonLabel>{t('todo.templates')}</IonLabel>
          </IonListHeader>
          <IonItem lines="none">
            <IonNote style={{ fontSize: 13 }}>
              Template yang tersedia muncul di formulir tugas baru. Daftar template
              bawaan tidak dapat diedit dari aplikasi.
            </IonNote>
          </IonItem>
        </IonList>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}

/** Kebiasaan: notifikasi habit. */
export function HabitSettingsPage() {
  const s = useSettingsStore();
  const t = useT();
  return (
    <IonPage>
      <SettingsHeader titleKey="settingsMenu.habit" fallback="Kebiasaan" />
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonIcon icon={notificationsOutline} slot="start" />
            <IonLabel>{t('notif.habit.title')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>{t('notif.enabled.habit')}</IonLabel>
            <IonToggle
              checked={s.notifHabitEnabled}
              onIonChange={(e) => s.set('notifHabitEnabled', e.detail.checked)}
              slot="end"
            />
          </IonItem>
          <IonItem>
            <IonLabel>{t('notif.noon.habit')}</IonLabel>
            <IonToggle
              checked={s.notifHabitNoonEnabled}
              onIonChange={(e) => s.set('notifHabitNoonEnabled', e.detail.checked)}
              slot="end"
            />
          </IonItem>
        </IonList>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}

/** Data & Cadangan: jalan pintas ke ekspor/impor/reset. */
export function DataSettingsPage() {
  const refreshAll = useFinanceStore((st) => st.refreshAll);
  const t = useT();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();

  const doExport = async (kind: 'json' | 'csv') => {
    try {
      const content = kind === 'json' ? await exportToJson() : await exportTransactionsCsv();
      const filename = `moraven-backup-${Date.now()}.${kind}`;
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      presentToast({ message: t('settings.exportSaved', { file: filename }), duration: 2500 });
    } catch (e) {
      presentToast({
        message: t('settings.exportFailed', { error: e instanceof Error ? e.message : String(e) }),
        duration: 3000,
        color: 'danger',
      });
    }
  };

  const doImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        await importFromJson(text);
        await refreshAll();
        presentToast({ message: t('settings.importSuccess'), duration: 2500 });
      } catch (e) {
        presentToast({
          message: t('settings.importFailed', { error: e instanceof Error ? e.message : String(e) }),
          duration: 3000,
          color: 'danger',
        });
      }
    };
    input.click();
  };

  const confirmReset = () => {
    presentAlert({
      header: t('settings.resetTitle'),
      message: t('settings.resetMsg'),
      buttons: [
        { text: t('common.cancel'), role: 'cancel' },
        {
          text: t('common.deleteAll'),
          role: 'destructive',
          handler: async () => {
            await resetAllData();
            await refreshAll();
            presentToast({ message: t('settings.resetDone'), duration: 2500 });
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <SettingsHeader titleKey="settingsMenu.data" fallback="Data & Cadangan" />
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonLabel>{t('settings.data')}</IonLabel>
          </IonListHeader>
          <IonItem button onClick={() => doExport('json')}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>{t('settings.exportJson')}</IonLabel>
          </IonItem>
          <IonItem button onClick={() => doExport('csv')}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>{t('settings.exportCsv')}</IonLabel>
          </IonItem>
          <IonItem button onClick={doImport}>
            <IonIcon icon={cloudUploadOutline} slot="start" />
            <IonLabel>{t('settings.importJson')}</IonLabel>
          </IonItem>
          <IonItem button onClick={confirmReset}>
            <IonIcon icon={trashBinOutline} slot="start" color="danger" />
            <IonText color="danger">
              <IonLabel>{t('settings.resetAll')}</IonLabel>
            </IonText>
          </IonItem>
        </IonList>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}
