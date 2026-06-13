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
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  useIonAlert,
} from '@ionic/react';
import { add, trash, create as editIcon, cash, card, phonePortrait, wallet } from 'ionicons/icons';
import { useFinanceStore } from '@/store/finance.store';
import { useSettingsStore } from '@/store/settings.store';
import { useFormatMoney } from '@/lib/useFormatMoney';
import { toMinor, fromMinor, parseAmount } from '@/lib/currency';
import type { Account, AccountType, NewAccount } from '@/data/models';
import { AccountDeletionError } from '@/services/account.service';
import { useT } from '@/i18n/useT';

const TYPE_KEYS: Record<AccountType, 'acc.type.cash' | 'acc.type.bank' | 'acc.type.ewallet' | 'acc.type.other'> = {
  cash: 'acc.type.cash',
  bank: 'acc.type.bank',
  ewallet: 'acc.type.ewallet',
  other: 'acc.type.other',
};

const TYPE_ICON: Record<AccountType, string> = {
  cash,
  bank: card,
  ewallet: phonePortrait,
  other: wallet,
};

const TYPE_COLOR: Record<AccountType, string> = {
  cash: '#16a34a',
  bank: '#6366f1',
  ewallet: '#0ea5e9',
  other: '#94a3b8',
};

export default function AccountsPage() {
  const accounts = useFinanceStore((s) => s.accounts);
  const balances = useFinanceStore((s) => s.balances);
  const addAccount = useFinanceStore((s) => s.addAccount);
  const updateAccount = useFinanceStore((s) => s.updateAccount);
  const deleteAccount = useFinanceStore((s) => s.deleteAccount);
  const currency = useSettingsStore((s) => s.currency);
  const fmt = useFormatMoney();
  const tr = useT();
  const [presentAlert] = useIonAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('cash');
  const [initial, setInitial] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openNew = () => {
    setEditing(null);
    setName('');
    setType('cash');
    setInitial('');
    setError(null);
    setOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setInitial(String(fromMinor(a.initialBalance, a.currency)));
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      setError(tr('acc.err.name'));
      return;
    }
    const input: NewAccount = {
      name: name.trim(),
      type,
      currency,
      initialBalance: toMinor(parseAmount(initial), currency),
    };
    try {
      if (editing) {
        await updateAccount(editing.id, input);
      } else {
        await addAccount(input);
      }
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmDelete = (a: Account) => {
    presentAlert({
      header: tr('acc.deleteTitle'),
      message: tr('acc.deleteMsg', { name: a.name }),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('common.delete'),
          role: 'destructive',
          handler: async () => {
            try {
              await deleteAccount(a.id);
            } catch (e) {
              if (e instanceof AccountDeletionError) {
                presentAlert({
                  header: tr('acc.inUseTitle'),
                  message: tr('acc.inUseMsg', { count: e.count }),
                  buttons: [
                    { text: tr('common.cancel'), role: 'cancel' },
                    {
                      text: tr('common.deleteAll'),
                      role: 'destructive',
                      handler: () => deleteAccount(a.id, true),
                    },
                  ],
                });
              }
            }
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/dashboard" />
          </IonButtons>
          <IonTitle>{tr('acc.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {accounts.length === 0 ? (
          <div className="center-empty">
            <p>{tr('acc.empty')}</p>
          </div>
        ) : (
          <IonList lines="none">
            {accounts.map((a) => (
              <IonItemSliding key={a.id}>
                <IonItem button className="tx-item" onClick={() => openEdit(a)}>
                  <div className="cat-avatar" slot="start" style={{ background: TYPE_COLOR[a.type] }}>
                    <IonIcon icon={TYPE_ICON[a.type]} />
                  </div>
                  <IonLabel>
                    <h2>{a.name}</h2>
                    <p>{tr(TYPE_KEYS[a.type])}</p>
                  </IonLabel>
                  <span slot="end" style={{ fontWeight: 700 }}>{fmt(balances[a.id] ?? 0)}</span>
                </IonItem>
                <IonItemOptions side="end">
                  <IonItemOption onClick={() => openEdit(a)}>
                    <IonIcon slot="icon-only" icon={editIcon} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => confirmDelete(a)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              </IonItemSliding>
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={openNew}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editing ? tr('acc.editTitle') : tr('acc.newTitle')}</IonTitle>
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
              <IonLabel position="stacked">{tr('acc.name')}</IonLabel>
              <IonInput
                value={name}
                placeholder={tr('acc.namePlaceholder')}
                onIonInput={(e) => setName(e.detail.value ?? '')}
              />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{tr('acc.type')}</IonLabel>
              <IonSelect value={type} onIonChange={(e) => setType(e.detail.value)}>
                {(Object.keys(TYPE_KEYS) as AccountType[]).map((t) => (
                  <IonSelectOption key={t} value={t}>
                    {tr(TYPE_KEYS[t])}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{tr('acc.initialBalance', { currency })}</IonLabel>
              <IonInput
                type="text"
                inputmode="decimal"
                value={initial}
                placeholder="0"
                onIonInput={(e) => setInitial(e.detail.value ?? '')}
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
