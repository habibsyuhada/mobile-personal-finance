import type { NewTransaction, RecurringFrequency } from '@/modules/finance/data/models';
import type { SqliteRecurringRepository, NewRecurringRule } from '@/modules/finance/data/repositories/recurring.repo';
import type { ITransactionRepository } from '@/modules/finance/data/repositories/interfaces';

/** Hitung tanggal jalan berikutnya berdasarkan frekuensi. Diekspor untuk diuji. */
export function advance(date: Date, frequency: RecurringFrequency): Date {
  const d = new Date(date);
  if (frequency === 'daily') d.setDate(d.getDate() + 1);
  else if (frequency === 'weekly') d.setDate(d.getDate() + 7);
  else if (frequency === 'monthly') d.setMonth(d.getMonth() + 1);
  return d;
}

export class RecurringService {
  constructor(
    private rules: SqliteRecurringRepository,
    private transactions: ITransactionRepository
  ) {}

  list() {
    return this.rules.list();
  }

  create(input: NewRecurringRule) {
    return this.rules.create(input);
  }

  remove(id: string) {
    return this.rules.remove(id);
  }

  /**
   * Hitung jumlah aturan yang nextRun >= 7 hari di belakang now.
   * Dipakai banner di dashboard sebagai early-warning (bukan auto-process).
   */
  async countMissed(now: Date = new Date()): Promise<number> {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - 7);
    const all = await this.rules.list();
    return all.filter((r) => r.active && new Date(r.nextRunAt).getTime() < cutoff.getTime()).length;
  }

  /**
   * Proses semua aturan yang jatuh tempo, buat transaksi, dan majukan jadwal.
   * Dipanggil saat aplikasi dibuka (R1.7). Mengembalikan jumlah transaksi dibuat.
   */
  async processDue(now: Date = new Date()): Promise<number> {
    const nowIso = now.toISOString();
    const due = await this.rules.listDue(nowIso);
    let created = 0;

    for (const rule of due) {
      let next = new Date(rule.nextRunAt);
      // Kejar bila beberapa periode terlewat (mis. app lama tidak dibuka).
      let guard = 0;
      while (next.getTime() <= now.getTime() && guard < 1000) {
        const template = JSON.parse(rule.templateJson) as NewTransaction;
        await this.transactions.create({
          ...template,
          occurredAt: next.toISOString(),
        });
        created += 1;
        next = advance(next, rule.frequency);
        guard += 1;
      }
      await this.rules.updateNextRun(rule.id, next.toISOString());
    }
    return created;
  }
}
