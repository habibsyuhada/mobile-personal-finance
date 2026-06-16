import { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
  textOutline,
  cubeOutline,
  listOutline,
  checkboxOutline,
  reorderFourOutline,
  codeSlashOutline,
  chatboxOutline,
  removeOutline,
  imageOutline,
} from 'ionicons/icons';
import type { BlockType } from '../data/models';
import { useT } from '@/i18n/useT';

export interface BlockCommand {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: BlockType;
}

const COMMANDS: BlockCommand[] = [
  { id: 'text', label: 'Text', description: 'Paragraf biasa', icon: textOutline, type: 'paragraph' },
  { id: 'h1', label: 'Heading 1', description: 'Judul besar', icon: cubeOutline, type: 'heading_1' },
  { id: 'h2', label: 'Heading 2', description: 'Sub-judul', icon: cubeOutline, type: 'heading_2' },
  { id: 'h3', label: 'Heading 3', description: 'Sub-sub-judul', icon: cubeOutline, type: 'heading_3' },
  { id: 'bullet', label: 'Bullet list', description: 'Daftar bullet', icon: listOutline, type: 'bullet_list' },
  { id: 'ordered', label: 'Numbered list', description: 'Daftar bernomor', icon: reorderFourOutline, type: 'ordered_list' },
  { id: 'todo', label: 'Todo', description: 'Daftar centang', icon: checkboxOutline, type: 'todo_list' },
  { id: 'quote', label: 'Quote', description: 'Kutipan', icon: chatboxOutline, type: 'quote' },
  { id: 'code', label: 'Code', description: 'Blok kode', icon: codeSlashOutline, type: 'code' },
  { id: 'divider', label: 'Divider', description: 'Garis pemisah', icon: removeOutline, type: 'divider' },
  { id: 'callout', label: 'Callout', description: 'Sorotan info', icon: chatboxOutline, type: 'callout' },
  { id: 'image', label: 'Image', description: 'Sisipkan gambar', icon: imageOutline, type: 'image' },
];

interface Props {
  open: boolean;
  top: number;
  left: number;
  onPick: (type: BlockType) => void;
  onClose: () => void;
}

export default function BlockMenu({ open, top, left, onPick, onClose }: Props) {
  const [active, setActive] = useState(0);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const tr = useT();

  useEffect(() => {
    if (open) {
      setActive(0);
      setFilter('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = COMMANDS.filter(
    (c) =>
      c.label.toLowerCase().includes(filter.toLowerCase()) ||
      c.description.toLowerCase().includes(filter.toLowerCase())
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filtered[active];
      if (cmd) onPick(cmd.type);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      ref={ref}
      className="notes-block-menu"
      style={{ top, left }}
      role="menu"
      onKeyDown={onKey}
    >
      <input
        ref={inputRef}
        className="notes-block-menu-input"
        placeholder="Filter blocks..."
        value={filter}
        onChange={(e) => {
          setFilter(e.target.value);
          setActive(0);
        }}
        aria-label="Filter blocks"
      />
      <div className="notes-block-menu-list">
        {filtered.length === 0 && (
          <div className="notes-block-menu-empty">{tr('notes.search.empty')}</div>
        )}
        {filtered.map((cmd, i) => (
          <button
            key={cmd.id}
            type="button"
            className={'notes-block-menu-item' + (i === active ? ' is-active' : '')}
            onClick={() => onPick(cmd.type)}
            onMouseEnter={() => setActive(i)}
            role="menuitem"
          >
            <IonIcon icon={cmd.icon} className="notes-block-menu-icon" />
            <div>
              <div className="notes-block-menu-label">{cmd.label}</div>
              <div className="notes-block-menu-desc">{cmd.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
