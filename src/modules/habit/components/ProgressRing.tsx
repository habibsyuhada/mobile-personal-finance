// Progress ring SVG: lingkaran dengan stroke-dashoffset yang berkurang sesuai
// proporsi (0..1). Animasi mulus via CSS transition.

interface Props {
  size?: number;
  stroke?: number;
  value: number; // 0..1
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  size = 56,
  stroke = 6,
  value,
  color,
  trackColor = 'rgba(120,120,120,0.18)',
  children,
}: Props) {
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 480ms cubic-bezier(.4,1.4,.6,1)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: size * 0.28,
        }}
      >
        {children}
      </div>
    </div>
  );
}
