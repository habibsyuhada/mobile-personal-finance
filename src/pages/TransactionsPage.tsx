import { useEffect, useMemo, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonFab,
  IonFabButton,
  IonIcon,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonRefresher,
  IonRefresherContent,
  useIonAlert,
} from '@ionic/react';
import { add, trash, create as editIcon } from 'ionicons/icons';
import { useFinanceStore } from '@/store/finance.store';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { formatDate } from '@/lib/date';
import type { Transaction, TransactionType } from '@/data/models';
import TransactionForm from '@/features/transactions/TransactionForm';
import { useT } from '@/i18n/useT';
import { useSettingsStore } from '@/store/settings.store';

type FilterType = 'all' | TransactionType;

export default function TransactionsPage() {
  const transactions = useFinanceStore((s) => s.transactions);
  const categories = useFinanceStore((s) => s.categories);
  const accounts = useFinanceStore((s) => s.accounts);
  const refreshTransactions = useFinanceStore((s) => s.refreshTransactions);
  const refreshAll = useFinanceStore((s) => s.refreshAll);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);
  const fmt = useFormatMoney();
  const tr = useT();
  const locale = useSettingsStore((s) => s.locale);
  const [presentAlert] = useIonAlert();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  useEffect(() => {
    refreshTransactions({ limit: 500 });
  }, [refreshTransactions]);

  const catName = (id?: string | null) =>
    categories.find((c) => c.id === id)?.name ?? tr('dashboard.noCategory');
  const accName = (id?: string | null) => accounts.find((a) => a.id === id)?.name ?? '-';

  const visible = useMemo(() => {
    return transactions.filter((t) => {
      if (filter !== 'all' && t.type !== filter) return false;
      if (search) {
        const hay = `${t.note ?? ''} ${catName(t.categoryId)}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, filter, search, categories]);

  const handleDelete = (t: Transaction) => {
    presentAlert({
      header: tr('tx.deleteTitle'),
      message: tr('tx.deleteMsg'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('common.delete'),
          role: 'destructive',
          handler: () => deleteTransaction(t.id),
        },
      ],
    });
  };

  const openEdit = (t: Transaction) => {
    setEditing(t);
    setFormOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{tr('tx.title')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={search}
            placeholder={tr('tx.searchPlaceholder')}
            onIonInput={(e) => setSearch(e.detail.value ?? '')}
          />
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={filter} onIonChange={(e) => setFilter(e.detail.value as FilterType)}>
            <IonSegmentButton value="all">
              <IonLabel>{tr('common.all')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="expense">
              <IonLabel>{tr('tx.filter.expense')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="income">
              <IonLabel>{tr('tx.filter.income')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="transfer">
              <IonLabel>{tr('tx.filter.transfer')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => refreshAll().then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {visible.length === 0 ? (
          <div className="center-empty">
            <p>{tr('tx.empty')}</p>
          </div>
        ) : (
          <IonList>
            {visible.map((t) => (
              <IonItemSliding key={t.id}>
                <IonItem button onClick={() => openEdit(t)}>
                  <IonLabel>
                    <h2>{t.type === 'transfer' ? tr('common.transfer') : catName(t.categoryId)}</h2>
                    <p>
                      {accName(t.accountId)}
                      {t.type === 'transfer' ? ` → ${accName(t.toAccountId)}` : ''} ·{' '}
                      {formatDate(t.occurredAt, locale)}
                    </p>
                    {t.note && <p>{t.note}</p>}
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
                <IonItemOptions side="end">
                  <IonItemOption onClick={() => openEdit(t)}>
                    <IonIcon slot="icon-only" icon={editIcon} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => handleDelete(t)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}
        <div style={{ height: 80 }} />

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={openNew}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <TransactionForm
          isOpen={formOpen}
          editing={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </IonContent>
    </IonPage>
  );
}
