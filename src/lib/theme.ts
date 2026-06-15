// Theme presets & accent palette. Digunakan oleh settings.store untuk
// men-set CSS variables pada :root sehingga semua modul otomatis ikut.

export interface ThemePresetSpec {
  id: 'indigo' | 'sunset' | 'forest' | 'mono';
  label: string;
  primary: string;
  primaryShade: string;
  primaryTint: string;
  // Gradien launcher / hero card.
  gradient: string;
}

export const THEME_PRESETS: ThemePresetSpec[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    primary: '#6366f1',
    primaryShade: '#585ad4',
    primaryTint: '#7375f2',
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
  },
  {
    id: 'sunset',
    label: 'Sunset',
    primary: '#f97316',
    primaryShade: '#ea580c',
    primaryTint: '#fb923c',
    gradient: 'linear-gradient(135deg, #f97316 0%, #ec4899 50%, #ef4444 100%)',
  },
  {
    id: 'forest',
    label: 'Forest',
    primary: '#16a34a',
    primaryShade: '#15803d',
    primaryTint: '#22c55e',
    gradient: 'linear-gradient(135deg, #16a34a 0%, #0d9488 50%, #0ea5e9 100%)',
  },
  {
    id: 'mono',
    label: 'Mono',
    primary: '#475569',
    primaryShade: '#334155',
    primaryTint: '#64748b',
    gradient: 'linear-gradient(135deg, #475569 0%, #1e293b 50%, #0f172a 100%)',
  },
];

export function presetById(id: string): ThemePresetSpec {
  return THEME_PRESETS.find((p) => p.id === id) ?? THEME_PRESETS[0];
}

/** Terapkan preset + accent override ke <html> via CSS custom properties. */
export function applyThemePreset(
  presetId: string,
  accentOverride?: string,
  trueBlack = false
): void {
  const preset = presetById(presetId);
  const primary = accentOverride || preset.primary;
  const root = document.documentElement;
  root.style.setProperty('--ion-color-primary', primary);
  root.style.setProperty('--ion-color-primary-shade', preset.primaryShade);
  root.style.setProperty('--ion-color-primary-tint', preset.primaryTint);
  // App gradient mengikuti preset (kecuali user override accent).
  root.style.setProperty(
    '--app-gradient',
    accentOverride
      ? `linear-gradient(135deg, ${primary} 0%, ${primary} 100%)`
      : preset.gradient
  );
  // True black dark mode (AMOLED).
  if (trueBlack) {
    root.classList.add('true-black');
  } else {
    root.classList.remove('true-black');
  }
  // Tandai preset aktif untuk selector CSS per-modul (Fase G).
  root.setAttribute('data-theme', presetId);
}
