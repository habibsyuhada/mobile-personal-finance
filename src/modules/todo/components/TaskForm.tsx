import { useEffect, useState } from 'react';
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
  IonTextarea,
  IonDatetime,
  IonToggle,
  IonText,
  IonList,
  IonNote,
  IonIcon,
  IonChip,
} from '@ionic/react';
import { storefrontOutline } from 'ionicons/icons';
import type { NewTask, Task, Priority, RecurFreq } from '../data/models';
import { useTodoStore } from '../store/todo.store';
import { useT } from '@/i18n/useT';
import { TASK_TEMPLATES, templateToNewTask, type TaskTemplate } from '@/features/templates/tasks';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editing?: Task | null;
  defaultListId?: string;
  reloadFilter?: Parameters<ReturnType<typeof useTodoStore.getState>['loadTasks']>[0];
}

export default function TaskForm({ isOpen, onClose, editing, defaultListId, reloadFilter }: Props) {
  const lists = useTodoStore((s) => s.lists);
  const addTask = useTodoStore((s) => s.addTask);
  const editTask = useTodoStore((s) => s.editTask);
  const loadTasks = useTodoStore((s) => s.loadTasks);
  const tr = useT();

  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [listId, setListId] = useState('');
  const [priority, setPriority] = useState<Priority>(0);
  const [dueAt, setDueAt] = useState<string | null>(null);
  const [starred, setStarred] = useState(false);
  const [recur, setRecur] = useState<RecurFreq | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (editing) {
      setTitle(editing.title);
      setNote(editing.note ?? '');
      setListId(editing.listId);
      setPriority(editing.priority);
      setDueAt(editing.dueAt ?? null);
      setStarred(editing.starred);
      setRecur(editing.recurFreq ?? 'none');
    } else {
      setTitle('');
      setNote('');
      setListId(defaultListId ?? lists[0]?.id ?? '');
      setPriority(0);
      setDueAt(null);
      setStarred(false);
      setRecur('none');
    }
    setError(null);
  }, [isOpen, editing, defaultListId, lists]);

  const applyTemplate = (tmpl: TaskTemplate) => {
    const prefill = templateToNewTask(tmpl, (k) => tr(k as never), {
      listId: listId || (lists[0]?.id ?? ''),
    });
    setTitle(prefill.title);
    setNote(prefill.note ?? '');
    setPriority(prefill.priority);
    setStarred(prefill.starred);
    setRecur(prefill.recurFreq ?? 'none');
    setTemplateOpen(false);
  };

  const save = async () => {
    if (!title.trim()) {
      setError(tr('todo.titlePlaceholder'));
      return;
    }
    const input: NewTask = {
      listId: listId || lists[0]?.id,
      title: title.trim(),
      note: note || null,
      priority,
      dueAt: dueAt,
      hasTime: dueAt ? dueAt.includes('T') : false,
      starred,
      recurFreq: recur === 'none' ? null : recur,
      recurInterval: recur === 'none' ? null : 1,
    };
    try {
      if (editing) {
        await editTask(editing.id, input, reloadFilter);
      } else {
        await addTask(input);
        await loadTasks(reloadFilter);
      }
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{editing ? tr('todo.editTask') : tr('todo.newTask')}</IonTitle>
          <IonButtons slot="start">
            <IonButton onClick={onClose}>{tr('common.cancel')}</IonButton>
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
          <IonLabel position="stacked">{tr('todo.title')}</IonLabel>
          <IonInput
            value={title}
            placeholder={tr('todo.titlePlaceholder')}
            onIonInput={(e) => setTitle(e.detail.value ?? '')}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{tr('todo.list')}</IonLabel>
          <IonSelect value={listId} onIonChange={(e) => setListId(e.detail.value)}>
            {lists.map((l) => (
              <IonSelectOption key={l.id} value={l.id}>
                {l.name}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{tr('todo.priority')}</IonLabel>
          <IonSelect value={priority} onIonChange={(e) => setPriority(e.detail.value)}>
            <IonSelectOption value={0}>{tr('todo.priority.none')}</IonSelectOption>
            <IonSelectOption value={1}>{tr('todo.priority.low')}</IonSelectOption>
            <IonSelectOption value={2}>{tr('todo.priority.medium')}</IonSelectOption>
            <IonSelectOption value={3}>{tr('todo.priority.high')}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{tr('todo.dueDate')}</IonLabel>
          <IonDatetime
            presentation="date"
            value={dueAt}
            onIonChange={(e) => setDueAt(e.detail.value ? String(e.detail.value) : null)}
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{tr('todo.repeat')}</IonLabel>
          <IonSelect value={recur} onIonChange={(e) => setRecur(e.detail.value)}>
            <IonSelectOption value="none">{tr('todo.repeat.none')}</IonSelectOption>
            <IonSelectOption value="daily">{tr('todo.repeat.daily')}</IonSelectOption>
            <IonSelectOption value="weekly">{tr('todo.repeat.weekly')}</IonSelectOption>
            <IonSelectOption value="monthly">{tr('todo.repeat.monthly')}</IonSelectOption>
          </IonSelect>
        </IonItem>
        <IonItem>
          <IonLabel>{tr('todo.starred')}</IonLabel>
          <IonToggle
            checked={starred}
            onIonChange={(e) => setStarred(e.detail.checked)}
            slot="end"
          />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">{tr('todo.note')}</IonLabel>
          <IonTextarea
            value={note}
            autoGrow
            placeholder={tr('common.optional')}
            onIonInput={(e) => setNote(e.detail.value ?? '')}
          />
        </IonItem>
        {error && (
          <IonText color="danger">
            <p>{error}</p>
          </IonText>
        )}

        {!editing && (
          <div style={{ padding: '8px 16px' }}>
            <IonButton
              expand="block"
              fill="outline"
              onClick={() => setTemplateOpen(true)}
            >
              <IonIcon slot="start" icon={storefrontOutline} />
              {tr('todo.useTemplate')}
            </IonButton>
          </div>
        )}
      </IonContent>

      <IonModal isOpen={templateOpen} onDidDismiss={() => setTemplateOpen(false)}>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setTemplateOpen(false)}>
                {tr('common.cancel')}
              </IonButton>
            </IonButtons>
            <IonTitle>{tr('todo.templates')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {TASK_TEMPLATES.length === 0 ? (
            <div className="center-empty">
              <p>{tr('todo.template.empty')}</p>
            </div>
          ) : (
            <IonList lines="none">
              {TASK_TEMPLATES.map((t) => (
                <IonItem
                  key={t.id}
                  button
                  onClick={() => applyTemplate(t)}
                  className="tx-item"
                >
                  <div slot="start" style={{ fontSize: 28, marginRight: 12 }}>
                    {t.emoji}
                  </div>
                  <IonLabel>
                    <h2 style={{ fontWeight: 600 }}>{tr(t.titleKey)}</h2>
                    <p style={{ color: 'var(--ion-color-medium)' }}>
                      {tr(t.descriptionKey)}
                    </p>
                    {t.recurFreq && (
                      <IonChip
                        outline
                        color="primary"
                        style={{ marginTop: 6 }}
                      >
                        {tr(`todo.repeat.${t.recurFreq}` as 'todo.repeat.daily')}
                      </IonChip>
                    )}
                  </IonLabel>
                  <IonNote slot="end" style={{ fontSize: 18, color: 'var(--app-accent)' }}>
                    {t.priority > 0 ? '★'.repeat(t.priority) : ''}
                  </IonNote>
                </IonItem>
              ))}
            </IonList>
          )}
        </IonContent>
      </IonModal>
    </IonModal>
  );
}
