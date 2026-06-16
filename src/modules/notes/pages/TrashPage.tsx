import { useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
  IonButton,
  IonButtons,
  IonIcon,
  useIonAlert,
} from '@ionic/react';
import { trashOutline, arrowUndoOutline, documentTextOutline } from 'ionicons/icons';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import ModuleEmpty from '@/lib/ModuleEmpty';

function formatDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function TrashPage() {
  const tr = useT();
  const trash = useNotesStore((s) => s.trash);
  const restorePage = useNotesStore((s) => s.restorePage);
  const emptyTrash = useNotesStore((s) => s.emptyTrash);
  const permanentlyDelete = useNotesStore((s) => s.permanentlyDelete);
  const refreshTrash = useNotesStore((s) => s.refreshTrash);
  const [presentAlert] = useIonAlert();

  useEffect(() => {
    void refreshTrash();
  }, [refreshTrash]);

  const confirmEmpty = () => {
    presentAlert({
      header: tr('notes.trash.emptyAction'),
      message: tr('notes.trash.confirmEmpty'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        { text: tr('notes.trash.emptyAction'), role: 'destructive', handler: () => void emptyTrash() },
      ],
    });
  };

  const confirmDelete = (id: string, title: string) => {
    presentAlert({
      header: tr('notes.page.deleteForever'),
      message: title,
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('notes.page.deleteForever'),
          role: 'destructive',
          handler: () => void permanentlyDelete(id),
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{tr('notes.sidebar.trash')}</IonTitle>
          {trash.length > 0 && (
            <IonButtons slot="end">
              <IonButton onClick={confirmEmpty}>{tr('notes.trash.emptyAction')}</IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {trash.length === 0 ? (
          <ModuleEmpty emoji="🗑️" title={tr('notes.trash.empty.title')} body={tr('notes.trash.empty.body')} />
        ) : (
          <IonList lines="none">
            {trash.map((p) => (
              <IonItem key={p.id} className="notes-trash-item">
                <IonIcon icon={documentTextOutline} slot="start" />
                <IonLabel>
                  <h2>{p.title}</h2>
                  <p>
                    {p.deletedAt ? tr('notes.trash.recentDeleted', { date: formatDate(p.deletedAt, navigator.language) }) : ''}
                  </p>
                </IonLabel>
                <IonButton fill="clear" slot="end" onClick={() => void restorePage(p.id)}>
                  <IonIcon slot="icon-only" icon={arrowUndoOutline} />
                </IonButton>
                <IonButton fill="clear" color="danger" slot="end" onClick={() => confirmDelete(p.id, p.title)}>
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonButton>
              </IonItem>
            ))}
          </IonList>
        )}
        <IonNote style={{ display: 'block', textAlign: 'center', padding: 16, opacity: 0.6 }} slot="fixed">
          {tr('common.optional')}
        </IonNote>
      </IonContent>
    </IonPage>
  );
}
