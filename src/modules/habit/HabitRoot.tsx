import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import TodayHabitsPage from './pages/TodayHabitsPage';
import AllHabitsPage from './pages/AllHabitsPage';
import { HABIT_TABS } from './habit.tabs';

export { HABIT_TABS };

export default function HabitRoot() {
  return (
    <IonRouterOutlet>
      <Route exact path="/m/habit/today" render={() => <TodayHabitsPage />} />
      <Route exact path="/m/habit/all" render={() => <AllHabitsPage />} />
      <Route exact path="/m/habit" render={() => <Redirect to="/m/habit/today" />} />
    </IonRouterOutlet>
  );
}
