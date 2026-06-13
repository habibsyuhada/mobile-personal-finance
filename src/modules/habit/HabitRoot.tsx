import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import { todayOutline, listOutline } from 'ionicons/icons';
import TodayHabitsPage from './pages/TodayHabitsPage';
import AllHabitsPage from './pages/AllHabitsPage';
import { useT } from '@/i18n/useT';

export default function HabitRoot() {
  const t = useT();
  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/m/habit/today" render={() => <TodayHabitsPage />} />
        <Route exact path="/m/habit/all" render={() => <AllHabitsPage />} />
        <Route exact path="/m/habit" render={() => <Redirect to="/m/habit/today" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom">
        <IonTabButton tab="today" href="/m/habit/today">
          <IonIcon icon={todayOutline} />
          <IonLabel>{t('habit.today')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="all" href="/m/habit/all">
          <IonIcon icon={listOutline} />
          <IonLabel>{t('habit.all')}</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  );
}
