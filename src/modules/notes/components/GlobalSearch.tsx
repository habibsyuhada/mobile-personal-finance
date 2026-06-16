import { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { closeOutline, searchOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import { highlightSnippet } from '../lib/search';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const tr = useT();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const runSearch = useNotesStore((s) => s.runSearch);
  const results = useNotesStore((s) => s.searchResults);
  const openPage = useNotesStore((s) => s.openPage);
  const history = useHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setDebounced('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 200);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    void runSearch(debounced);
  }, [debounced, open, runSearch]);

  useEffect(() => {
    setActiveIdx(0);
  }, [results.length]);

  if (!open) return null;

  const pick = async (pageId: string) => {
    await openPage(pageId);
    history.push(`/m/notes/page/${pageId}`);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(results.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) void pick(r.page.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="notes-search-overlay" role="dialog" aria-modal="true" onKeyDown={onKey}>
      <div className="notes-search-backdrop" onClick={onClose} />
      <div className="notes-search-modal">
        <div className="notes-search-input-wrap">
          <IonIcon icon={searchOutline} className="notes-search-icon" />
          <input
            ref={inputRef}
            className="notes-search-input"
            placeholder={tr('notes.search.placeholder')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={tr('notes.search.placeholder')}
          />
          <button type="button" className="notes-search-close" onClick={onClose} aria-label="Close">
            <IonIcon icon={closeOutline} />
          </button>
        </div>
        <div className="notes-search-results">
          {query.trim() === '' ? (
            <div className="notes-search-empty">{tr('notes.search.recentEmpty')}</div>
          ) : results.length === 0 ? (
            <div className="notes-search-empty">{tr('notes.search.empty')}</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.page.id}
                type="button"
                className={'notes-search-item' + (i === activeIdx ? ' is-active' : '')}
                onClick={() => pick(r.page.id)}
                onMouseEnter={() => setActiveIdx(i)}
              >
                <span className="notes-search-item-icon">{r.page.icon ?? '📄'}</span>
                <div className="notes-search-item-body">
                  <div className="notes-search-item-title">{r.page.title}</div>
                  <div className="notes-search-item-snippet">{highlightSnippet(r.snippet, query)}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
