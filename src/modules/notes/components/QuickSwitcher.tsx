import { useEffect, useMemo, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import { fuzzyMatch } from '../lib/search';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function QuickSwitcher({ open, onClose }: Props) {
  const tr = useT();
  const [query, setQuery] = useState('');
  const pages = useNotesStore((s) => s.pages);
  const openPage = useNotesStore((s) => s.openPage);
  const history = useHistory();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  type Scored = { page: (typeof pages)[number]; score: number };
  const matches = useMemo<Scored[]>(() => {
    if (!query.trim()) {
      return pages.slice(0, 30).map((p) => ({ page: p, score: 0 }));
    }
    return pages
      .map((p) => ({ page: p, score: fuzzyMatch(query, p.title).score }))
      .filter((m) => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);
  }, [pages, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => setActiveIdx(0), [matches.length]);

  if (!open) return null;

  const pick = async (pageId: string) => {
    await openPage(pageId);
    history.push(`/m/notes/page/${pageId}`);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const m = matches[activeIdx];
      if (m) void pick(m.page.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="notes-search-overlay" role="dialog" aria-modal="true" onKeyDown={onKey}>
      <div className="notes-search-backdrop" onClick={onClose} />
      <div className="notes-switcher-modal">
        <input
          ref={inputRef}
          className="notes-search-input standalone"
          placeholder={tr('notes.search.placeholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="notes-search-results">
          {matches.length === 0 && <div className="notes-search-empty">{tr('notes.search.empty')}</div>}
          {matches.map((m, i) => (
            <button
              key={m.page.id}
              type="button"
              className={'notes-search-item' + (i === activeIdx ? ' is-active' : '')}
              onClick={() => pick(m.page.id)}
              onMouseEnter={() => setActiveIdx(i)}
            >
              <span className="notes-search-item-icon">{m.page.icon ?? '📄'}</span>
              <div className="notes-search-item-body">
                <div className="notes-search-item-title">{m.page.title}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
