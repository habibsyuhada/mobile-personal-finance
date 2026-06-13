import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  arrowDownCircle,
  arrowUpCircle,
  walletOutline,
  chevronForward,
} from 'ionicons/icons';
import { useFinanceStore } from '@/store/finance.store';
import { getServices } from '@/services';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { rangeForPeriod, PeriodType, formatDate } from '@/lib/date';
import { useT } from '@/i18n/useT';
import { useSettingsStore } from '@/store/settings.store';

export default function DashboardPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const netWorth = useFinanceStore((s) => s.netWorth);
  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);
  const refreshAll = useFinanceStore((s) => s.refreshAll);
  const fmt = useFormatMoney();
  const tr = useT();
  const locale = useSettingsStore((s) => s.locale);

  const [period, setPeriod] = useState<PeriodType>('month');
  const [totals, setTotals] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    (async () => {
      const { from, to } = rangeForPeriod(period);
      const res = await getServices().transactions.totals(from, to);
      setTotals(res);
    })();
  }, [period, transactions]);

  const catName = (id?: string | null) =>
    categories.find((c) => c.id === id)?.name ?? tr('dashboard.noCategory');
  const accName = (id?: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? '-';

  const recent = transactions.slice(0, 8);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{tr('dashboard.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => refreshAll().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        <IonCard className="net-worth-card" color="primary">
          <IonCardHeader>
            <IonCardSubtitle style={{ color: 'rgba(255,255,255,0.85)' }}>
              {tr('dashboard.netWorth')}
            </IonCardSubtitle>
            <IonCardTitle style={{ color: '#fff', fontSize: 28 }}>
              {fmt(netWorth)}
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>

        <div style={{ padding: '0 16px' }}>
          <IonSegment value={period} onIonChange={(e) => setPeriod(e.detail.value as PeriodType)}>
            <IonSegmentButton value="week">
              <IonLabel>{tr('period.week')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="month">
              <IonLabel>{tr('period.month')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="year">
              <IonLabel>{tr('period.year')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </div>

        <div className="summary-grid" style={{ padding: 16 }}>
          <IonCard style={{ margin: 0 }}>
            <IonCardContent>
              <IonIcon icon={arrowDownCircle} style={{ color: 'var(--app-income)', fontSize: 24 }} />
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{tr('dashboard.income')}</div>
              <div className="amount-income">{fmt(totals.income)}</div>
            </IonCardContent>
          </IonCard>
          <IonCard style={{ margin: 0 }}>
            <IonCardContent>
              <IonIcon icon={arrowUpCircle} style={{ color: 'var(--app-expense)', fontSize: 24 }} />
              <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{tr('dashboard.expense')}</div>
              <div className="amount-expense">{fmt(totals.expense)}</div>
            </IonCardContent>
          </IonCard>
        </div>

        <IonList>
          <IonItem button routerLink="/tabs/accounts">
            <IonIcon icon={walletOutline} slot="start" />
            <IonLabel>{tr('dashboard.accounts', { count: accounts.length })}</IonLabel>
            <IonIcon icon={chevronForward} slot="end" />
          </IonItem>
        </IonList>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 16px' }}>
          <h3 style={{ margin: 0 }}>{tr('dashboard.recent')}</h3>
          <IonButton fill="clear" size="small" routerLink="/tabs/transactions">
            {tr('common.viewAll')}
          </IonButton>
        </div>

        {recent.length === 0 ? (
          <div className="center-empty">
            <p>{tr('dashboard.empty')}</p>
          </div>
        ) : (
          <IonList>
            {recent.map((t) => (
              <IonItem key={t.id} routerLink="/tabs/transactions">
                <IonLabel>
                  <h2>{t.type === 'transfer' ? tr('common.transfer') : catName(t.categoryId)}</h2>
                  <p>
                    {accName(t.accountId)}
                    {t.type === 'transfer' ? ` → ${accName(t.toAccountId)}` : ''} ·{' '}
                    {formatDate(t.occurredAt, locale)}
                  </p>
                </IonLabel>
                <span
                  slot="end"
                  className={
                    t.type === 'income'
                      ? 'amount-income'
                      : t.type === 'expense'
                        ? 'amount-expense'
                        : ''
                  }
                >
                  {t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''}
                  {fmt(t.amount)}
                </span>
              </IonItem>
            ))}
          </IonList>
        )}
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}
