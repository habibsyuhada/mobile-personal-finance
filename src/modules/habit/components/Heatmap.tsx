import { useMemo } from 'react';
import type { Habit, HabitLog } from '../data/models';
import { addDays, localDateStr } from '../lib/dates';

interface Props {
  habit: Habit;
  logs: HabitLog[];
  weeks?: number; // jumlah minggu ke belakang
}

// Heatmap kalender: kolom = minggu, baris = hari (Sen..Min).
export default function Heatmap({ habit, logs, weeks = 16 }: Props) {
  const cells = useMemo(() => {
    const amountByDate: Record<string, number> = {};
    for (const l of logs) amountByDate[l.logDate] = (amountByDate[l.logDate] ?? 0) + l.amount;

    const today = localDateStr();
    const totalDays = weeks * 7;
    const out: { date: string; intensity: number }[] = [];
    for (let i = totalDays - 1; i >= 0; i--) {
      const date = addDays(today, -i);
      const amount = amountByDate[date] ?? 0;
      let intensity = 0;
      if (amount > 0) {
        intensity =
          habit.type === 'quantifiable' && habit.target
            ? Math.min(1, amount / habit.target)
            : 1;
      }
      out.push({ date, intensity });
    }
    return out;
  }, [habit, logs, weeks]);

  const base = habit.color ?? '#16a34a';

  return (
    <div style={{ display: 'flex', gap: 3, overflowX: 'auto', padding: '4px 0' }}>
      {Array.from({ length: weeks }).map((_, w) => (
        <div key={w} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Array.from({ length: 7 }).map((__, d) => {
            const cell = cells[w * 7 + d];
            if (!cell) return <div key={d} style={{ width: 12, height: 12 }} />;
            return (
              <div
                key={d}
                title={cell.date}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background:
                    cell.intensity > 0
                      ? base
                      : 'rgba(var(--ion-text-color-rgb), 0.08)',
                  opacity: cell.intensity > 0 ? 0.35 + cell.intensity * 0.65 : 1,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
