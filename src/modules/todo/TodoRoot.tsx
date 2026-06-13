import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { todayOutline, calendarOutline, listOutline } from 'ionicons/icons';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import ListsPage from './pages/ListsPage';
import { useT } from '@/i18n/useT';

export default function TodoRoot() {
  const t = useT();
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/m/todo/today" render={() => <TodayPage />} />
        <Route exact path="/m/todo/upcoming" render={() => <UpcomingPage />} />
        <Route exact path="/m/todo/lists" render={() => <ListsPage />} />
        <Route exact path="/m/todo" render={() => <Redirect to="/m/todo/today" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/m/todo/today">
          <IonIcon icon={todayOutline} />
          <IonLabel>{t('todo.today')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="upcoming" href="/m/todo/upcoming">
          <IonIcon icon={calendarOutline} />
          <IonLabel>{t('todo.upcoming')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="lists" href="/m/todo/lists">
          <IonIcon icon={listOutline} />
          <IonLabel>{t('todo.lists')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
