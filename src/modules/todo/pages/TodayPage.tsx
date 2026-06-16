import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonFab,
  IonFabButton,
  IonRefresher,
  IonRefresherContent,
  useIonAlert,
  useIonToast,
} from '@ionic/react';
import { add, appsOutline, calendarOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useTodoStore, todoService } from '../store/todo.store';
import type { Task, TaskFilter } from '../data/models';
import TaskItem from '../components/TaskItem';
import TaskForm from '../components/TaskForm';
import { useT } from '@/i18n/useT';
import { haptics } from '@/lib/haptics';
import { useCelebration } from '@/store/celebration.store';

const FILTER: TaskFilter = { view: 'today' };

export default function TodayPage() {
  const tasks = useTodoStore((s) => s.tasks);
  const loadTasks = useTodoStore((s) => s.loadTasks);
  const refreshLists = useTodoStore((s) => s.refreshLists);
  const toggle = useTodoStore((s) => s.toggle);
  const deleteTask = useTodoStore((s) => s.deleteTask);
  const tr = useT();
  const history = useHistory();
  const [presentAlert] = useIonAlert();
  const [presentToast] = useIonToast();
  const showCelebration = useCelebration((s) => s.show);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const handlePostpone = async (task: Task) => {
    haptics.medium();
    const updated = await todoService().postpone(task, 1);
    if (updated) {
      presentToast({
        message: tr('todo.postponed', { title: task.title }),
        duration: 2500,
        position: 'bottom',
        icon: calendarOutline,
      });
      await loadTasks(FILTER);
    }
  };

  useEffect(() => {
    refreshLists();
    loadTasks(FILTER);
  }, [refreshLists, loadTasks]);

  const confirmDelete = (t: Task) => {
    presentAlert({
      header: tr('todo.deleteTaskTitle'),
      message: tr('todo.deleteTaskMsg'),
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('common.delete'),
          role: 'destructive',
          handler: () => deleteTask(t.id, FILTER),
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => history.push('/')}>
              <IonIcon slot="icon-only" icon={appsOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{tr('todo.today')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={(e) => loadTasks(FILTER).then(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {tasks.length === 0 ? (
          <div className="center-empty">
            <p>{tr('todo.emptyToday')}</p>
          </div>
        ) : (
          <IonList lines="none">
            {tasks.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                onToggle={(task) => {
                  if (!task.completed) {
                    haptics.success();
                    showCelebration('✅');
                  } else {
                    haptics.tap();
                  }
                  toggle(task, FILTER);
                }}
                onEdit={(task) => {
                  setEditing(task);
                  setFormOpen(true);
                }}
                onDelete={confirmDelete}
                onPostpone={handlePostpone}
              />
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <TaskForm
          isOpen={formOpen}
          editing={editing}
          reloadFilter={FILTER}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
        />
      </IonContent>
    </IonPage>
  );
}
