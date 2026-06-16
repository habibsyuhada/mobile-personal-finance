// Domain types untuk modul Notes (Notion-style).
// Lihat docs/specs/notes/design.md §4.

export type PageType = 'page' | 'database';

export interface Page {
  id: string;
  parentId: string | null;
  title: string;
  icon: string | null; // emoji unicode atau ionicon name
  coverPath: string | null;
  type: PageType;
  isFavorite: boolean;
  isDeleted: boolean;
  deletedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  openedAt: string | null;
}

export type BlockType =
  | 'paragraph'
  | 'heading_1'
  | 'heading_2'
  | 'heading_3'
  | 'bullet_list'
  | 'ordered_list'
  | 'todo_list'
  | 'quote'
  | 'code'
  | 'divider'
  | 'callout'
  | 'image';

export interface Block {
  id: string;
  pageId: string;
  type: BlockType;
  /** Inline content untuk text-like blocks (array of inline nodes). */
  content: InlineNode[];
  /** Untuk code block: bahasa. Untuk callout: emoji. Untuk image: caption. */
  meta: Record<string, string> | null;
  /** Untuk image: path di app sandbox atau object URL. */
  src: string | null;
  checked: boolean; // untuk todo_list
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type InlineMark = 'bold' | 'italic' | 'strike' | 'code' | 'link';

export interface InlineNode {
  text: string;
  marks: InlineMark[];
  /** Untuk mark 'link' */
  href?: string;
}

/** Plain text hasil ekstrak dari Block[] — dipakai untuk FTS/LIKE search. */
export type BlockText = string;

export type PropertyType =
  | 'text'
  | 'number'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'checkbox'
  | 'url'
  | 'email'
  | 'phone';

export interface SelectOption {
  id: string;
  name: string;
  color: string;
}

export interface PropertyDef {
  id: string;
  name: string;
  type: PropertyType;
  options?: SelectOption[]; // untuk select / multi_select
}

export interface Database {
  id: string; // = page id
  properties: PropertyDef[];
  createdAt: string;
  updatedAt: string;
}

export type PropertyValue =
  | string
  | number
  | boolean
  | string[]
  | null;

export interface DbRow {
  id: string;
  databaseId: string;
  pageId: string; // row dibuka sebagai page
  properties: Record<string, PropertyValue>;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type ViewType = 'table' | 'board' | 'list';

export interface ViewConfig {
  filters?: { propId: string; op: string; value: PropertyValue }[];
  sorts?: { propId: string; dir: 'asc' | 'desc' }[];
  groupBy?: string; // propertyId (board view)
}

export interface DbView {
  id: string;
  databaseId: string;
  name: string;
  viewType: ViewType;
  config: ViewConfig;
  sortOrder: number;
  createdAt: string;
}

export interface Attachment {
  id: string;
  pageId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  filePath: string;
  createdAt: string;
}

// ---- Input types (untuk create) ----

export type NewPage = {
  parentId?: string | null;
  title?: string;
  icon?: string | null;
  type?: PageType;
  sortOrder?: number;
};

export type PagePatch = {
  parentId?: string | null;
  title?: string;
  icon?: string | null;
  coverPath?: string | null;
  type?: PageType;
  isFavorite?: boolean;
  sortOrder?: number;
};

export type NewRow = {
  databaseId: string;
  pageId: string;
  properties?: Record<string, PropertyValue>;
  sortOrder?: number;
};

export type RowPatch = {
  properties?: Record<string, PropertyValue>;
  sortOrder?: number;
};

// ---- Search ----

export interface SearchResult {
  page: Page;
  /** Snippet yang mengandung match (plain text). */
  snippet: string;
  /** Posisi char awal match di snippet. */
  matchIndex: number;
}
