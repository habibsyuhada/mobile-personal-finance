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
  IonListHeader,
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
import { add, trash, create as editIcon } from 'ionicons/icons';
import { getServices } from '@/modules/finance/services';
import { useFinanceStore } from '@/modules/finance/store/finance.store';
import type { Category, CategoryKind, NewCategory } from '@/modules/finance/data/models';
import { useT } from '@/i18n/useT';
import { iconForCategory } from '@/lib/categoryIcons';

const COLORS = ['#f59e0b', '#3b82f6', '#ec4899', '#ef4444', '#8b5cf6', '#10b981', '#06b6d4', '#6b7280'];

export default function CategoriesPage() {
  const categories = useFinanceStore((s) => s.categories);
  const refreshCategories = useFinanceStore((s) => s.refreshCategories);
  const tr = useT();
  const [presentAlert] = useIonAlert();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<CategoryKind>('expense');
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);

  const income = categories.filter((c) => c.kind === 'income');
  const expense = categories.filter((c) => c.kind === 'expense');

  const openNew = () => {
    setEditing(null);
    setName('');
    setKind('expense');
    setColor(COLORS[0]);
    setError(null);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setName(c.name);
    setKind(c.kind);
    setColor(c.color ?? COLORS[0]);
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      setError(tr('cat.err.name'));
      return;
    }
    const input: NewCategory = { name: name.trim(), kind, color, icon: null };
    try {
      if (editing) {
        await getServices().categories.update(editing.id, input);
      } else {
        await getServices().categories.create(input);
      }
      await refreshCategories();
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  const confirmDelete = (c: Category) => {
    presentAlert({
      header: tr('cat.deleteTitle'),
      message: tr('cat.deleteMsg', { name: c.name }),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('common.delete'),
          role: 'destructive',
          handler: async () => {
            await getServices().categories.remove(c.id);
            await refreshCategories();
          },
        },
      ],
    });
  };

  const renderList = (items: Category[]) =>
    items.map((c) => (
      <IonItemSliding key={c.id}>
        <IonItem button className="tx-item" onClick={() => openEdit(c)}>
          <div
            className="cat-avatar"
            slot="start"
            style={{ background: c.color ?? '#94a3b8' }}
          >
            <IonIcon icon={iconForCategory(c.icon)} />
          </div>
          <IonLabel>{c.name}</IonLabel>
        </IonItem>
        <IonItemOptions side="end">
          <IonItemOption onClick={() => openEdit(c)}>
            <IonIcon slot="icon-only" icon={editIcon} />
          </IonItemOption>
          <IonItemOption color="danger" onClick={() => confirmDelete(c)}>
            <IonIcon slot="icon-only" icon={trash} />
          </IonItemOption>
        </IonItemOptions>
      </IonItemSliding>
    ));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/m/finance/dashboard" />
          </IonButtons>
          <IonTitle>{tr('cat.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none">
          <IonListHeader>
            <IonLabel>{tr('cat.kind.expense')}</IonLabel>
          </IonListHeader>
          {renderList(expense)}
          <IonListHeader>
            <IonLabel>{tr('cat.kind.income')}</IonLabel>
          </IonListHeader>
          {renderList(income)}
        </IonList>
        <div style={{ height: 80 }} />

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={openNew}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={open} onDidDismiss={() => setOpen(false)}>
          <IonHeader>
            <IonToolbar>
              <IonTitle>{editing ? tr('cat.editTitle') : tr('cat.newTitle')}</IonTitle>
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
              <IonLabel position="stacked">{tr('cat.name')}</IonLabel>
              <IonInput value={name} onIonInput={(e) => setName(e.detail.value ?? '')} />
            </IonItem>
            <IonItem>
              <IonLabel position="stacked">{tr('cat.kind')}</IonLabel>
              <IonSelect value={kind} onIonChange={(e) => setKind(e.detail.value)}>
                <IonSelectOption value="expense">{tr('cat.kind.expense')}</IonSelectOption>
                <IonSelectOption value="income">{tr('cat.kind.income')}</IonSelectOption>
              </IonSelect>
            </IonItem>
            <IonItem lines="none">
              <IonLabel position="stacked">{tr('cat.color')}</IonLabel>
            </IonItem>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '0 16px' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`${tr('cat.color')} ${c}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: c,
                    border: color === c ? '3px solid var(--ion-color-dark)' : '2px solid #fff',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            {error && (
              <IonText color="danger">
                <p style={{ padding: '8px 16px' }}>{error}</p>
              </IonText>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
