import type { Category, NewCategory } from '../models';
import type { Database } from '@/data/db/database';
import { persistWeb } from '@/data/db/database';
import { newId, nowIso } from '@/lib/id';
import type { ICategoryRepository } from './interfaces';

type Row = Record<string, unknown>;

function mapCategory(r: Row): Category {
  return {
    id: String(r.id),
    name: String(r.name),
    kind: r.kind as Category['kind'],
    parentId: (r.parent_id as string) ?? null,
    icon: (r.icon as string) ?? null,
    color: (r.color as string) ?? null,
    isDefault: Number(r.is_default) === 1,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export class SqliteCategoryRepository implements ICategoryRepository {
  constructor(private db: Database) {}

  async list(kind?: 'income' | 'expense'): Promise<Category[]> {
    const sql = kind
      ? `SELECT * FROM categories WHERE kind = ? ORDER BY name COLLATE NOCASE;`
      : `SELECT * FROM categories ORDER BY kind, name COLLATE NOCASE;`;
    const res = await this.db.query(sql, kind ? [kind] : []);
    return res.values.map(mapCategory);
  }

  async getById(id: string): Promise<Category | null> {
    const res = await this.db.query(`SELECT * FROM categories WHERE id = ?;`, [id]);
    return res.values.length ? mapCategory(res.values[0]) : null;
  }

  async create(input: NewCategory): Promise<Category> {
    const now = nowIso();
    const cat: Category = {
      id: newId(),
      name: input.name,
      kind: input.kind,
      parentId: input.parentId ?? null,
      icon: input.icon ?? null,
      color: input.color ?? null,
      isDefault: input.isDefault ?? false,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.run(
      `INSERT INTO categories
        (id, name, kind, parent_id, icon, color, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        cat.id,
        cat.name,
        cat.kind,
        cat.parentId,
        cat.icon,
        cat.color,
        cat.isDefault ? 1 : 0,
        cat.createdAt,
        cat.updatedAt,
      ]
    );
    await persistWeb();
    return cat;
  }

  async update(id: string, patch: Partial<NewCategory>): Promise<Category> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Kategori tidak ditemukan');
    const merged: Category = { ...existing, ...patch, updatedAt: nowIso() };
    await this.db.run(
      `UPDATE categories SET name = ?, kind = ?, parent_id = ?, icon = ?,
         color = ?, updated_at = ? WHERE id = ?;`,
      [
        merged.name,
        merged.kind,
        merged.parentId ?? null,
        merged.icon ?? null,
        merged.color ?? null,
        merged.updatedAt,
        id,
      ]
    );
    await persistWeb();
    return merged;
  }

  async remove(id: string): Promise<void> {
    await this.db.run(`DELETE FROM categories WHERE id = ?;`, [id]);
    await persistWeb();
  }

  async count(): Promise<number> {
    const res = await this.db.query(`SELECT COUNT(*) AS c FROM categories;`);
    return Number(res.values[0]?.c ?? 0);
  }
}
