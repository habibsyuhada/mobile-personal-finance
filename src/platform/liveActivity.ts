// Jembatan ke native LiveActivityService (Android ForegroundService).
// Pada web / iOS: no-op. Aman dipanggil di semua environment.

import { Capacitor, registerPlugin } from '@capacitor/core';

export interface LiveActivityData {
  title: string;
  body: string;
  progress: number;
  total: number;
}

interface LiveActivityPlugin {
  start(data: LiveActivityData): Promise<{ ok: boolean }>;
  update(data: Partial<LiveActivityData>): Promise<{ ok: boolean }>;
  stop(): Promise<{ ok: boolean }>;
}

const LiveActivity = registerPlugin<LiveActivityPlugin>('LiveActivity');

function isAvailable(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

export async function startLiveActivity(data: LiveActivityData): Promise<void> {
  if (!isAvailable()) return;
  try {
    await LiveActivity.start(data);
  } catch (e) {
    console.warn('[live-activity] start failed:', e);
  }
}

export async function updateLiveActivity(patch: Partial<LiveActivityData>): Promise<void> {
  if (!isAvailable()) return;
  try {
    await LiveActivity.update(patch);
  } catch (e) {
    console.warn('[live-activity] update failed:', e);
  }
}

export async function stopLiveActivity(): Promise<void> {
  if (!isAvailable()) return;
  try {
    await LiveActivity.stop();
  } catch (e) {
    console.warn('[live-activity] stop failed:', e);
  }
}
