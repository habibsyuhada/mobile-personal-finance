import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import TodayPage from './pages/TodayPage';
import UpcomingPage from './pages/UpcomingPage';
import ListsPage from './pages/ListsPage';
import { TODO_TABS } from './todo.tabs';

export { TODO_TABS };

export default function TodoRoot() {
  return (
    <IonRouterOutlet>
      <Route exact path="/m/todo/today" render={() => <TodayPage />} />
      <Route exact path="/m/todo/upcoming" render={() => <UpcomingPage />} />
      <Route exact path="/m/todo/lists" render={() => <ListsPage />} />
      <Route exact path="/m/todo" render={() => <Redirect to="/m/todo/today" />} />
    </IonRouterOutlet>
  );
}
