import { useMemo, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { add, trashOutline } from 'ionicons/icons';
import { useT } from '@/i18n/useT';
import type { DbRow, PropertyDef, PropertyType, PropertyValue } from '../data/models';

interface Props {
  databaseId: string;
  properties: PropertyDef[];
  rows: DbRow[];
  onChangeRow: (rowId: string, values: Record<string, PropertyValue>) => void;
  onDeleteRow: (rowId: string) => void;
  onAddRow: () => void;
}

export default function DatabaseTableView({ properties, rows, onChangeRow, onDeleteRow, onAddRow }: Props) {
  const tr = useT();

  return (
    <div className="notes-db-table-wrap">
      <table className="notes-db-table">
        <thead>
          <tr>
            {properties.map((p) => (
              <th key={p.id} style={{ minWidth: colWidth(p.type) }}>
                {p.name}
              </th>
            ))}
            <th className="notes-db-table-actions-col" aria-label={tr('notes.view.deleteRow')} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={properties.length + 1} className="notes-db-empty">
                {tr('notes.view.empty.body')}
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              {properties.map((p) => (
                <td key={p.id} className="notes-db-cell">
                  <CellEditor
                    property={p}
                    value={r.properties[p.id]}
                    onChange={(v) => onChangeRow(r.id, { ...r.properties, [p.id]: v })}
                  />
                </td>
              ))}
              <td className="notes-db-cell-action">
                <button
                  type="button"
                  className="notes-icon-btn danger"
                  onClick={() => onDeleteRow(r.id)}
                  aria-label={tr('notes.view.deleteRow')}
                  title={tr('notes.view.deleteRow')}
                >
                  <IonIcon icon={trashOutline} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="notes-db-add-row">
        <button type="button" className="notes-editor-add" onClick={onAddRow}>
          <IonIcon icon={add} /> {tr('notes.view.addRow')}
        </button>
      </div>
    </div>
  );
}

function colWidth(type: PropertyType): number {
  switch (type) {
    case 'checkbox':
      return 80;
    case 'date':
      return 140;
    case 'number':
      return 100;
    case 'url':
    case 'email':
    case 'phone':
      return 180;
    case 'select':
    case 'multi_select':
      return 140;
    case 'text':
    default:
      return 160;
  }
}

interface CellEditorProps {
  property: PropertyDef;
  value: PropertyValue;
  onChange: (v: PropertyValue) => void;
}

function CellEditor({ property, value, onChange }: CellEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(toStringValue(value));

  const commit = () => {
    setEditing(false);
    const next = fromStringValue(draft, property.type);
    if (next !== value) onChange(next);
  };

  if (property.type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value === true}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={property.name}
      />
    );
  }

  if (property.type === 'select') {
    const opts = property.options ?? [];
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={property.name}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    );
  }

  if (property.type === 'multi_select') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const opts = property.options ?? [];
    return (
      <div className="notes-db-multi">
        {opts.map((o) => {
          const active = arr.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              className={'notes-db-chip' + (active ? ' is-active' : '')}
              style={active ? { background: o.color } : undefined}
              onClick={() => {
                const next = active ? arr.filter((x) => x !== o.id) : [...arr, o.id];
                onChange(next);
              }}
            >
              {o.name}
            </button>
          );
        })}
      </div>
    );
  }

  if (property.type === 'date') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value.slice(0, 10) : ''}
        onChange={(e) => onChange(e.target.value || null)}
        aria-label={property.name}
      />
    );
  }

  if (property.type === 'number') {
    return (
      <input
        type="number"
        value={typeof value === 'number' ? value : draft}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        aria-label={property.name}
      />
    );
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={inputTypeFor(property.type)}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        aria-label={property.name}
      />
    );
  }

  return (
    <button type="button" className="notes-db-text-btn" onClick={() => setEditing(true)}>
      {displayValue(value, property.type)}
    </button>
  );
}

function inputTypeFor(type: PropertyType): string {
  switch (type) {
    case 'url':
      return 'url';
    case 'email':
      return 'email';
    case 'phone':
      return 'tel';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    default:
      return 'text';
  }
}

function toStringValue(v: PropertyValue): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return v ? '☑' : '';
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

function fromStringValue(s: string, type: PropertyType): PropertyValue {
  if (s === '') return null;
  switch (type) {
    case 'number': {
      const n = Number(s);
      return Number.isNaN(n) ? null : n;
    }
    case 'checkbox':
      return s === '☑';
    case 'multi_select':
      return s.split(',').map((x) => x.trim()).filter(Boolean);
    default:
      return s;
  }
}

function displayValue(v: PropertyValue, type: PropertyType): string {
  if (v == null || v === '') return '—';
  if (type === 'checkbox') return v === true ? '☑' : '☐';
  if (type === 'date' && typeof v === 'string') return v.slice(0, 10);
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

void useMemo;
