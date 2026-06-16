// Snapshot data untuk home-screen widget Android (Phase H).
// Format data yang dikirim cocok dengan FinanceWidgetProvider.KEY_* di Android.
//
// Pada platform non-Android (web) atau bila plugin tidak tersedia, semua
// method menjadi no-op — jadi aman dipanggil di semua lingkungan.

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface WidgetSnapshot {
  task1: string;
  task2: string;
  task3: string;
  streak: number;
  streakName: string;
  net: string;
}

interface FinanceWidgetPlugin {
  setSnapshot(data: WidgetSnapshot): Promise<{ ok: boolean }>;
}

const FinanceWidget = registerPlugin<FinanceWidgetPlugin>('FinanceWidget');

function isAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

/** Bangun snapshot dari data aplikasi (task, habit, transaction). */
export async function pushWidgetSnapshot(snapshot: WidgetSnapshot): Promise<void> {
  if (!isAvailable()) return;
  try {
    await FinanceWidget.setSnapshot(snapshot);
  } catch (e) {
    // Widget adalah best-effort — jangan gagalkan alur utama kalau plugin error.
    console.warn('[widget] snapshot push failed:', e);
  }
}
