import { useEffect, useState, useCallback } from 'react';
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
  IonProgressBar,
  IonNote,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonText,
} from '@ionic/react';
import { add } from 'ionicons/icons';
import { getServices } from '@/services';
import { useFinanceStore } from '@/store/finance.store';
import { useSettingsStore } from '@/store/settings.store';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { toMinor, parseAmount } from '@/lib/currency';
import { monthKey } from '@/lib/date';
import type { BudgetProgress } from '@/services/budget.service';
import { useT } from '@/i18n/useT';
import { iconForCategory } from '@/lib/categoryIcons';

export default function BudgetsPage() {
  const categories = useFinanceStore((s) => s.categories);
  const currency = useSettingsStore((s) => s.currency);
  const fmt = useFormatMoney();
  const tr = useT();

  const period = monthKey();
  const [progress, setProgress] = useState<BudgetProgress[]>([]);
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  const expenseCats = categories.filter((c) => c.kind === 'expense');
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? '-';
  const cat = (id: string) => categories.find((c) => c.id === id);

  const load = useCallback(async () => {
    setProgress(await getServices().budgets.progress(period));
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    if (!categoryId) {
      setError(tr('budget.err.category'));
      return;
    }
    const amount = parseAmount(limit);
    if (amount <= 0) {
      setError(tr('budget.err.limit'));
      return;
    }
    await getServices().budgets.upsert({
      categoryId,
      period,
      amountLimit: toMinor(amount, currency),
    });
    setOpen(false);
    setCategoryId('');
    setLimit('');
    setError(null);
    await load();
  };

  const colorFor = (status: BudgetProgress['status']) =>
    status === 'over' ? 'danger' : status === 'warning' ? 'warning' : 'success';

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/dashboard" />
          </IonButtons>
          <IonTitle>{tr('budget.title', { period })}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {progress.length === 0 ? (
          <div className="center-empty">
            <p>{tr('budget.empty')}</p>
          </div>
        ) : (
          <IonList lines="none">
            {progress.map((p) => {
              const c = cat(p.budget.categoryId);
              return (
                <IonItem key={p.budget.id} className="tx-item">
                  <div
                    className="cat-avatar"
                    slot="start"
                    style={{ background: c?.color ?? '#94a3b8' }}
                  >
                    <IonIcon icon={iconForCategory(c?.icon)} />
                  </div>
                  <IonLabel>
                    <h2>{catName(p.budget.categoryId)}</h2>
                    <IonProgressBar
                      value={Math.min(p.ratio, 1)}
                      color={colorFor(p.status)}
                      style={{ margin: '8px 0' }}
                    />
                    <IonNote>
                      {fmt(p.spent)} / {fmt(p.budget.amountLimit)} ({Math.round(p.ratio * 100)}%)
                    </IonNote>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => setOpen(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{tr('budget.newTitle')}</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setOpen(false)}>{tr('common.cancel')}</IonButton>
              </IonButtons>
              <IonButtons slot="end">
                <IonButton strong onClick={save}>
                  {tr('common.save')}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">{tr('budget.category')}</IonLabel>
              <IonSelect
                value={categoryId}
                placeholder={tr('txform.selectCategory')}
                onIonChange={(e) => setCategoryId(e.detail.value)}
              >
                {expenseCats.map((c) => (
                  <IonSelectOption key={c.id} value={c.id}>
                    {c.name}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{tr('budget.limit', { currency })}</IonLabel>
              <IonInput
                type="text"
                inputmode="decimal"
                value={limit}
                placeholder="0"
                onIonInput={(e) => setLimit(e.detail.value ?? '')}
              />
            </IonItem>
            {error && (
              <IonText color="danger">
                <p>{error}</p>
              </IonText>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
