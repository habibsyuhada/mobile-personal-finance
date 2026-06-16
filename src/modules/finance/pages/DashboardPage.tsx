import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
} from '@ionic/react';
import {
  arrowDownOutline,
  arrowUpOutline,
  alertCircleOutline,
  refreshOutline,
  add,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { iconForCategory, colorForCategory, transferIcon } from '@/lib/categoryIcons';
import { RollingNumber } from '@/lib/RollingNumber';
import { InsightCards } from '@/lib/InsightCards';
import { useInsights } from '@/lib/useInsights';
import { generateFinanceInsights } from '../lib/insights';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import { getServices } from '@/modules/finance/services';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { rangeForPeriod, PeriodType, formatDate } from '@/lib/date';
import { useT } from '@/i18n/useT';
import { useSettingsStore } from '@/store/settings.store';
import { Preferences } from '@capacitor/preferences';
import { useIonToast } from '@ionic/react';

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
  const [missedRecurring, setMissedRecurring] = useState(0);
  const [presentToast] = useIonToast();

  useEffect(() => {
    (async () => {
      const dismissed = await Preferences.get({ key: 'finance.recurring.bannerDismissedAt' });
      const dismissedAt = dismissed.value ? Number(dismissed.value) : 0;
      // Tampilkan lagi kalau sudah lebih dari 24 jam sejak dismiss terakhir
      if (Date.now() - dismissedAt > 24 * 60 * 60 * 1000) {
        const count = await getServices().recurring.countMissed();
        setMissedRecurring(count);
      }
    })();
  }, []);

  const handleProcessRecurring = async () => {
    const created = await getServices().recurring.processDue();
    setMissedRecurring(0);
    await refreshAll();
    presentToast({
      message: `+${created} transaction${created === 1 ? '' : 's'}`,
      duration: 2200,
      position: 'bottom',
      icon: refreshOutline,
    });
  };

  const handleDismissRecurring = async () => {
    setMissedRecurring(0);
    await Preferences.set({
      key: 'finance.recurring.bannerDismissedAt',
      value: String(Date.now()),
    });
  };

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
  const { insights, loading: insightsLoading } = useInsights(
    'finance:dashboard',
    generateFinanceInsights
  );

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{tr('dashboard.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => refreshAll().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="net-worth-card">
          <div className="nw-content">
            <div className="nw-label">{tr('dashboard.netWorth')}</div>
            <div className="nw-value">
              <RollingNumber value={netWorth} format={(n) => fmt(n)} />
            </div>
            <div className="nw-meta">{tr('dashboard.accounts', { count: accounts.length })}</div>
          </div>
        </div>

        {missedRecurring > 0 && (
          <div
            style={{
              margin: '12px 16px 0',
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <IonIcon icon={alertCircleOutline} style={{ color: '#f59e0b', fontSize: 20, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>
              {tr('finance.recurring.missedBanner', { count: missedRecurring })}
            </div>
            <IonButton size="small" color="warning" onClick={handleProcessRecurring}>
              {tr('finance.recurring.processNow')}
            </IonButton>
            <IonButton size="small" fill="clear" color="medium" onClick={handleDismissRecurring}>
              {tr('finance.recurring.processLater')}
            </IonButton>
          </div>
        )}

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

        <div style={{ padding: '0 16px 12px' }}>
          <InsightCards insights={insights} loading={insightsLoading} />
        </div>

        {/* Baris Pemasukan + Pengeluaran satu baris, full-width. */}
        <div className="summary-row" role="group" aria-label={tr('dashboard.title')}>
          <button
            type="button"
            className="summary-cell income"
            onClick={() => history.push('/m/finance/transactions')}
          >
            <span className="summary-icon income">
              <IonIcon icon={arrowDownOutline} style={{ color: 'var(--app-income)', fontSize: 20 }} />
            </span>
            <span className="summary-label">{tr('dashboard.income')}</span>
            <span className="summary-value amount-income">
              <RollingNumber value={totals.income} format={(n) => fmt(n)} />
            </span>
          </button>
          <span className="summary-divider" aria-hidden="true" />
          <button
            type="button"
            className="summary-cell expense"
            onClick={() => history.push('/m/finance/transactions')}
          >
            <span className="summary-icon expense">
              <IonIcon icon={arrowUpOutline} style={{ color: 'var(--app-expense)', fontSize: 20 }} />
            </span>
            <span className="summary-label">{tr('dashboard.expense')}</span>
            <span className="summary-value amount-expense">
              <RollingNumber value={totals.expense} format={(n) => fmt(n)} />
            </span>
          </button>
        </div>

        <div className="section-head">
          <h3>{tr('dashboard.recent')}</h3>
          {recent.length > 0 && (
            <IonButton fill="clear" size="small" routerLink="/m/finance/transactions">
              {tr('common.viewAll')}
            </IonButton>
          )}
        </div>

        {recent.length === 0 ? (
          <div className="empty-tx-card" role="status">
            <div className="empty-tx-emoji" aria-hidden="true">💸</div>
            <div className="empty-tx-body">
              <h2>{tr('dashboard.empty.title')}</h2>
              <p>{tr('dashboard.empty.body')}</p>
            </div>
            <div className="empty-tx-actions">
              <IonButton size="default" routerLink="/m/finance/transactions">
                <IonIcon slot="start" icon={add} />
                {tr('txform.newTitle')}
              </IonButton>
            </div>
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
