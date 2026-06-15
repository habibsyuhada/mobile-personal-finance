import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Helper haptic yang aman di web (no-op). Pakai:
// - tap() : klik biasa
// - success() / warning() / error() : notifikasi peristiwa
// - selection() : pilihan (mis. switch toggle)
async function isAvailable(): Promise<boolean> {
  return Capacitor.isPluginAvailable('Haptics');
}

export const haptics = {
  isAvailable,

  /** Getaran singkat saat tap/klik. */
  async tap(): Promise<void> {
    if (!(await isAvailable())) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch {
      /* ignore */
    }
  },

  /** Getaran lebih kuat (mis. centang selesai). */
  async medium(): Promise<void> {
    if (!(await isAvailable())) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch {
      /* ignore */
    }
  },

  async success(): Promise<void> {
    if (!(await isAvailable())) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {
      /* ignore */
    }
  },

  async warning(): Promise<void> {
    if (!(await isAvailable())) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch {
      /* ignore */
    }
  },

  async selection(): Promise<void> {
    if (!(await isAvailable())) return;
    try {
      await Haptics.selectionStart();
    } catch {
      /* ignore */
    }
  },
};
