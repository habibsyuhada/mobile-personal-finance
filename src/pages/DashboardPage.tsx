import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonCard,
  IonCardContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import { arrowDownOutline, arrowUpOutline, appsOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { iconForCategory, colorForCategory, transferIcon } from '@/lib/categoryIcons';
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
  const history = useHistory();

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
  const cat = (id?: string | null) => categories.find((c) => c.id === id);
  const accName = (id?: string | null) =>
    accounts.find((a) => a.id === id)?.name ?? '-';

  const recent = transactions.slice(0, 8);

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/')}>
              <IonIcon slot="icon-only" icon={appsOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{tr('dashboard.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => refreshAll().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="net-worth-card">
          <div style={{ padding: '22px 24px', position: 'relative', zIndex: 1 }}>
            <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>
              {tr('dashboard.netWorth')}
            </div>
            <div style={{ color: '#fff', fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: '-0.5px' }}>
              {fmt(netWorth)}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 8 }}>
              {tr('dashboard.accounts', { count: accounts.length })}
            </div>
          </div>
        </div>

        <div style={{ padding: '4px 16px' }}>
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
          <IonCard className="summary-card">
            <IonCardContent>
              <div className="summary-icon income">
                <IonIcon icon={arrowDownOutline} style={{ color: 'var(--app-income)', fontSize: 20 }} />
              </div>
              <div className="summary-label">{tr('dashboard.income')}</div>
              <div className="summary-value amount-income">{fmt(totals.income)}</div>
            </IonCardContent>
          </IonCard>
          <IonCard className="summary-card">
            <IonCardContent>
              <div className="summary-icon expense">
                <IonIcon icon={arrowUpOutline} style={{ color: 'var(--app-expense)', fontSize: 20 }} />
              </div>
              <div className="summary-label">{tr('dashboard.expense')}</div>
              <div className="summary-value amount-expense">{fmt(totals.expense)}</div>
            </IonCardContent>
          </IonCard>
        </div>

        <div className="section-head">
          <h3>{tr('dashboard.recent')}</h3>
          <IonButton fill="clear" size="small" routerLink="/m/finance/transactions">
            {tr('common.viewAll')}
          </IonButton>
        </div>

        {recent.length === 0 ? (
          <div className="center-empty">
            <p>{tr('dashboard.empty')}</p>
          </div>
        ) : (
          <IonList lines="none">
            {recent.map((t) => {
              const c = cat(t.categoryId);
              const isTransfer = t.type === 'transfer';
              const avatarColor = isTransfer
                ? 'var(--ion-color-primary)'
                : colorForCategory(c?.color);
              return (
                <IonItem key={t.id} className="tx-item" routerLink="/m/finance/transactions">
                  <div
                    className="cat-avatar"
                    slot="start"
                    style={{ background: avatarColor }}
                  >
                    <IonIcon icon={isTransfer ? transferIcon : iconForCategory(c?.icon)} />
                  </div>
                  <IonLabel>
                    <h2>{isTransfer ? tr('common.transfer') : catName(t.categoryId)}</h2>
                    <p>
                      {accName(t.accountId)}
                      {isTransfer ? ` → ${accName(t.toAccountId)}` : ''} ·{' '}
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
              );
            })}
          </IonList>
        )}
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}
