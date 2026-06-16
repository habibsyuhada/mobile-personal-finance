import { IonIcon } from '@ionic/react';
import { add, gridOutline } from 'ionicons/icons';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import type { DbRow, PropertyDef, PropertyValue } from '../data/models';
import { useHistory } from 'react-router-dom';

interface Props {
  properties: PropertyDef[];
  rows: DbRow[];
  groupBy: string | undefined;
  onChangeRow: (rowId: string, values: Record<string, PropertyValue>) => void;
  onAddRow: () => void;
}

export default function DatabaseBoardView({ properties, rows, groupBy, onAddRow }: Props) {
  const tr = useT();
  const history = useHistory();
  const openPage = useNotesStore((s) => s.openPage);
  const groupProp = properties.find((p) => p.id === groupBy);

  if (!groupProp || groupProp.type !== 'select') {
    return (
      <div className="notes-db-empty">
        <p>{tr('notes.notImplemented')}</p>
      </div>
    );
  }

  const opts = groupProp.options ?? [];
  const groups: Record<string, DbRow[]> = {};
  for (const o of opts) groups[o.id] = [];
  groups['__none__'] = [];
  for (const r of rows) {
    const v = r.properties[groupProp.id];
    if (typeof v === 'string' && groups[v]) groups[v].push(r);
    else groups['__none__'].push(r);
  }

  const open = async (pageId: string) => {
    await openPage(pageId);
    history.push(`/m/notes/page/${pageId}`);
  };

  return (
    <div className="notes-db-board">
      {opts.map((o) => (
        <div key={o.id} className="notes-db-board-col">
          <div className="notes-db-board-col-head" style={{ background: o.color }}>
            <span>{o.name}</span>
            <span className="notes-db-board-col-count">{groups[o.id].length}</span>
          </div>
          <div className="notes-db-board-col-body">
            {groups[o.id].map((r) => (
              <button
                key={r.id}
                type="button"
                className="notes-db-board-card"
                onClick={() => open(r.pageId)}
              >
                <div className="notes-db-board-card-title">{r.properties['name'] as string ?? 'Tanpa judul'}</div>
                <IonIcon icon={gridOutline} className="notes-db-board-card-icon" />
              </button>
            ))}
            <button type="button" className="notes-db-board-add" onClick={onAddRow}>
              <IonIcon icon={add} /> {tr('notes.view.addRow')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
