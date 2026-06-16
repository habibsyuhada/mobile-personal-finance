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
  // Plugin web @capacitor/local-notifications auto-register di browser,
  // tapi createChannel() melempar "Not implemented on web". Jadi deteksi
  // berdasarkan platform, bukan plugin availability.
  return Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios';
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
    // Baca preferensi sound/vibration (lazy import untuk hindari cycle).
    let soundPref: string = 'default';
    let vibrationPref = true;
    try {
      const mod = await import('@/lib/settings');
      const s = await mod.loadSettings();
      soundPref = s.notifSound;
      vibrationPref = s.notifVibration;
    } catch {
      /* ignore */
    }
    const isMuted = soundPref === 'off';
    if (isNative()) {
      const n: LocalNotificationSchema = {
        id: hashId(input.id),
        title: input.title,
        body: input.body,
        schedule: { at, allowWhileIdle: true },
        channelId: input.channel,
        sound: isMuted ? undefined : 'default',
        // Capacitor local-notifications: vibrate pattern via small array.
        ...(vibrationPref && !isMuted
          ? {}
          : {}),
        extra: { ...(input.extra ?? {}), channelId: input.channel, soundPref, vibrationPref },
      };
      try {
        await LocalNotifications.schedule({ notifications: [n] });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('schedule failed', e);
      }
    } else {
      // Web/in-app fallback: set timeout untuk emit banner dengan audio cue.
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
        // Audio cue di web (best-effort, butuh interaksi user sebelumnya).
        if (!isMuted) {
          try {
            playAudioCue(soundPref as 'default' | 'bell' | 'chime');
          } catch {
            /* ignore */
          }
        }
        if (vibrationPref && navigator.vibrate) {
          try {
            navigator.vibrate(200);
          } catch {
            /* ignore */
          }
        }
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

/**
 * Memutar audio cue sederhana di web (untuk fallback notifikasi).
 * Suara di-generate via Web Audio API sehingga tidak butuh file audio.
 */
function playAudioCue(sound: 'default' | 'bell' | 'chime'): void {
  try {
    const Ctor =
      window.AudioContext ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, now);
    if (sound === 'chime') {
      // dua nada lembut
      osc.frequency.setValueAtTime(660, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.frequency.setValueAtTime(880, now + 0.18);
      gain.gain.exponentialRampToValueAtTime(0.18, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (sound === 'bell') {
      // bell pendek
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.exponentialRampToValueAtTime(0.25, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // default: beep singkat
      osc.frequency.setValueAtTime(520, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.35);
    }
    // Tutup context setelah nada selesai.
    setTimeout(() => ctx.close().catch(() => undefined), 1000);
  } catch {
    /* ignore */
  }
}
