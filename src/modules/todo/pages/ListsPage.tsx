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
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonButton,
  IonInput,
  IonText,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonNote,
  useIonAlert,
} from '@ionic/react';
import { add, trash, create as editIcon, listOutline, chevronForward } from 'ionicons/icons';
import { useTodoStore, todoService } from '../store/todo.store';
import type { Task, TaskFilter, TodoList } from '../data/models';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import { useT } from '@/i18n/useT';

const COLORS = ['#6366f1', '#0ea5e9', '#16a34a', '#f59e0b', '#ec4899', '#8b5cf6'];

export default function ListsPage() {
  const lists = useTodoStore((s) => s.lists);
  const counts = useTodoStore((s) => s.counts);
  const tasks = useTodoStore((s) => s.tasks);
  const refreshLists = useTodoStore((s) => s.refreshLists);
  const loadTasks = useTodoStore((s) => s.loadTasks);
  const toggle = useTodoStore((s) => s.toggle);
  const deleteTask = useTodoStore((s) => s.deleteTask);
  const tr = useT();
  const [presentAlert] = useIonAlert();

  const [activeList, setActiveList] = useState<TodoList | null>(null);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<TodoList | null>(null);
  const [listName, setListName] = useState('');
  const [listColor, setListColor] = useState(COLORS[0]);
  const [listErr, setListErr] = useState<string | null>(null);

  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const activeFilter: TaskFilter | undefined = activeList
    ? { listId: activeList.id }
    : undefined;

  useEffect(() => {
    refreshLists();
  }, [refreshLists]);

  useEffect(() => {
    if (activeList) loadTasks({ listId: activeList.id });
  }, [activeList, loadTasks]);

  // ---- List CRUD ----
  const openNewList = () => {
    setEditingList(null);
    setListName('');
    setListColor(COLORS[0]);
    setListErr(null);
    setListModalOpen(true);
  };
  const openEditList = (l: TodoList) => {
    setEditingList(l);
    setListName(l.name);
    setListColor(l.color ?? COLORS[0]);
    setListErr(null);
    setListModalOpen(true);
  };
  const saveList = async () => {
    if (!listName.trim()) {
      setListErr(tr('todo.listName'));
      return;
    }
    try {
      if (editingList) {
        await todoService().updateList(editingList.id, { name: listName.trim(), color: listColor });
      } else {
        await todoService().createList(listName.trim(), listColor);
      }
      await refreshLists();
      setListModalOpen(false);
    } catch (e) {
      setListErr(e instanceof Error ? e.message : String(e));
    }
  };
  const confirmDeleteList = (l: TodoList) => {
    if (l.isDefault) return;
    presentAlert({
      header: tr('todo.deleteListTitle'),
      message: tr('todo.deleteListMsg'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('common.delete'),
          role: 'destructive',
          handler: async () => {
            const inbox = lists.find((x) => x.isDefault);
            await todoService().removeList(l.id, inbox?.id);
            await refreshLists();
          },
        },
      ],
    });
  };

  // ---- Task delete ----
  const confirmDeleteTask = (t: Task) => {
    presentAlert({
      header: tr('todo.deleteTaskTitle'),
      message: tr('todo.deleteTaskMsg'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        { text: tr('common.delete'), role: 'destructive', handler: () => deleteTask(t.id, activeFilter) },
      ],
    });
  };

  // ---- Detail view (tasks in a list) ----
  if (activeList) {
    return (
      <IonPage>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setActiveList(null)}>{tr('common.cancel')}</IonButton>
            </IonButtons>
            <IonTitle>{activeList.name}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {tasks.length === 0 ? (
            <div className="center-empty">
              <p>{tr('todo.emptyList')}</p>
            </div>
          ) : (
            <IonList lines="none">
              {tasks.map((t) => (
                <TaskItem
                  key={t.id}
                  task={t}
                  onToggle={(task) => toggle(task, activeFilter)}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setTaskFormOpen(true);
                  }}
                  onDelete={confirmDeleteTask}
                />
              ))}
            </IonList>
          )}

          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton
              onClick={() => {
                setEditingTask(null);
                setTaskFormOpen(true);
              }}
            >
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>

          <TaskForm
            isOpen={taskFormOpen}
            editing={editingTask}
            defaultListId={activeList.id}
            reloadFilter={activeFilter}
            onClose={() => {
              setTaskFormOpen(false);
              setEditingTask(null);
            }}
          />
        </IonContent>
      </IonPage>
    );
  }

  // ---- Lists overview ----
  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{tr('todo.lists')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonList lines="none">
          {lists.map((l) => (
            <IonItemSliding key={l.id}>
              <IonItem button className="tx-item" onClick={() => setActiveList(l)}>
                <div className="cat-avatar" slot="start" style={{ background: l.color ?? '#94a3b8' }}>
                  <IonIcon icon={listOutline} />
                </div>
                <IonLabel>{l.name}</IonLabel>
                <IonNote slot="end">{counts[l.id] ?? 0}</IonNote>
                <IonIcon icon={chevronForward} slot="end" />
              </IonItem>
              {!l.isDefault && (
                <IonItemOptions side="end">
                  <IonItemOption onClick={() => openEditList(l)}>
                    <IonIcon slot="icon-only" icon={editIcon} />
                  </IonItemOption>
                  <IonItemOption color="danger" onClick={() => confirmDeleteList(l)}>
                    <IonIcon slot="icon-only" icon={trash} />
                  </IonItemOption>
                </IonItemOptions>
              )}
            </IonItemSliding>
          ))}
        </IonList>

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={openNewList}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <IonModal isOpen={listModalOpen} onDidDismiss={() => setListModalOpen(false)}>
          <IonHeader className="ion-no-border">
            <IonToolbar>
              <IonTitle>{editingList ? tr('todo.editList') : tr('todo.newList')}</IonTitle>
              <IonButtons slot="start">
                <IonButton onClick={() => setListModalOpen(false)}>{tr('common.cancel')}</IonButton>
              </IonButtons>
              <IonButtons slot="end">
                <IonButton strong onClick={saveList}>
                  {tr('common.save')}
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonItem>
              <IonLabel position="stacked">{tr('todo.listName')}</IonLabel>
              <IonInput value={listName} onIonInput={(e) => setListName(e.detail.value ?? '')} />
            </IonItem>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '16px' }}>
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setListColor(c)}
                  aria-label={c}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    background: c,
                    border: listColor === c ? '3px solid var(--ion-color-dark)' : '2px solid #fff',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
            {listErr && (
              <IonText color="danger">
                <p style={{ padding: '0 16px' }}>{listErr}</p>
              </IonText>
            )}
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
