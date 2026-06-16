import { describe, it, expect } from 'vitest';
import { blocksToMarkdown, markdownToBlocks } from './markdown';
import type { Block } from '../data/models';

function mkBlock(type: Block['type'], text: string, extra: Partial<Block> = {}): Block {
  return {
    id: 'b1',
    pageId: 'p1',
    type,
    content: text ? [{ text, marks: [] }] : [],
    meta: null,
    src: null,
    checked: false,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

describe('blocksToMarkdown', () => {
  it('renders heading levels and lists', () => {
    const blocks: Block[] = [
      mkBlock('heading_1', 'Halo'),
      mkBlock('paragraph', 'Dunia'),
      mkBlock('bullet_list', 'Satu'),
      mkBlock('ordered_list', 'Dua'),
      mkBlock('todo_list', 'Tiga', { checked: true }),
      mkBlock('quote', 'Kutipan'),
      mkBlock('divider', ''),
    ];
    const md = blocksToMarkdown(blocks);
    expect(md).toContain('# Halo');
    expect(md).toContain('Dunia');
    expect(md).toContain('- Satu');
    expect(md).toContain('1. Dua');
    expect(md).toContain('- [x] Tiga');
    expect(md).toContain('> Kutipan');
    expect(md).toContain('---');
  });

  it('renders callout with emoji', () => {
    const blocks: Block[] = [mkBlock('callout', 'Info', { meta: { emoji: '💡' } })];
    expect(blocksToMarkdown(blocks)).toContain('> 💡 Info');
  });

  it('renders image as markdown link', () => {
    const blocks: Block[] = [mkBlock('image', '', { src: 'a.png', meta: { alt: 'A' } })];
    expect(blocksToMarkdown(blocks)).toContain('![A](a.png)');
  });
});

describe('markdownToBlocks', () => {
  it('round-trips paragraphs and headings', () => {
    const md = '# Judul\n\nParagraf satu.\n\nParagraf dua.';
    const blocks = markdownToBlocks(md, { pageId: 'p1', newId: () => 'x', nowIso: () => 't' });
    const types = blocks.map((b) => b.type);
    expect(types).toEqual(['heading_1', 'paragraph', 'paragraph']);
    expect(blocks[0].content[0].text).toBe('Judul');
    expect(blocks[1].content[0].text).toBe('Paragraf satu.');
  });

  it('parses todo list with checked state', () => {
    const md = '- [x] Selesai\n- [ ] Belum';
    const blocks = markdownToBlocks(md, { pageId: 'p1', newId: () => 'x', nowIso: () => 't' });
    expect(blocks.length).toBe(2);
    expect(blocks[0].type).toBe('todo_list');
    expect(blocks[0].checked).toBe(true);
    expect(blocks[1].checked).toBe(false);
  });

  it('parses code fence with language', () => {
    const md = '```ts\nconst x = 1;\n```';
    const blocks = markdownToBlocks(md, { pageId: 'p1', newId: () => 'x', nowIso: () => 't' });
    expect(blocks[0].type).toBe('code');
    expect(blocks[0].meta?.lang).toBe('ts');
  });

  it('parses divider', () => {
    const blocks = markdownToBlocks('---', { pageId: 'p1', newId: () => 'x', nowIso: () => 't' });
    expect(blocks[0].type).toBe('divider');
  });
});
