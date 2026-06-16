import { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { star, starOutline, ellipsisHorizontal, downloadOutline, trashOutline, copyOutline } from 'ionicons/icons';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import type { Page } from '../data/models';
import { notesSvc } from '../store/notes.store';

interface Props {
  page: Page;
  onOpenMenu?: (anchor: HTMLElement) => void;
}

const EMOJIS = ['📝', '📚', '💡', '🎯', '🗒️', '📓', '🗂️', '✅', '🧠', '💼', '🌱', '🧭', '⭐', '🔥', '🍀', '🪴'];

export default function PageHeader({ page, onOpenMenu }: Props) {
  const tr = useT();
  const toggleFavorite = useNotesStore((s) => s.toggleFavorite);
  const saveStatus = useNotesStore((s) => s.saveStatus);
  const deletePage = useNotesStore((s) => s.deletePage);
  const renamePage = useNotesStore((s) => s.renamePage);
  const setIcon = useNotesStore((s) => s.setIcon);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(page.title);
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleDraft(page.title);
  }, [page.id, page.title]);

  useEffect(() => {
    if (editingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editingTitle]);

  useEffect(() => {
    if (!showEmoji) return;
    const onClick = (e: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(e.target as Node)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showEmoji]);

  const commitTitle = async () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== page.title) {
      await renamePage(page.id, titleDraft);
    } else {
      setTitleDraft(page.title);
    }
  };

  const handleExport = async () => {
    try {
      const md = await notesSvc().exportPageMarkdown(page.id);
      const blob = new Blob([md], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slug(page.title)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/m/notes/page/${page.id}`;
    if (navigator.clipboard) void navigator.clipboard.writeText(link);
  };

  return (
    <div className="notes-page-header">
      <div className="notes-page-icon-row">
        <button
          type="button"
          className="notes-page-icon-btn"
          onClick={() => setShowEmoji((v) => !v)}
          aria-label={tr('notes.page.addIcon')}
        >
          {page.icon ? <span className="notes-page-emoji">{page.icon}</span> : <span className="notes-page-emoji-placeholder">📄</span>}
        </button>
        {showEmoji && (
          <div ref={emojiWrapRef} className="notes-page-emoji-popover" role="menu">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={async () => {
                  await setIcon(page.id, e);
                  setShowEmoji(false);
                }}
              >
                {e}
              </button>
            ))}
            <button
              type="button"
              className="notes-page-emoji-clear"
              onClick={async () => {
                await setIcon(page.id, null);
                setShowEmoji(false);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <div className="notes-page-title-row">
        {editingTitle ? (
          <input
            ref={inputRef}
            className="notes-page-title-input"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              } else if (e.key === 'Escape') {
                setTitleDraft(page.title);
                setEditingTitle(false);
              }
            }}
            placeholder={tr('notes.page.untitled')}
            aria-label={tr('notes.page.untitled')}
          />
        ) : (
          <button
            type="button"
            className="notes-page-title"
            onClick={() => setEditingTitle(true)}
            aria-label={tr('notes.page.untitled')}
          >
            {page.title || tr('notes.page.untitled')}
          </button>
        )}
        <div className="notes-page-actions">
          <button
            type="button"
            className="notes-page-action-btn"
            onClick={() => toggleFavorite(page.id)}
            aria-label={page.isFavorite ? tr('notes.page.unfavorite') : tr('notes.page.favorite')}
            title={page.isFavorite ? tr('notes.page.unfavorite') : tr('notes.page.favorite')}
          >
            <IonIcon icon={page.isFavorite ? star : starOutline} />
          </button>
          <button
            type="button"
            className="notes-page-action-btn"
            onClick={handleExport}
            aria-label={tr('notes.menu.export')}
            title={tr('notes.menu.export')}
          >
            <IonIcon icon={downloadOutline} />
          </button>
          <button
            type="button"
            className="notes-page-action-btn"
            onClick={handleCopyLink}
            aria-label={tr('notes.menu.copyLink')}
            title={tr('notes.menu.copyLink')}
          >
            <IonIcon icon={copyOutline} />
          </button>
          <button
            type="button"
            className="notes-page-action-btn danger"
            onClick={() => deletePage(page.id)}
            aria-label={tr('notes.menu.moveToTrash')}
            title={tr('notes.menu.moveToTrash')}
          >
            <IonIcon icon={trashOutline} />
          </button>
          {onOpenMenu && (
            <button
              type="button"
              className="notes-page-action-btn"
              onClick={(e) => onOpenMenu(e.currentTarget)}
              aria-label={tr('notes.page.openMenu')}
              title={tr('notes.page.openMenu')}
            >
              <IonIcon icon={ellipsisHorizontal} />
            </button>
          )}
        </div>
      </div>
      <div className="notes-page-meta">
        <SaveBadge status={saveStatus} />
      </div>
    </div>
  );
}

function SaveBadge({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  const tr = useT();
  if (status === 'saving') return <span className="notes-save-badge saving">● {tr('notes.editor.saving')}</span>;
  if (status === 'saved') return <span className="notes-save-badge saved">● {tr('notes.editor.saved')}</span>;
  if (status === 'error') return <span className="notes-save-badge error">● {tr('notes.editor.error')}</span>;
  return null;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'untitled';
}
