// Seed data sample: dipanggil opsional dari onboarding.

import { todoService } from '@/modules/todo/store/todo.store';
import { habitService } from '@/modules/habit/store/habit.store';
import { getServices } from '@/modules/finance/services';
import { markSampleLoaded } from '@/store/onboarding.store';

function futureIso(daysFromNow: number, hour = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

export async function loadSampleData(): Promise<void> {
  // --- Todo: 3 tasks ---
  const list = (await todoService().lists())[0];
  const listId = list?.id ?? '';
  await todoService().createTask({
    listId,
    title: 'Coba scan struk pertama',
    note: 'Belajar fitur scan struk dengan AI.',
    priority: 2,
    dueAt: futureIso(0, 18),
    hasTime: true,
    starred: false,
  });
  await todoService().createTask({
    listId,
    title: 'Tambah 3 transaksi contoh',
    priority: 1,
    dueAt: futureIso(1, 9),
    hasTime: true,
    starred: false,
  });
  await todoService().createTask({
    listId,
    title: 'Set habit & reminder',
    note: 'Coba habit "Minum air" dengan reminder siang.',
    priority: 0,
    dueAt: null,
    hasTime: false,
    starred: true,
  });

  // --- Habit: 2 contoh ---
  await habitService().create({
    name: 'Minum air',
    icon: 'water',
    color: '#0ea5e9',
    type: 'quantifiable',
    polarity: 'good',
    target: 8,
    unit: 'gelas',
    scheduleType: 'daily',
    reminderTime: '08:00',
  });
  await habitService().create({
    name: 'Olahraga 30 menit',
    icon: 'fitness',
    color: '#16a34a',
    type: 'binary',
    polarity: 'good',
    target: null,
    unit: null,
    scheduleType: 'weekdays',
    weekdays: [1, 3, 5],
    reminderTime: '18:00',
  });

  // --- Finance: 3 transaksi contoh ---
  const account = (await getServices().accounts.list())[0];
  const foodCat = (await getServices().categories.list('expense')).find(
    (c) => c.name === 'Makanan & Minuman'
  );
  const transportCat = (await getServices().categories.list('expense')).find(
    (c) => c.name === 'Transportasi'
  );
  const accountId = account?.id;
  if (accountId) {
    const today = futureIso(0, 12);
    const txn = getServices().transactions;
    if (foodCat) {
      await txn.create({
        type: 'expense',
        amount: 50000,
        accountId,
        categoryId: foodCat.id,
        occurredAt: today,
        note: 'Makan siang',
      });
    }
    if (transportCat) {
      await txn.create({
        type: 'expense',
        amount: 25000,
        accountId,
        categoryId: transportCat.id,
        occurredAt: today,
        note: 'Ojol ke kantor',
      });
    }
    if (foodCat) {
      await txn.create({
        type: 'expense',
        amount: 35000,
        accountId,
        categoryId: foodCat.id,
        occurredAt: futureIso(-1, 19),
        note: 'Kopi sore',
      });
    }
  }

  await markSampleLoaded();
}
