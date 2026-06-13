import { describe, it, expect } from 'vitest';
import { MODULES, enabledModules, getModule } from './registry';

describe('module registry', () => {
  it('contains the finance module', () => {
    expect(getModule('finance')).not.toBeNull();
    expect(getModule('finance')?.routePath).toBe('/m/finance');
  });

  it('returns null for unknown module', () => {
    expect(getModule('does-not-exist')).toBeNull();
  });

  it('enabledModules only returns enabled ones', () => {
    const enabled = enabledModules();
    expect(enabled.every((m) => m.enabled)).toBe(true);
  });

  it('modules are sorted by order', () => {
    const orders = MODULES.map((m) => m.order);
    const sorted = [...orders].sort((a, b) => a - b);
    expect(orders).toEqual(sorted);
  });

  it('every module has required descriptor fields', () => {
    for (const m of MODULES) {
      expect(m.id).toBeTruthy();
      expect(m.nameKey).toBeTruthy();
      expect(m.icon).toBeTruthy();
      expect(m.color).toMatch(/^#/);
      expect(m.routePath.startsWith('/m/')).toBe(true);
      expect(typeof m.component).toBe('function');
    }
  });
});
