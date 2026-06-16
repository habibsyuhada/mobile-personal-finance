import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSearchbar,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
} from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import { highlightSnippet } from '../lib/search';

export default function SearchPage() {
  const tr = useT();
  const [query, setQuery] = useState('');
  const runSearch = useNotesStore((s) => s.runSearch);
  const results = useNotesStore((s) => s.searchResults);
  const openPage = useNotesStore((s) => s.openPage);
  const history = useHistory();

  useEffect(() => {
    const t = setTimeout(() => void runSearch(query), 200);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const pick = async (pageId: string) => {
    await openPage(pageId);
    history.push(`/m/notes/page/${pageId}`);
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonTitle>{tr('notes.tabs.search')}</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSearchbar
            value={query}
            placeholder={tr('notes.search.placeholder')}
            onIonInput={(e) => setQuery(e.detail.value ?? '')}
            debounce={0}
            showCancelButton="never"
            animated
          />
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {query.trim() === '' ? (
          <div className="notes-search-page-empty">{tr('notes.search.recentEmpty')}</div>
        ) : results.length === 0 ? (
          <div className="notes-search-page-empty">{tr('notes.search.empty')}</div>
        ) : (
          <IonList lines="none">
            {results.map((r) => (
              <IonItem key={r.page.id} button onClick={() => void pick(r.page.id)}>
                <IonIcon icon={r.page.icon ? undefined : documentTextOutline} slot="start" />
                <IonLabel>
                  <h2>{r.page.title}</h2>
                  <p>{highlightSnippet(r.snippet, query)}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
}
