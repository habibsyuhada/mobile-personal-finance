import { IonIcon } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import type { DbRow, PropertyDef } from '../data/models';

interface Props {
  properties: PropertyDef[];
  rows: DbRow[];
}

export default function DatabaseListView({ properties, rows }: Props) {
  const tr = useT();
  const history = useHistory();
  const openPage = useNotesStore((s) => s.openPage);
  const nameProp = properties.find((p) => p.id === 'name') ?? properties[0];

  const open = async (pageId: string) => {
    await openPage(pageId);
    history.push(`/m/notes/page/${pageId}`);
  };

  return (
    <div className="notes-db-list">
      {rows.length === 0 && <div className="notes-db-empty">{tr('notes.view.empty.body')}</div>}
      {rows.map((r) => {
        const title = (r.properties[nameProp?.id ?? 'name'] as string) || 'Tanpa judul';
        const summary = properties
          .filter((p) => p.id !== nameProp?.id)
          .slice(0, 2)
          .map((p) => {
            const v = r.properties[p.id];
            return v == null || v === '' ? null : `${p.name}: ${String(v)}`;
          })
          .filter(Boolean)
          .join(' · ');
        return (
          <button key={r.id} type="button" className="notes-db-list-item" onClick={() => open(r.pageId)}>
            <IonIcon icon={documentTextOutline} className="notes-db-list-icon" />
            <div>
              <div className="notes-db-list-title">{title}</div>
              {summary && <div className="notes-db-list-summary">{summary}</div>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
