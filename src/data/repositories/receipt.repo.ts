import type { Receipt, ReceiptStatus } from '../models';
import type { Database } from '../db/database';
import { persistWeb } from '../db/database';
import { newId, nowIso } from '@/lib/id';

type Row = Record<string, unknown>;

function mapReceipt(r: Row): Receipt {
  return {
    id: String(r.id),
    imagePath: String(r.image_path),
    merchant: (r.merchant as string) ?? null,
    rawJson: (r.raw_json as string) ?? null,
    status: r.status as ReceiptStatus,
    createdAt: String(r.created_at),
  };
}

export interface NewReceipt {
  imagePath: string;
  merchant?: string | null;
  rawJson?: string | null;
  status: ReceiptStatus;
}

export class SqliteReceiptRepository {
  constructor(private db: Database) {}

  async create(input: NewReceipt): Promise<Receipt> {
    const receipt: Receipt = {
      id: newId(),
      imagePath: input.imagePath,
      merchant: input.merchant ?? null,
      rawJson: input.rawJson ?? null,
      status: input.status,
      createdAt: nowIso(),
    };
    await this.db.run(
      `INSERT INTO receipts (id, image_path, merchant, raw_json, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [
        receipt.id,
        receipt.imagePath,
        receipt.merchant,
        receipt.rawJson,
        receipt.status,
        receipt.createdAt,
      ]
    );
    await persistWeb();
    return receipt;
  }

  async getById(id: string): Promise<Receipt | null> {
    const res = await this.db.query(`SELECT * FROM receipts WHERE id = ?;`, [id]);
    return res.values.length ? mapReceipt(res.values[0]) : null;
  }
}
