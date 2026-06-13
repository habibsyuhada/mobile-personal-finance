import { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/react';
import { camera, image as imageIcon, warningOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { extractReceipt, ReceiptAiError, type ReceiptExtraction } from '@/features/receipts/ai-client';
import { useSettingsStore } from '@/store/settings.store';
import { useFinanceStore } from '@/store/finance.store';
import { toMinor } from '@/lib/currency';
import type { NewTransaction } from '@/data/models';
import TransactionForm from '@/features/transactions/TransactionForm';
import { useT } from '@/i18n/useT';

type Phase = 'idle' | 'processing' | 'result' | 'error';

export default function ScanPage() {
  const aiEndpoint = useSettingsStore((s) => s.aiEndpoint);
  const aiModel = useSettingsStore((s) => s.aiModel);
  const aiApiKey = useSettingsStore((s) => s.aiApiKey);
  const currency = useSettingsStore((s) => s.currency);
  const accounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const tr = useT();
  const locale = useSettingsStore((s) => s.locale);

  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReceiptExtraction | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<(Partial<NewTransaction> & { amountDisplay?: number }) | undefined>();

  const pickAndScan = async (source: CameraSource) => {
    setError(null);
    try {
      const photo = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source,
      });
      if (!photo.dataUrl) {
        setError(tr('scan.noImage'));
        return;
      }
      setPhase('processing');
      const extraction = await extractReceipt(
        { endpoint: aiEndpoint, model: aiModel, apiKey: aiApiKey },
        photo.dataUrl
      );
      setResult(extraction);
      setPhase('result');
    } catch (e) {
      if (e instanceof ReceiptAiError) {
        setError(e.message);
      } else {
        setError(e instanceof Error ? e.message : 'Terjadi kesalahan.');
      }
      setPhase('error');
    }
  };

  const useResult = () => {
    if (!result) return;
    // Coba cocokkan kategori expense default.
    const fallbackCat = categories.find((c) => c.kind === 'expense');
    setPrefill({
      type: 'expense',
      amountDisplay: result.total ?? undefined,
      accountId: accounts[0]?.id,
      categoryId: fallbackCat?.id,
      note: result.merchant ? tr('scan.receiptNote', { merchant: result.merchant }) : tr('scan.scanResult'),
      occurredAt: result.date
        ? new Date(result.date).toISOString()
        : new Date().toISOString(),
      // simpan item sebagai bagian transaksi
      items: result.items.map((it) => ({
        name: it.name,
        qty: it.qty ?? null,
        unitPrice: it.price != null ? toMinor(it.price, currency) : null,
        lineTotal:
          it.price != null && it.qty != null
            ? toMinor(it.price * it.qty, currency)
            : it.price != null
              ? toMinor(it.price, currency)
              : null,
      })),
    });
    setFormOpen(true);
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setError(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{tr('scan.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {phase === 'idle' && (
          <>
            <div className="center-empty">
              <IonIcon icon={camera} style={{ fontSize: 64, color: 'var(--ion-color-primary)' }} />
              <h2>{tr('scan.heading')}</h2>
              <p>{tr('scan.intro')}</p>
            </div>
            <IonButton expand="block" onClick={() => pickAndScan(CameraSource.Camera)}>
              <IonIcon slot="start" icon={camera} />
              {tr('scan.takePhoto')}
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => pickAndScan(CameraSource.Photos)}
            >
              <IonIcon slot="start" icon={imageIcon} />
              {tr('scan.fromGallery')}
            </IonButton>
            <IonText color="medium">
              <p style={{ fontSize: 12, marginTop: 16 }}>{tr('scan.privacy')}</p>
            </IonText>
          </>
        )}

        {phase === 'processing' && (
          <div className="center-empty">
            <IonSpinner name="crescent" />
            <p>{tr('scan.processing')}</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="center-empty">
            <IonIcon icon={warningOutline} style={{ fontSize: 48, color: 'var(--ion-color-danger)' }} />
            <h2>{tr('scan.failed')}</h2>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
            <IonButton onClick={reset}>{tr('common.retry')}</IonButton>
            <IonButton fill="clear" routerLink="/m/finance/transactions">
              {tr('scan.manualInput')}
            </IonButton>
          </div>
        )}

        {phase === 'result' && result && (
          <>
            <IonCard>
              <IonCardContent>
                <h2 style={{ marginTop: 0 }}>{result.merchant ?? tr('scan.title')}</h2>
                <IonList>
                  <IonItem>
                    <IonLabel>{tr('scan.total')}</IonLabel>
                    <IonNote slot="end">
                      {result.total != null ? result.total.toLocaleString(locale) : '-'}{' '}
                      {result.currency}
                    </IonNote>
                  </IonItem>
                  <IonItem>
                    <IonLabel>{tr('scan.date')}</IonLabel>
                    <IonNote slot="end">{result.date ?? '-'}</IonNote>
                  </IonItem>
                </IonList>
                {result.items.length > 0 && (
                  <>
                    <p style={{ fontWeight: 600 }}>{tr('scan.items', { count: result.items.length })}</p>
                    <IonList>
                      {result.items.map((it, i) => (
                        <IonItem key={i}>
                          <IonLabel>
                            {it.name}
                            {it.qty ? ` × ${it.qty}` : ''}
                          </IonLabel>
                          <IonNote slot="end">
                            {it.price != null ? it.price.toLocaleString(locale) : '-'}
                          </IonNote>
                        </IonItem>
                      ))}
                    </IonList>
                  </>
                )}
              </IonCardContent>
            </IonCard>
            <IonButton expand="block" onClick={useResult}>
              {tr('scan.reviewSave')}
            </IonButton>
            <IonButton expand="block" fill="clear" onClick={reset}>
              {tr('scan.rescan')}
            </IonButton>
          </>
        )}

        <TransactionForm
          isOpen={formOpen}
          prefill={prefill}
          onClose={() => {
            setFormOpen(false);
            reset();
          }}
        />
      </IonContent>
    </IonPage>
  );
}
