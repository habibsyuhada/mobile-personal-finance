// Konversi Block[] (format internal) <-> Markdown.
// Lihat docs/specs/notes/design.md §8.3.

import type { Block, BlockType, InlineNode } from '../data/models';

/** Render Block[] ke string Markdown (best-effort). */
export function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = [];
  for (const b of blocks) {
    lines.push(blockToMarkdown(b));
  }
  return lines.join('\n\n').trim() + '\n';
}

export function blockToMarkdown(block: Block): string {
  const text = inlineToMarkdown(block.content);
  switch (block.type) {
    case 'heading_1':
      return `# ${text}`;
    case 'heading_2':
      return `## ${text}`;
    case 'heading_3':
      return `### ${text}`;
    case 'quote':
      return text
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n');
    case 'code':
      return '```' + (block.meta?.lang ?? '') + '\n' + text + '\n```';
    case 'divider':
      return '---';
    case 'callout':
      return `> ${block.meta?.emoji ?? '💡'} ${text}`;
    case 'image':
      return `![${block.meta?.alt ?? ''}](${block.src ?? ''})`;
    case 'todo_list':
      return `- [${block.checked ? 'x' : ' '}] ${text}`;
    case 'bullet_list':
      return `- ${text}`;
    case 'ordered_list':
      return `1. ${text}`;
    case 'paragraph':
    default:
      return text;
  }
}

function inlineToMarkdown(nodes: InlineNode[]): string {
  return nodes
    .map((n) => {
      let t = escapeMd(n.text);
      if (n.marks.includes('code')) t = '`' + t + '`';
      if (n.marks.includes('bold')) t = `**${t}**`;
      if (n.marks.includes('italic')) t = `*${t}*`;
      if (n.marks.includes('strike')) t = `~~${t}~~`;
      if (n.marks.includes('link') && n.href) t = `[${t}](${n.href})`;
      return t;
    })
    .join('');
}

function escapeMd(s: string): string {
  return s.replace(/([\\`*_{}[\]()#+\-.!])/g, '\\$1');
}

// ---- Markdown -> Block[] (parser sederhana) ----

interface ParseOptions {
  pageId: string;
  /** Factory id generator — default newId-like. */
  newId: () => string;
  nowIso: () => string;
}

const HEADING_RE = /^(#{1,3})\s+(.+)$/;
const QUOTE_RE = /^>\s?(.*)$/;
const CODE_FENCE_RE = /^```([\w-]*)\s*$/;
const DIVIDER_RE = /^---+$/;
const UL_RE = /^[-*]\s+(.*)$/;
const OL_RE = /^\d+\.\s+(.*)$/;
const TODO_RE = /^[-*]\s+\[( |x|X)\]\s+(.*)$/;
const IMAGE_RE = /^!\[(.*?)\]\((.*?)\)$/;

/** Parse string Markdown ke Block[]. Best-effort, tidak mendukung nested list. */
export function markdownToBlocks(md: string, opts: ParseOptions): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;
  let order = 0;

  const push = (b: Omit<Block, 'sortOrder'>) => {
    blocks.push({ ...b, sortOrder: order++ } as Block);
  };

  const makeTextBlock = (text: string, type: BlockType = 'paragraph', extra: Partial<Block> = {}): Block => ({
    id: opts.newId(),
    pageId: opts.pageId,
    type,
    content: text.length ? [{ text, marks: [] }] : [],
    meta: null,
    src: null,
    checked: false,
    sortOrder: order,
    createdAt: opts.nowIso(),
    updatedAt: opts.nowIso(),
    ...extra,
  });

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.replace(/\s+$/, '');
    if (line.trim() === '') {
      i++;
      continue;
    }
    // Code fence (multi-line)
    const fence = CODE_FENCE_RE.exec(line);
    if (fence) {
      const lang = fence[1] || '';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !CODE_FENCE_RE.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      push(makeTextBlock(codeLines.join('\n'), 'code', { meta: { lang } }));
      continue;
    }
    const h = HEADING_RE.exec(line);
    if (h) {
      const level = h[1].length;
      push(
        makeTextBlock(h[2], (`heading_${level}` as BlockType))
      );
      i++;
      continue;
    }
    if (DIVIDER_RE.test(line)) {
      push(makeTextBlock('', 'divider'));
      i++;
      continue;
    }
    const img = IMAGE_RE.exec(line.trim());
    if (img) {
      push(
        makeTextBlock('', 'image', { src: img[2], meta: { alt: img[1] } })
      );
      i++;
      continue;
    }
    const todo = TODO_RE.exec(line);
    if (todo) {
      push(
        makeTextBlock(todo[2], 'todo_list', { checked: todo[1].toLowerCase() === 'x' })
      );
      i++;
      continue;
    }
    const ul = UL_RE.exec(line);
    if (ul) {
      push(makeTextBlock(ul[1], 'bullet_list'));
      i++;
      continue;
    }
    const ol = OL_RE.exec(line);
    if (ol) {
      push(makeTextBlock(ol[1], 'ordered_list'));
      i++;
      continue;
    }
    const q = QUOTE_RE.exec(line);
    if (q) {
      // Gabung baris quote berurutan.
      const ql: string[] = [q[1]];
      i++;
      while (i < lines.length && QUOTE_RE.test(lines[i])) {
        ql.push(QUOTE_RE.exec(lines[i])![1]);
        i++;
      }
      push(makeTextBlock(ql.join('\n'), 'quote'));
      continue;
    }
    // Default: paragraf (gabung baris berurutan non-kosong).
    const para: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !HEADING_RE.test(lines[i]) &&
      !QUOTE_RE.test(lines[i]) &&
      !UL_RE.test(lines[i]) &&
      !OL_RE.test(lines[i]) &&
      !TODO_RE.test(lines[i]) &&
      !CODE_FENCE_RE.test(lines[i]) &&
      !DIVIDER_RE.test(lines[i])
    ) {
      para.push(lines[i].replace(/\s+$/, ''));
      i++;
    }
    push(makeTextBlock(para.join('\n'), 'paragraph'));
  }
  return blocks;
}
