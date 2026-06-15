import { Capacitor } from '@capacitor/core';
import {
  LocalNotifications,
  type LocalNotificationSchema,
} from '@capacitor/local-notifications';

// Layanan notifikasi lintas modul di level platform.
// - Android: menggunakan @capacitor/local-notifications + channel per modul.
// - Web: plugin di-skip; UI tetap pakai in-app banner (lihat banner store).
// API publik: ensureChannel, requestPermission, schedule, cancel, cancelAll.
// ID numerik dihasilkan stabil dari string id record (hash 32-bit).

export type NotificationKind = 'habit' | 'task' | 'finance';

export interface ChannelSpec {
  id: string;
  name: string;
  description: string;
  importance?: 1 | 2 | 3 | 4 | 5; // Android only
}

export interface ScheduleInput {
  id: string;
  title: string;
  body: string;
  /** ISO datetime. */
  at: string;
  channel: string;
  /** extra data untuk tap handler / in-app banner. */
  extra?: Record<string, unknown>;
}

export interface BannerEvent {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  meta?: Record<string, unknown>;
  /** ms timestamp notifikasi seharusnya fire (untuk "kapan" di UI). */
  at: number;
}

type BannerListener = (e: BannerEvent) => void;

let permissionRequested = false;
const channelsRegistered: Record<string, true> = {};
const bannerListeners = new Set<BannerListener>();

const DEFAULT_CHANNELS: Record<NotificationKind, ChannelSpec> = {
  habit: {
    id: 'habit_reminder',
    name: 'Habit Reminders',
    description: 'Daily reminders to log your habits',
    importance: 4, // HIGH
  },
  task: {
    id: 'task_due',
    name: 'Task Deadlines',
    description: 'Notifications for upcoming task due dates',
    importance: 5, // MAX
  },
  finance: {
    id: 'finance_summary',
    name: 'Finance Daily Summary',
    description: 'Daily summary of today\'s income & expenses',
    importance: 3, // DEFAULT
  },
};

function isNative(): boolean {
  return Capacitor.isPluginAvailable('LocalNotifications');
}

/** Hash 32-bit stabil dari string; cocok untuk notification ID Android. */
export function hashId(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  // Android notification ID max 32-bit signed int.
  return Math.abs(h) | 0;
}

export const Notifications = {
  isNative,

  /** Tambah listener untuk event banner (untuk in-app fallback). */
  onBanner(listener: BannerListener): () => void {
    bannerListeners.add(listener);
    return () => bannerListeners.delete(listener);
  },

  /** Emit event banner; dipanggil internal dari service atau dari luar. */
  emitBanner(e: BannerEvent): void {
    for (const l of bannerListeners) l(e);
  },

  /** Daftarkan channel default + custom ke Android. No-op di web. */
  async ensureChannel(spec: ChannelSpec): Promise<void> {
    if (!isNative() || channelsRegistered[spec.id]) return;
    try {
      await LocalNotifications.createChannel({
        id: spec.id,
        name: spec.name,
        description: spec.description,
        importance: spec.importance ?? 3,
        visibility: 1, // PUBLIC
        sound: 'default',
        vibration: true,
      });
      channelsRegistered[spec.id] = true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('ensureChannel failed', e);
    }
  },

  /** Daftarkan semua channel default (dipanggil sekali saat bootstrap). */
  async ensureDefaultChannels(): Promise<void> {
    for (const c of Object.values(DEFAULT_CHANNELS)) {
      await this.ensureChannel(c);
    }
  },

  channelFor(kind: NotificationKind): ChannelSpec {
    return DEFAULT_CHANNELS[kind];
  },

  /** Minta izin POST_NOTIFICATIONS (Android 13+). Idempotent. */
  async requestPermission(): Promise<boolean> {
    if (!isNative()) return false;
    if (permissionRequested) return true;
    permissionRequested = true;
    try {
      const status = await LocalNotifications.requestPermissions();
      return status.display === 'granted';
    } catch {
      return false;
    }
  },

  /** Jadwalkan notifikasi. id akan di-hash agar numerik & stabil. */
  async schedule(input: ScheduleInput): Promise<void> {
    const at = new Date(input.at);
    if (isNaN(at.getTime()) || at.getTime() <= Date.now() + 1000) {
      // Lewati jadwal di masa lalu / terlalu dekat.
      return;
    }
    if (isNative()) {
      const n: LocalNotificationSchema = {
        id: hashId(input.id),
        title: input.title,
        body: input.body,
        schedule: { at, allowWhileIdle: true },
        channelId: input.channel,
        extra: { ...(input.extra ?? {}), channelId: input.channel },
      };
      try {
        await LocalNotifications.schedule({ notifications: [n] });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('schedule failed', e);
      }
    } else {
      // Web/in-app fallback: set timeout untuk emit banner.
      const delay = at.getTime() - Date.now();
      setTimeout(() => {
        this.emitBanner({
          id: input.id,
          title: input.title,
          body: input.body,
          kind: (input.extra?.kind as NotificationKind) ?? 'habit',
          meta: input.extra,
          at: at.getTime(),
        });
      }, Math.max(0, delay));
    }
  },

  /** Batalkan notifikasi berdasarkan id (string). */
  async cancel(id: string): Promise<void> {
    if (!isNative()) return;
    try {
      await LocalNotifications.cancel({ notifications: [{ id: hashId(id) }] });
    } catch {
      /* ignore */
    }
  },

  /** Batalkan semua notifikasi pada satu channel. */
  async cancelChannel(channelId: string): Promise<void> {
    if (!isNative()) return;
    try {
      const pending = await LocalNotifications.getPending();
      const ids = pending.notifications
        .filter((n) => (n.extra?.channelId as string) === channelId)
        .map((n) => ({ id: n.id }));
      if (ids.length) await LocalNotifications.cancel({ notifications: ids });
    } catch {
      /* ignore */
    }
  },

  /** Batalkan semua notifikasi. */
  async cancelAll(): Promise<void> {
    if (!isNative()) return;
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        });
      }
    } catch {
      /* ignore */
    }
  },

  /** Daftar notifikasi yang terjadwal (untuk debug/settings). */
  async pending(): Promise<LocalNotificationSchema[]> {
    if (!isNative()) return [];
    try {
      const res = await LocalNotifications.getPending();
      return res.notifications;
    } catch {
      return [];
    }
  },
};
