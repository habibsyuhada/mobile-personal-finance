import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  duration?: number; // ms
  format?: (n: number) => string;
  /** Optional className untuk styling. */
  className?: string;
  /** Style override. */
  style?: React.CSSProperties;
}

/**
 * Animasi count-up dari nilai sebelumnya ke nilai target.
 * Pakai easing cubic ease-out agar terasa premium. Pakai rAF, bukan
 * setInterval, supaya smooth di refresh rate tinggi.
 *
 * Format default: Intl.NumberFormat('id-ID').
 */
export function RollingNumber({
  value,
  duration = 700,
  format,
  className,
  style,
}: Props) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    startRef.current = null;

    const tick = (now: number) => {
      if (startRef.current == null) startRef.current = now;
      const t = Math.min(1, (now - startRef.current) / duration);
      // Cubic ease-out: 1 - (1-t)^3
      const eased = 1 - Math.pow(1 - t, 3);
      const current = from + (to - from) * eased;
      setDisplay(current);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = to;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const fmt =
    format ??
    ((n: number) =>
      new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n)));

  return (
    <span className={className} style={style}>
      {fmt(display)}
    </span>
  );
}
