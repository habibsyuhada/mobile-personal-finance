import { useEffect, useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonButtons,
  IonIcon,
  IonModal,
  IonInput,
  IonItem,
  IonLabel,
  IonText,
  useIonAlert,
} from '@ionic/react';
import { add, documentTextOutline, gridOutline, searchOutline, menuOutline } from 'ionicons/icons';
import { useParams, useHistory } from 'react-router-dom';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import SidebarTree from '../components/SidebarTree';
import PageHeader from '../components/PageHeader';
import EditorArea from '../components/EditorArea';
import GlobalSearch from '../components/GlobalSearch';
import QuickSwitcher from '../components/QuickSwitcher';
import DatabaseTableView from '../components/DatabaseTableView';
import DatabaseBoardView from '../components/DatabaseBoardView';
import DatabaseListView from '../components/DatabaseListView';
import ModuleEmpty from '@/lib/ModuleEmpty';
import type { PageType } from '../data/models';

export default function NotesPage({ pageId }: { pageId?: string }) {
  const tr = useT();
  const params = useParams<{ id?: string }>();
  const id = pageId ?? params.id;
  const history = useHistory();
  const [presentAlert] = useIonAlert();

  const refreshTree = useNotesStore((s) => s.refreshTree);
  const refreshRecent = useNotesStore((s) => s.refreshRecent);
  const refreshTrash = useNotesStore((s) => s.refreshTrash);
  const pages = useNotesStore((s) => s.pages);
  const currentPage = useNotesStore((s) => s.currentPage);
  const currentBlocks = useNotesStore((s) => s.currentBlocks);
  const currentView = useNotesStore((s) => s.currentView);
  const openPage = useNotesStore((s) => s.openPage);
  const createPage = useNotesStore((s) => s.createPage);
  const setSearchOpen = useNotesStore((s) => s.setSearchOpen);
  const setSwitcherOpen = useNotesStore((s) => s.setSwitcherOpen);
  const addRow = useNotesStore((s) => s.addRow);
  const updateRow = useNotesStore((s) => s.updateRow);
  const removeRow = useNotesStore((s) => s.removeRow);
  const setViewType = useNotesStore((s) => s.setViewType);

  const [createOpen, setCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<PageType>('page');
  const [createError, setCreateError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    void refreshTree();
    void refreshRecent();
    void refreshTrash();
  }, [refreshTree, refreshRecent, refreshTrash]);

  useEffect(() => {
    if (id) {
      void openPage(id);
    } else {
      void openPage(null);
    }
  }, [id, openPage]);

  // Global keyboard shortcuts: Cmd/Ctrl+K = search, Cmd/Ctrl+P = switcher.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setSwitcherOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSearchOpen, setSwitcherOpen]);

  const openCreate = (type: PageType) => {
    setCreateType(type);
    setCreateTitle(type === 'database' ? 'Database baru' : 'Tanpa judul');
    setCreateError(null);
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!createTitle.trim()) {
      setCreateError(tr('notes.page.untitled'));
      return;
    }
    const p = await createPage(null, createType);
    if (createTitle.trim() !== 'Tanpa judul' && createTitle.trim() !== 'Database baru') {
      await useNotesStore.getState().renamePage(p.id, createTitle.trim());
    }
    setCreateOpen(false);
    history.push(`/m/notes/page/${p.id}`);
  };

  const confirmDeleteCurrent = () => {
    if (!currentPage) return;
    presentAlert({
      header: tr('notes.menu.moveToTrash'),
      message: currentPage.title,
      buttons: [
        { text: tr('common.cancel'), role: 'cancel' },
        {
          text: tr('notes.page.delete'),
          role: 'destructive',
          handler: () => {
            useNotesStore.getState().deletePage(currentPage.id);
            history.push('/m/notes/all');
          },
        },
      ],
    });
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => setSidebarOpen(true)} aria-label="Open sidebar" className="notes-sidebar-toggle">
              <IonIcon slot="icon-only" icon={menuOutline} />
            </IonButton>
            <IonButton onClick={() => history.push('/m/notes/all')}>
              <IonIcon slot="icon-only" icon={documentTextOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{tr('notes.title')}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => setSwitcherOpen(true)} aria-label={tr('notes.search.open')}>
              <IonIcon slot="icon-only" icon={searchOutline} />
            </IonButton>
            <IonButton onClick={() => openCreate('page')}>
              <IonIcon slot="icon-only" icon={add} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="notes-layout">
          <aside className={'notes-sidebar-pane' + (sidebarOpen ? ' is-open' : '')}>
            <SidebarTree />
            <div className="notes-sidebar-foot">
              <button type="button" onClick={() => openCreate('page')}>
                <IonIcon icon={add} /> {tr('notes.createRoot')}
              </button>
              <button type="button" onClick={() => openCreate('database')}>
                <IonIcon icon={gridOutline} /> {tr('notes.createRootDatabase')}
              </button>
            </div>
          </aside>
          {sidebarOpen && <div className="notes-sidebar-scrim" onClick={() => setSidebarOpen(false)} />}
          <main className="notes-main">
            {!currentPage ? (
              <ModuleEmpty
                emoji="📝"
                title={tr('notes.emptyState.title')}
                body={tr('notes.emptyState.body')}
              />
            ) : currentPage.type === 'database' ? (
              <DatabaseView
                viewType={currentView?.viewType ?? 'table'}
                onSwitchView={(v) => {
                  if (currentView) void setViewType(currentView.id, v);
                }}
                onAddRow={() => void addRow()}
                onChangeRow={(rowId, values) => void updateRow(rowId, values)}
                onDeleteRow={(rowId) => void removeRow(rowId)}
              />
            ) : (
              <>
                <PageHeader
                  page={currentPage}
                  onOpenMenu={(_anchor) => confirmDeleteCurrent()}
                />
                <EditorArea pageId={currentPage.id} blocks={currentBlocks} />
              </>
            )}
          </main>
        </div>
      </IonContent>
      <IonModal isOpen={createOpen} onDidDismiss={() => setCreateOpen(false)}>
        <IonHeader className="ion-no-border">
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setCreateOpen(false)}>{tr('common.cancel')}</IonButton>
            </IonButtons>
            <IonTitle>{createType === 'database' ? tr('notes.page.newDatabase') : tr('notes.page.new')}</IonTitle>
            <IonButtons slot="end">
              <IonButton strong onClick={submitCreate}>{tr('common.save')}</IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonItem>
            <IonLabel position="stacked">{tr('notes.page.untitled')}</IonLabel>
            <IonInput
              value={createTitle}
              onIonInput={(e) => setCreateTitle(e.detail.value ?? '')}
              autofocus
            />
          </IonItem>
          {createError && (
            <IonText color="danger">
              <p style={{ padding: '0 16px' }}>{createError}</p>
            </IonText>
          )}
        </IonContent>
      </IonModal>
      <GlobalSearchShell />
      <SwitcherShell />
      <div className="notes-hint" aria-hidden="true">
        {pages.length === 0 ? tr('notes.page.empty') : ''}
      </div>
    </IonPage>
  );
}

