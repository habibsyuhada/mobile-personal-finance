import { haptics } from '@/lib/haptics';
import type { Insight } from '@/lib/insights';

const PRIORITY_STYLE: Record<Insight['priority'], { color: string; bg: string }> = {
  high: { color: '#dc2626', bg: 'rgba(239, 68, 68, 0.08)' },
  medium: { color: '#d97706', bg: 'rgba(245, 158, 11, 0.08)' },
  low: { color: 'var(--ion-color-primary)', bg: 'rgba(99, 102, 241, 0.06)' },
};

interface Props {
  insights: Insight[];
  loading?: boolean;
}

export function InsightCards({ insights, loading }: Props) {
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '0 16px 8px',
          overflowX: 'auto',
        }}
        aria-label="Insights"
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              flex: '0 0 240px',
              height: 84,
              borderRadius: 14,
              background: 'var(--ion-color-step-50, #f0f0f3)',
              animation: 'pulse 1.4s ease-in-out infinite',
            }}
          />
        ))}
        <style>{`@keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }`}</style>
      </div>
    );
  }
  if (insights.length === 0) return null;
  return (
    <div
      role="list"
      aria-label="Insights"
      style={{
        display: 'flex',
        gap: 10,
        padding: '0 16px 8px',
        overflowX: 'auto',
        scrollSnapType: 'x mandatory',
      }}
    >
      {insights.map((i, idx) => {
        const style = PRIORITY_STYLE[i.priority];
        return (
          <button
            key={i.id}
            type="button"
            role="listitem"
            onClick={() => haptics.tap()}
            style={{
              flex: '0 0 260px',
              scrollSnapAlign: 'start',
              textAlign: 'left',
              padding: 14,
              borderRadius: 14,
              background: style.bg,
              border: '1px solid var(--ion-card-background)',
              boxShadow: 'var(--app-shadow-soft)',
              cursor: 'pointer',
              transition: 'transform 200ms ease',
              animation: `insight-in 360ms ease-out ${idx * 80}ms backwards`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ fontSize: 24, lineHeight: 1 }}>{i.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: style.color,
                    marginBottom: 2,
                  }}
                >
                  {i.title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ion-text-color)',
                    opacity: 0.85,
                    lineHeight: 1.35,
                  }}
                >
                  {i.body}
                </div>
              </div>
            </div>
          </button>
        );
      })}
      <style>{`
        @keyframes insight-in {
          0% { transform: translateY(10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
