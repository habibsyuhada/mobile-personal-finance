import { describe, it, expect, vi } from 'vitest';

// Mock @capacitor/core so Capacitor.getPlatform() returns 'web' for the
// duration of these tests.
vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => 'web',
  },
}));

import { Notifications, hashId } from './notifications';

describe('notifications (web fallback)', () => {
  it('hashId is stable & 32-bit', () => {
    const a = hashId('habit:abc');
    const b = hashId('habit:abc');
    expect(a).toBe(b);
    expect(a).toBeGreaterThan(0);
    expect(a).toBeLessThanOrEqual(0x7fffffff);
  });

  it('isNative() returns false on web', () => {
    expect(Notifications.isNative()).toBe(false);
  });

  it('ensureChannel is no-op on web (no throw)', async () => {
    await expect(
      Notifications.ensureChannel({
        id: 'test',
        name: 'Test',
        description: 'Test',
      })
    ).resolves.toBeUndefined();
  });

  it('requestPermission returns false on web', async () => {
    const ok = await Notifications.requestPermission();
    expect(ok).toBe(false);
  });

  it('cancelAll is no-op on web', async () => {
    await expect(Notifications.cancelAll()).resolves.toBeUndefined();
  });

  it('cancel is no-op on web', async () => {
    await expect(Notifications.cancel('foo')).resolves.toBeUndefined();
  });

  it('cancelChannel is no-op on web', async () => {
    await expect(Notifications.cancelChannel('test')).resolves.toBeUndefined();
  });

  it('pending returns empty array on web', async () => {
    await expect(Notifications.pending()).resolves.toEqual([]);
  });

  it('schedule emits in-app banner via fallback timer', async () => {
    const events: { id: string; title: string; body: string; kind: string }[] = [];
    const off = Notifications.onBanner((e) =>
      events.push({ id: e.id, title: e.title, body: e.body, kind: e.kind })
    );
    // Schedule 1.5s di masa depan (melewati guard 1s di schedule()).
    const at = new Date(Date.now() + 1500).toISOString();
    await Notifications.schedule({
      id: 'test:1',
      title: 'Hello',
      body: 'World',
      at,
      channel: 'test',
      extra: { kind: 'habit' },
    });
    await new Promise((r) => setTimeout(r, 2000));
    expect(events.some((e) => e.id === 'test:1')).toBe(true);
    off();
  });
});
