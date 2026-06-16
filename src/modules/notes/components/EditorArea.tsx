import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { newId, nowIso } from '@/lib/id';
import type { Block, BlockType, InlineNode } from '../data/models';
import { useNotesStore } from '../store/notes.store';
import { useT } from '@/i18n/useT';
import BlockMenu from './BlockMenu';
import { attachmentSvc } from '../store/notes.store';

interface Props {
  pageId: string;
  blocks: Block[];
  readOnly?: boolean;
}

const AUTOSAVE_DELAY = 500;

function makeBlock(type: BlockType, text = ''): Block {
  return {
    id: newId(),
    pageId: '',
    type,
    content: text ? [{ text, marks: [] }] : [],
    meta: type === 'callout' ? { emoji: '💡' } : null,
    src: null,
    checked: false,
    sortOrder: 0,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export default function EditorArea({ pageId, blocks, readOnly }: Props) {
  const saveBlocks = useNotesStore((s) => s.saveBlocks);
  const tr = useT();
  const [local, setLocal] = useState<Block[]>(blocks);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [menuBlockId, setMenuBlockId] = useState<string | null>(null);
  const [menuQuery, setMenuQuery] = useState('');
  const saveTimer = useRef<number | null>(null);
  const skipNextEffect = useRef(true);
  const lastSavedRef = useRef<string>('');

  // Reset state saat page berganti.
  useEffect(() => {
    skipNextEffect.current = true;
    setLocal(blocks);
    lastSavedRef.current = JSON.stringify(blocks);
  }, [pageId, blocks]);

  // Auto-save (debounced) saat local berubah.
  useEffect(() => {
    if (skipNextEffect.current) {
      skipNextEffect.current = false;
      return;
    }
    const serialized = JSON.stringify(local);
    if (serialized === lastSavedRef.current) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      lastSavedRef.current = serialized;
      void saveBlocks(pageId, local);
    }, AUTOSAVE_DELAY);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [local, pageId, saveBlocks]);

  // Update satu block by id.
  const updateBlock = useCallback((id: string, patch: Partial<Block>) => {
    setLocal((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch, updatedAt: nowIso() } : b)));
  }, []);

  // Ganti tipe block.
  const convertBlock = useCallback((id: string, type: BlockType) => {
    setLocal((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              type,
              meta: type === 'callout' ? { emoji: '💡' } : type === 'code' ? { lang: '' } : b.meta,
              updatedAt: nowIso(),
            }
          : b
      )
    );
  }, []);

  // Insert / remove block.
  const removeBlock = useCallback((id: string) => {
    setLocal((prev) => {
      if (prev.length <= 1) return prev;
      return reindex(prev.filter((b) => b.id !== id));
    });
  }, []);

  const handleSlashTrigger = useCallback(
    (blockId: string, rect: DOMRect, query: string) => {
      setMenuOpen(true);
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
      setMenuBlockId(blockId);
      setMenuQuery(query);
    },
    []
  );

  const handleMenuPick = useCallback(
    (type: BlockType) => {
      if (!menuBlockId) return;
      // Jika user pilih dari menu dengan query → update teks hapus "/..." dari block.
      if (menuQuery) {
        setLocal((prev) =>
          prev.map((b) => {
            if (b.id !== menuBlockId) return b;
            const filtered = b.content.filter((n) => !n.text.includes(`/${menuQuery}`));
            return { ...b, content: filtered, updatedAt: nowIso() };
          })
        );
      }
      convertBlock(menuBlockId, type);
      setMenuOpen(false);
      setMenuBlockId(null);
      setMenuQuery('');
    },
    [convertBlock, menuBlockId, menuQuery]
  );

  const handleAddBlock = useCallback((afterId?: string) => {
    const block = makeBlock('paragraph');
    if (afterId) {
      setLocal((prev) => {
        const idx = prev.findIndex((b) => b.id === afterId);
        if (idx < 0) return reindex([...prev, block]);
        const next = [...prev];
        next.splice(idx + 1, 0, { ...block, sortOrder: idx + 1 });
        return reindex(next);
      });
    } else {
      setLocal((prev) => reindex([...prev, block]));
    }
    // Focus newly created block.
    setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-block-id="${block.id}"] [contenteditable]`);
      el?.focus();
    }, 0);
  }, []);

  const handleImageUpload = useCallback(
    async (blockId: string, file: File | Blob) => {
      const att = await attachmentSvc().uploadImage(file, pageId);
      updateBlock(blockId, { src: att.filePath, meta: { ...(blocks.find((b) => b.id === blockId)?.meta ?? {}), attachmentId: att.id } });
    },
    [pageId, blocks, updateBlock]
  );

  // Render.
  if (!local.length) {
    return (
      <div className="notes-editor">
        <div className="notes-editor-empty">
          <button type="button" className="notes-editor-add" onClick={() => handleAddBlock()}>
            + {tr('notes.editor.addBlock')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notes-editor">
      {local.map((b) => (
        <BlockView
          key={b.id}
          block={b}
          readOnly={readOnly}
          onUpdate={(patch) => updateBlock(b.id, patch)}
          onEnter={() => handleAddBlock(b.id)}
          onBackspaceEmpty={() => removeBlock(b.id)}
          onSlashTrigger={(rect, q) => handleSlashTrigger(b.id, rect, q)}
          onImageUpload={(file) => handleImageUpload(b.id, file)}
        />
      ))}
      <div className="notes-editor-foot">
        <button type="button" className="notes-editor-add" onClick={() => handleAddBlock()}>
          + {tr('notes.editor.addBlock')}
        </button>
      </div>
      <BlockMenu
        open={menuOpen}
        top={menuPos.top}
        left={menuPos.left}
        onPick={handleMenuPick}
        onClose={() => {
          setMenuOpen(false);
          setMenuBlockId(null);
          setMenuQuery('');
        }}
      />
    </div>
  );
}

function reindex(blocks: Block[]): Block[] {
  return blocks.map((b, i) => ({ ...b, sortOrder: i }));
}

// ---- BlockView ----

interface BlockViewProps {
  block: Block;
  readOnly?: boolean;
  onUpdate: (patch: Partial<Block>) => void;
  onEnter: () => void;
  onBackspaceEmpty: () => void;
  onSlashTrigger: (rect: DOMRect, query: string) => void;
  onImageUpload: (file: File | Blob) => Promise<void>;
}

function BlockView({ block, readOnly, onUpdate, onEnter, onBackspaceEmpty, onSlashTrigger, onImageUpload }: BlockViewProps) {
  const ref = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inisialisasi contentEditable dengan plain text (rendering inline marks sederhana).
  useEffect(() => {
    if (!ref.current) return;
    const txt = inlineToPlain(block.content);
    if (ref.current.innerText !== txt) {
      ref.current.innerText = txt;
    }
  }, [block.id]); // Hanya saat block id berubah, untuk reset contentEditable.

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const text = el.innerText;
    // Detect slash command: text starts with "/".
    if (text.startsWith('/') && !text.includes('\n') && text.length <= 16) {
      const query = text.slice(1);
      const rect = el.getBoundingClientRect();
      onSlashTrigger(rect, query);
    }
    const content = plainToInline(text);
    onUpdate({ content });
  };

  const handleKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type !== 'code') {
      e.preventDefault();
      onEnter();
    } else if (e.key === 'Backspace' && (e.currentTarget.innerText === '' || (e.currentTarget.innerText === '/' && block.type === 'paragraph'))) {
      e.preventDefault();
      onBackspaceEmpty();
    } else if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
  };

  // Render sesuai type.
  const renderEditor = () => {
    const commonProps = {
      ref,
      className: `notes-block-content notes-block-${block.type}`,
      contentEditable: !readOnly,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onKeyDown: handleKey,
      'data-placeholder': 'notes.editor.slashPlaceholder',
    } as const;

    if (block.type === 'divider') {
      return <hr className="notes-block-divider" />;
    }
    if (block.type === 'image') {
      if (block.src) {
        return (
          <div className="notes-block-image-wrap">
            <img src={block.src} alt={block.meta?.alt ?? ''} className="notes-block-image" />
          </div>
        );
      }
      return (
        <div className="notes-block-image-empty">
          <button type="button" onClick={() => fileInputRef.current?.click()}>
            + Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImageUpload(f);
            }}
          />
        </div>
      );
    }
    return <div {...commonProps} />;
  };

  return (
    <div className="notes-block" data-block-id={block.id}>
      {block.type === 'todo_list' && (
        <input
          type="checkbox"
          className="notes-block-todo-check"
          checked={block.checked}
          onChange={(e) => onUpdate({ checked: e.target.checked })}
          aria-label="Todo"
        />
      )}
      {renderEditor()}
      {block.type === 'callout' && (
        <button
          type="button"
          className="notes-block-callout-emoji"
          aria-label="Change emoji"
          onClick={() => {
            const next = window.prompt('Emoji', block.meta?.emoji ?? '💡') ?? '';
            if (next) onUpdate({ meta: { ...(block.meta ?? {}), emoji: next } });
          }}
        >
          {block.meta?.emoji ?? '💡'}
        </button>
      )}
    </div>
  );
}

// ---- Inline helpers ----

function inlineToPlain(nodes: InlineNode[]): string {
  return nodes.map((n) => n.text).join('');
}

function plainToInline(text: string): InlineNode[] {
  if (!text) return [];
  return [{ text, marks: [] }];
}

void useMemo;