function GlobalSearchShell() {
  const open = useNotesStore((s) => s.searchOpen);
  const setSearchOpen = useNotesStore((s) => s.setSearchOpen);
  return <GlobalSearch open={open} onClose={() => setSearchOpen(false)} />;
}

function SwitcherShell() {
  const open = useNotesStore((s) => s.switcherOpen);
  const setSwitcherOpen = useNotesStore((s) => s.setSwitcherOpen);
  return <QuickSwitcher open={open} onClose={() => setSwitcherOpen(false)} />;
}

interface DatabaseViewProps {
  viewType: 'table' | 'board' | 'list';
  onSwitchView: (v: 'table' | 'board' | 'list') => void;
  onAddRow: () => void;
  onChangeRow: (rowId: string, values: Record<string, unknown>) => void;
  onDeleteRow: (rowId: string) => void;
}

function DatabaseView({ viewType, onSwitchView, onAddRow, onChangeRow, onDeleteRow }: DatabaseViewProps) {
  const tr = useT();
  const currentDatabase = useNotesStore((s) => s.currentDatabase);
  const currentRows = useNotesStore((s) => s.currentRows);
  const currentView = useNotesStore((s) => s.currentView);

  if (!currentDatabase) {
    return <div className="notes-db-empty">{tr('notes.view.empty.body')}</div>;
  }

  const groupBy = currentView?.config?.groupBy;
  const titleProp = currentDatabase.properties.find((p) => p.id === 'name') ?? currentDatabase.properties[0];

  return (
    <div className="notes-db">
      <div className="notes-db-toolbar">
        <div className="notes-db-view-tabs">
          {(['table', 'board', 'list'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={'notes-db-view-tab' + (viewType === v ? ' is-active' : '')}
              onClick={() => onSwitchView(v)}
            >
              {tr(`notes.view.${v}`)}
            </button>
          ))}
        </div>
      </div>
      {viewType === 'table' && (
        <DatabaseTableView
          databaseId={currentDatabase.id}
          properties={currentDatabase.properties}
          rows={currentRows}
          onChangeRow={onChangeRow}
          onDeleteRow={onDeleteRow}
          onAddRow={onAddRow}
        />
      )}
      {viewType === 'board' && (
        <DatabaseBoardView
          properties={currentDatabase.properties}
          rows={currentRows}
          groupBy={groupBy ?? titleProp?.id}
          onChangeRow={onChangeRow}
          onAddRow={onAddRow}
        />
      )}
      {viewType === 'list' && <DatabaseListView properties={currentDatabase.properties} rows={currentRows} />}
    </div>
  );
}
