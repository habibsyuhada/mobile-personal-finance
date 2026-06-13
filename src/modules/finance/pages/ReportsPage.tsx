import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { getServices } from '@/modules/finance/services';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { fromMinor } from '@/lib/currency';
import { rangeForPeriod, PeriodType } from '@/lib/date';
import { useSettingsStore } from '@/store/settings.store';
import { useT } from '@/i18n/useT';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function ReportsPage() {
  const categories = useFinanceStore((s) => s.categories);
  const transactions = useFinanceStore((s) => s.transactions);
  const currency = useSettingsStore((s) => s.currency);
  const fmt = useFormatMoney();
  const tr = useT();

  const [period, setPeriod] = useState<PeriodType>('month');
  const [byCategory, setByCategory] = useState<{ categoryId: string | null; total: number }[]>([]);
  const [totals, setTotals] = useState({ income: 0, expense: 0 });

  useEffect(() => {
    (async () => {
      const { from, to } = rangeForPeriod(period);
      const svc = getServices();
      setByCategory(await svc.transactions.expenseByCategory(from, to));
      setTotals(await svc.transactions.totals(from, to));
    })();
  }, [period, transactions]);

  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name ?? tr('dashboard.noCategory');
  const catColor = (id: string | null) =>
    categories.find((c) => c.id === id)?.color ?? '#6b7280';

  const doughnutData = {
    labels: byCategory.map((b) => catName(b.categoryId)),
    datasets: [
      {
        data: byCategory.map((b) => fromMinor(b.total, currency)),
        backgroundColor: byCategory.map((b) => catColor(b.categoryId)),
      },
    ],
  };

  const barData = {
    labels: [tr('dashboard.income'), tr('dashboard.expense')],
    datasets: [
      {
        label: tr('txform.amount', { currency }),
        data: [fromMinor(totals.income, currency), fromMinor(totals.expense, currency)],
        backgroundColor: ['#16a34a', '#dc2626'],
      },
    ],
  };

  const hasExpense = byCategory.length > 0;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{tr('reports.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
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

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{tr('reports.incomeVsExpense')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{tr('reports.in')}</div>
                <div className="amount-income">{fmt(totals.income)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{tr('reports.out')}</div>
                <div className="amount-expense">{fmt(totals.expense)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ion-color-medium)' }}>{tr('reports.diff')}</div>
                <div>{fmt(totals.income - totals.expense)}</div>
              </div>
            </div>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>{tr('reports.byCategory')}</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            {hasExpense ? (
              <Doughnut data={doughnutData} options={{ responsive: true }} />
            ) : (
              <div className="center-empty">
                <p>{tr('reports.noExpense')}</p>
              </div>
            )}
          </IonCardContent>
        </IonCard>
        <div style={{ height: 24 }} />
      </IonContent>
    </IonPage>
  );
}
