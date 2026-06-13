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
  IonIcon,
  IonListHeader,
  IonButton,
  IonText,
  IonNote,
  useIonToast,
  useIonAlert,
} from '@ionic/react';
import {
  downloadOutline,
  cloudUploadOutline,
  trashBinOutline,
} from 'ionicons/icons';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { useSettingsStore } from '@/store/settings.store';
import { useFinanceStore } from '@/store/finance.store';
import type { ThemeMode } from '@/lib/settings';
import { LANGUAGES, type Language } from '@/i18n';
import { useT } from '@/i18n/useT';
import {
  exportToJson,
  exportTransactionsCsv,
  importFromJson,
  resetAllData,
} from '@/features/backup/backup';

const CURRENCIES = ['IDR', 'USD', 'EUR', 'SGD', 'MYR', 'JPY'];

// Pengaturan global platform (lintas modul): tampilan, bahasa, mata uang
// default, konfigurasi AI, dan kelola data. Pengaturan khusus modul tetap di
// dalam modul masing-masing.
export default function GlobalSettings() {
  const s = useSettingsStore();
  const refreshAll = useFinanceStore((st) => st.refreshAll);
  const tr = useT();
  const [presentToast] = useIonToast();
  const [presentAlert] = useIonAlert();
  const [showKey, setShowKey] = useState(false);

  const doExport = async (kind: 'json' | 'csv') => {
    try {
      const content = kind === 'json' ? await exportToJson() : await exportTransactionsCsv();
      const filename = `backup-${Date.now()}.${kind}`;
      await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });
      presentToast({ message: tr('settings.exportSaved', { file: filename }), duration: 2500 });
    } catch (e) {
      presentToast({
        message: tr('settings.exportFailed', { error: e instanceof Error ? e.message : String(e) }),
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
        presentToast({ message: tr('settings.importSuccess'), duration: 2500 });
      } catch (e) {
        presentToast({
          message: tr('settings.importFailed', { error: e instanceof Error ? e.message : String(e) }),
          duration: 3000,
          color: 'danger',
        });
      }
    };
    input.click();
  };

  const confirmReset = () => {
    presentAlert({
      header: tr('settings.resetTitle'),
      message: tr('settings.resetMsg'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('common.deleteAll'),
          role: 'destructive',
          handler: async () => {
            await resetAllData();
            await refreshAll();
            presentToast({ message: tr('settings.resetDone'), duration: 2500 });
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" />
          </IonButtons>
          <IonTitle>{tr('launcher.settings')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList>
          <IonListHeader>
            <IonLabel>{tr('settings.display')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel>{tr('settings.language')}</IonLabel>
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
            <IonLabel>{tr('settings.theme')}</IonLabel>
            <IonSelect
              value={s.theme}
              onIonChange={(e) => s.set('theme', e.detail.value as ThemeMode)}
            >
              <IonSelectOption value="system">{tr('settings.theme.system')}</IonSelectOption>
              <IonSelectOption value="light">{tr('settings.theme.light')}</IonSelectOption>
              <IonSelectOption value="dark">{tr('settings.theme.dark')}</IonSelectOption>
            </IonSelect>
          </IonItem>
          <IonItem>
            <IonLabel>{tr('settings.currency')}</IonLabel>
            <IonSelect value={s.currency} onIonChange={(e) => s.set('currency', e.detail.value)}>
              {CURRENCIES.map((c) => (
                <IonSelectOption key={c} value={c}>
                  {c}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>
            <IonLabel>{tr('settings.aiConfig')}</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonLabel position="stacked">{tr('settings.endpoint')}</IonLabel>
            <IonInput
              value={s.aiEndpoint}
              onIonInput={(e) => s.set('aiEndpoint', e.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{tr('settings.model')}</IonLabel>
            <IonInput
              value={s.aiModel}
              onIonInput={(e) => s.set('aiModel', e.detail.value ?? '')}
            />
          </IonItem>
          <IonItem>
            <IonLabel position="stacked">{tr('settings.apiKey')}</IonLabel>
            <IonInput
              type={showKey ? 'text' : 'password'}
              value={s.aiApiKey}
              placeholder={tr('common.optional')}
              onIonInput={(e) => s.set('aiApiKey', e.detail.value ?? '')}
            />
            <IonButton slot="end" fill="clear" size="small" onClick={() => setShowKey((v) => !v)}>
              {showKey ? tr('settings.hide') : tr('settings.show')}
            </IonButton>
          </IonItem>
          <IonItem lines="none">
            <IonNote>{tr('settings.apiKeyNote')}</IonNote>
          </IonItem>
        </IonList>

        <IonList>
          <IonListHeader>
            <IonLabel>{tr('settings.data')}</IonLabel>
          </IonListHeader>
          <IonItem button onClick={() => doExport('json')}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>{tr('settings.exportJson')}</IonLabel>
          </IonItem>
          <IonItem button onClick={() => doExport('csv')}>
            <IonIcon icon={downloadOutline} slot="start" />
            <IonLabel>{tr('settings.exportCsv')}</IonLabel>
          </IonItem>
          <IonItem button onClick={doImport}>
            <IonIcon icon={cloudUploadOutline} slot="start" />
            <IonLabel>{tr('settings.importJson')}</IonLabel>
          </IonItem>
          <IonItem button onClick={confirmReset}>
            <IonIcon icon={trashBinOutline} slot="start" color="danger" />
            <IonText color="danger">
              <IonLabel>{tr('settings.resetAll')}</IonLabel>
            </IonText>
          </IonItem>
        </IonList>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}
