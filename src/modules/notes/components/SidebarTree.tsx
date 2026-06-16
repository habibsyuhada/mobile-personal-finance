import { useMemo } from 'react';
import {
  IonIcon,
  IonLabel,
  IonList,
  IonNote,
} from '@ionic/react';
import {
  star,
  chevronForward,
  chevronDown,
  add,
  documentTextOutline,
  gridOutline,
  ellipsisVertical,
  folderOutline,
  timeOutline,
} from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useNotesStore } from '../store/notes.store';
import { useT, type TranslationKey } from '@/i18n/useT';
import type { Page, PageType } from '../data/models';

interface Node {
  page: Page;
  children: Node[];
}

function buildTree(pages: Page[]): Node[] {
  const map = new Map<string, Node>();
  for (const p of pages) map.set(p.id, { page: p, children: [] });
  const roots: Node[] = [];
  for (const p of pages) {
    const node = map.get(p.id)!;
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  // Sort children by sortOrder, then by title.
  const sortNodes = (ns: Node[]) => {
    ns.sort((a, b) => {
      if (a.page.sortOrder !== b.page.sortOrder) return a.page.sortOrder - b.page.sortOrder;
      return a.page.title.localeCompare(b.page.title);
    });
    for (const n of ns) sortNodes(n.children);
  };
  sortNodes(roots);
  return roots;
}

interface SidebarTreeProps {
  onPickEmoji?: (page: Page) => void;
  onRequestPageMenu?: (page: Page, anchor: HTMLElement) => void;
}

export default function SidebarTree({ onRequestPageMenu }: SidebarTreeProps) {
  const pages = useNotesStore((s) => s.pages);
  const favorites = useNotesStore((s) => s.favorites);
  const recent = useNotesStore((s) => s.recent);
  const expandedIds = useNotesStore((s) => s.expandedIds);
  const currentPage = useNotesStore((s) => s.currentPage);
  const toggleExpanded = useNotesStore((s) => s.toggleExpanded);
  const openPage = useNotesStore((s) => s.openPage);
  const createPage = useNotesStore((s) => s.createPage);
  const tr = useT();
  const history = useHistory();

  const tree = useMemo(() => buildTree(pages), [pages]);
  const tr_ = tr;

  const handleCreate = async (parentId: string | null, type: PageType) => {
    const p = await createPage(parentId, type);
    if (type === 'database') {
      history.push(`/m/notes/page/${p.id}`);
    }
  };

  return (
    <div className="notes-sidebar">
      <Section
        title={tr_('notes.sidebar.favorites')}
        items={favorites.map((p) => ({ page: p }))}
        currentId={currentPage?.id}
        onOpen={(p) => openPage(p.id)}
        onRequestPageMenu={onRequestPageMenu}
        renderIcon={() => <IonIcon icon={star} className="notes-tree-star" />}
      />
      <Section
        title={tr_('notes.sidebar.recent')}
        items={recent.map((p) => ({ page: p }))}
        currentId={currentPage?.id}
        onOpen={(p) => openPage(p.id)}
        onRequestPageMenu={onRequestPageMenu}
        renderIcon={() => <IonIcon icon={timeOutline} />}
      />
      <div className="notes-sidebar-section">
        <div className="notes-sidebar-header">
          <span className="notes-sidebar-title">{tr_('notes.sidebar.private')}</span>
          <button
            type="button"
            className="notes-sidebar-action"
            onClick={() => handleCreate(null, 'page')}
            aria-label={tr_('notes.page.new')}
            title={tr_('notes.page.new')}
          >
            <IonIcon icon={add} />
          </button>
        </div>
        <TreeList
          nodes={tree}
          depth={0}
          currentId={currentPage?.id}
          expandedIds={expandedIds}
          onToggleExpand={toggleExpanded}
          onOpen={(p) => openPage(p.id)}
          onRequestPageMenu={onRequestPageMenu}
          tr={tr_}
        />
      </div>
    </div>
  );
}

interface SectionItem {
  page: Page;
}

interface SectionProps {
  title: string;
  items: SectionItem[];
  currentId?: string;
  onOpen: (p: Page) => void;
  onRequestPageMenu?: (p: Page, anchor: HTMLElement) => void;
  renderIcon: () => JSX.Element;
}

function Section({ title, items, currentId, onOpen, onRequestPageMenu, renderIcon }: SectionProps) {
  if (!items.length) return null;
  return (
    <div className="notes-sidebar-section">
      <div className="notes-sidebar-header">
        <span className="notes-sidebar-title">{title}</span>
      </div>
      <IonList lines="none" className="notes-tree">
        {items.map(({ page }) => (
          <PageRow
            key={page.id}
            page={page}
            depth={0}
            current={page.id === currentId}
            expanded={false}
            hasChildren={false}
            onOpen={() => onOpen(page)}
            onToggleExpand={() => undefined}
            onRequestPageMenu={onRequestPageMenu}
            renderPrefix={renderIcon}
          />
        ))}
      </IonList>
    </div>
  );
}

interface TreeListProps {
  nodes: Node[];
  depth: number;
  currentId?: string;
  expandedIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  onOpen: (p: Page) => void;
  onRequestPageMenu?: (p: Page, anchor: HTMLElement) => void;
  tr: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

function TreeList(props: TreeListProps) {
  return (
    <IonList lines="none" className="notes-tree">
      {props.nodes.map((n) => (
        <TreeNode key={n.page.id} node={n} {...props} />
      ))}
    </IonList>
  );
}

interface TreeNodeProps extends TreeListProps {
  node: Node;
}

function TreeNode({ node, depth, currentId, expandedIds, onToggleExpand, onOpen, onRequestPageMenu, tr }: TreeNodeProps) {
  const expanded = !!expandedIds[node.page.id];
  return (
    <>
      <PageRow
        page={node.page}
        depth={depth}
        current={node.page.id === currentId}
        expanded={expanded}
        hasChildren={node.children.length > 0}
        onOpen={() => onOpen(node.page)}
        onToggleExpand={() => onToggleExpand(node.page.id)}
        onRequestPageMenu={onRequestPageMenu}
        renderPrefix={() => (
          <IonIcon icon={node.page.icon ? undefined : node.page.type === 'database' ? gridOutline : documentTextOutline} />
        )}
        emoji={node.page.icon}
      />
      {expanded && node.children.length > 0 && (
        <TreeList
          nodes={node.children}
          depth={depth + 1}
          currentId={currentId}
          expandedIds={expandedIds}
          onToggleExpand={onToggleExpand}
          onOpen={onOpen}
          onRequestPageMenu={onRequestPageMenu}
          tr={tr}
        />
      )}
    </>
  );
}

interface PageRowProps {
  page: Page;
  depth: number;
  current: boolean;
  expanded: boolean;
  hasChildren: boolean;
  onOpen: () => void;
  onToggleExpand: () => void;
  onRequestPageMenu?: (p: Page, anchor: HTMLElement) => void;
  renderPrefix?: () => JSX.Element;
  emoji?: string | null;
}

function PageRow({
  page,
  depth,
  current,
  expanded,
  hasChildren,
  onOpen,
  onToggleExpand,
  onRequestPageMenu,
  renderPrefix,
  emoji,
}: PageRowProps) {
  return (
    <div
      className={'notes-tree-row' + (current ? ' is-current' : '')}
      style={{ paddingLeft: 8 + depth * 16 }}
    >
      <button
        type="button"
        className="notes-tree-toggle"
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggleExpand();
        }}
        aria-label={hasChildren ? (expanded ? 'Collapse' : 'Expand') : ''}
        tabIndex={hasChildren ? 0 : -1}
      >
        {hasChildren ? (
          <IonIcon icon={expanded ? chevronDown : chevronForward} />
        ) : (
          <span className="notes-tree-toggle-spacer" />
        )}
      </button>
      <button
        type="button"
        className="notes-tree-item"
        onClick={onOpen}
        aria-current={current ? 'page' : undefined}
      >
        <span className="notes-tree-icon" aria-hidden="true">
          {emoji ? <span className="notes-tree-emoji">{emoji}</span> : renderPrefix?.()}
        </span>
        <IonLabel className="notes-tree-label">{page.title || 'Tanpa judul'}</IonLabel>
        {page.isFavorite && (
          <IonNote slot="end" className="notes-tree-fav">
            <IonIcon icon={star} />
          </IonNote>
        )}
      </button>
      <button
        type="button"
        className="notes-tree-action"
        onClick={(e) => {
          e.stopPropagation();
          onRequestPageMenu?.(page, e.currentTarget);
        }}
        aria-label="Page menu"
        title="Menu"
      >
        <IonIcon icon={ellipsisVertical} />
      </button>
    </div>
  );
}

void folderOutline; // exported for future use
