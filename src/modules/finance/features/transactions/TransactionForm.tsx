import { useEffect, useMemo, useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonSegment,
  IonSegmentButton,
  IonDatetime,
  IonTextarea,
  IonText,
  IonChip,
} from '@ionic/react';
import type { NewTransaction, Transaction, TransactionType } from '@/modules/finance/data/models';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import { useSettingsStore } from '@/store/settings.store';
import { toMinor, fromMinor, parseAmount } from '@/lib/currency';
import { nowIso } from '@/lib/id';
import { useT } from '@/i18n/useT';
import { buildMerchantSuggestions } from '@/features/templates/finance';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing?: Transaction | null;
  prefill?: Partial<NewTransaction> & { amountDisplay?: number };
}

export default function TransactionForm({ isOpen, onClose, editing, prefill }: Props) {
  const accounts = useFinanceStore((s) => s.accounts);
  const categories = useFinanceStore((s) => s.categories);
  const allTransactions = useFinanceStore((s) => s.transactions);
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const currency = useSettingsStore((s) => s.currency);
  const tr = useT();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [occurredAt, setOccurredAt] = useState(nowIso());
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const src = editing ?? prefill;
    if (editing) {
      setType(editing.type);
      setAmount(String(fromMinor(editing.amount, currency)));
      setAccountId(editing.accountId);
      setToAccountId(editing.toAccountId ?? '');
      setCategoryId(editing.categoryId ?? '');
      setOccurredAt(editing.occurredAt);
      setNote(editing.note ?? '');
    } else if (prefill) {
      setType(prefill.type ?? 'expense');
      setAmount(prefill.amountDisplay != null ? String(prefill.amountDisplay) : '');
      setAccountId(prefill.accountId ?? accounts[0]?.id ?? '');
      setCategoryId(prefill.categoryId ?? '');
      setOccurredAt(prefill.occurredAt ?? nowIso());
      setNote(prefill.note ?? '');
    } else {
      setType('expense');
      setAmount('');
      setAccountId(accounts[0]?.id ?? '');
      setToAccountId('');
      setCategoryId('');
      setOccurredAt(nowIso());
      setNote('');
    }
    setError(null);
    void src;
  }, [isOpen, editing, prefill, accounts, currency]);

  const filteredCategories = categories.filter((c) =>
    type === 'income' ? c.kind === 'income' : c.kind === 'expense'
  );

  const merchantSuggestions = useMemo(
    () => (editing ? [] : buildMerchantSuggestions(allTransactions, note, 5)),
    [allTransactions, note, editing]
  );

  const applyMerchant = (text: string, categoryId: string | null) => {
    setNote(text);
    if (categoryId) setCategoryId(categoryId);
  };

  const handleSave = async () => {
    setError(null);
    const parsed = parseAmount(amount);
    if (parsed <= 0) {
      setError(tr('txform.err.amount'));
      return;
    }
    if (!accountId) {
      setError(tr('txform.err.account'));
      return;
    }
    const input: NewTransaction = {
      type,
      amount: toMinor(parsed, currency),
      accountId,
      toAccountId: type === 'transfer' ? toAccountId : null,
      categoryId: type === 'transfer' ? null : categoryId || null,
      occurredAt,
      note: note || null,
    };
    if (type === 'transfer' && !toAccountId) {
      setError(tr('txform.err.toAccount'));
      return;
    }
    if (type === 'transfer' && toAccountId === accountId) {
      setError(tr('txform.err.sameAccount'));
      return;
    }
    if (type !== 'transfer' && !categoryId) {
      setError(tr('txform.err.category'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateTransaction(editing.id, input);
      } else {
        await addTransaction(input);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{editing ? tr('txform.editTitle') : tr('txform.newTitle')}</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>{tr('common.cancel')}</IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton strong onClick={handleSave} disabled={saving}>
              {tr('common.save')}
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonSegment value={type} onIonChange={(e) => setType(e.detail.value as TransactionType)}>
          <IonSegmentButton value="expense">
            <IonLabel>{tr('txform.type.expense')}</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="income">
            <IonLabel>{tr('txform.type.income')}</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="transfer">
            <IonLabel>{tr('txform.type.transfer')}</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        <IonItem>
          <IonLabel position="stacked">{tr('txform.amount', { currency })}</IonLabel>
          <IonInput
            type="text"
            inputmode="decimal"
            value={amount}
            placeholder="0"
            onIonInput={(e) => setAmount(e.detail.value ?? '')}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">
            {type === 'transfer' ? tr('txform.fromAccount') : tr('txform.account')}
          </IonLabel>
          <IonSelect
            value={accountId}
            placeholder={tr('txform.selectAccount')}
            onIonChange={(e) => setAccountId(e.detail.value)}
          >
            {accounts.map((a) => (
              <IonSelectOption key={a.id} value={a.id}>
                {a.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>

        {type === 'transfer' && (
          <IonItem>
            <IonLabel position="stacked">{tr('txform.toAccount')}</IonLabel>
            <IonSelect
              value={toAccountId}
              placeholder={tr('txform.selectToAccount')}
              onIonChange={(e) => setToAccountId(e.detail.value)}
            >
              {accounts
                .filter((a) => a.id !== accountId)
                .map((a) => (
                  <IonSelectOption key={a.id} value={a.id}>
                    {a.name}
                  </IonSelectOption>
                ))}
            </IonSelect>
          </IonItem>
        )}

        {type !== 'transfer' && (
          <IonItem>
            <IonLabel position="stacked">{tr('txform.category')}</IonLabel>
            <IonSelect
              value={categoryId}
              placeholder={tr('txform.selectCategory')}
              onIonChange={(e) => setCategoryId(e.detail.value)}
            >
              {filteredCategories.map((c) => (
                <IonSelectOption key={c.id} value={c.id}>
                  {c.name}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        )}

        <IonItem>
          <IonLabel position="stacked">{tr('txform.date')}</IonLabel>
          <IonDatetime
            presentation="date"
            value={occurredAt}
            onIonChange={(e) => setOccurredAt(String(e.detail.value))}
          />
        </IonItem>

        <IonItem>
          <IonLabel position="stacked">{tr('txform.note')}</IonLabel>
          <IonTextarea
            value={note}
            autoGrow
            placeholder={tr('common.optional')}
            onIonInput={(e) => setNote(e.detail.value ?? '')}
          />
        </IonItem>

        {merchantSuggestions.length > 0 && (
          <div style={{ padding: '8px 16px 0' }}>
            <div
              style={{
                fontSize: 12,
                color: 'var(--ion-color-medium)',
                marginBottom: 6,
              }}
            >
              {tr('txform.merchant.suggestions')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {merchantSuggestions.map((s) => (
                <IonChip
                  key={s.text}
                  outline
                  onClick={() => applyMerchant(s.text, s.categoryId)}
                >
                  {s.text} · {s.count}
                </IonChip>
              ))}
            </div>
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p style={{ padding: '0 16px' }}>{error}</p>
          </IonText>
        )}
      </IonContent>
    </IonModal>
  );
}
