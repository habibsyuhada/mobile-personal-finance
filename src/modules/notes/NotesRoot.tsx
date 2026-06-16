import { IonRouterOutlet } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import NotesPage from './pages/NotesPage';
import TrashPage from './pages/TrashPage';
import SearchPage from './pages/SearchPage';
import { NOTES_TABS } from './notes.tabs';
import './notes.css';

export { NOTES_TABS };

export default function NotesRoot() {
  return (
    <IonRouterOutlet>
      <Route exact path="/m/notes/all" render={() => <NotesPage />} />
      <Route exact path="/m/notes/page/:id" render={(props) => <NotesPage pageId={props.match.params.id} />} />
      <Route exact path="/m/notes/search" render={() => <SearchPage />} />
      <Route exact path="/m/notes/trash" render={() => <TrashPage />} />
      <Route exact path="/m/notes" render={() => <Redirect to="/m/notes/all" />} />
    </IonRouterOutlet>
  );
}
