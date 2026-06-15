import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { IonIcon } from '@ionic/react';
import { useBannerStore, type BannerItem } from '@/store/banner.store';
import { useT } from '@/i18n/useT';
import { iconForCategory, transferIcon } from '@/lib/categoryIcons';

const AUTO_DISMISS_MS = 6000;

const KIND_ROUTE: Record<BannerItem['kind'], string> = {
  habit: '/m/habit/today',
  task: '/m/todo/today',
  finance: '/m/finance/dashboard',
};

const KIND_ICON_COLOR: Record<BannerItem['kind'], string> = {
  habit: '#f59e0b',
  task: '#0ea5e9',
  finance: '#16a34a',
};

function bannerIcon(b: BannerItem): { icon: string; color: string } {
  const color = (b.meta?.categoryColor as string) ?? KIND_ICON_COLOR[b.kind];
  if (b.kind === 'task' && b.meta?.isTransfer === true) {
    return { icon: transferIcon, color: '#6366f1' };
  }
  return { icon: iconForCategory(b.meta?.icon as string | undefined), color };
}

export function BannerHost() {
  const items = useBannerStore((s) => s.items);
  const dismiss = useBannerStore((s) => s.dismiss);
  const history = useHistory();
  const t = useT();

  useEffect(() => {
    if (items.length === 0) return;
    const timers = items.map((b) =>
      setTimeout(() => dismiss(b.id), AUTO_DISMISS_MS)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [items, dismiss]);

  if (items.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: 12,
        right: 12,
        bottom: 80,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.slice(-3).map((b) => {
        const { icon, color } = bannerIcon(b);
        return (
          <div
            key={b.id}
            role="status"
            aria-live="polite"
            onClick={() => {
              dismiss(b.id);
              history.push(KIND_ROUTE[b.kind]);
            }}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 14px',
              borderRadius: 16,
              background: 'var(--ion-card-background)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              cursor: 'pointer',
              animation: 'banner-slide-in 240ms ease-out',
            }}
          >
            <div
              className="cat-avatar"
              style={{ background: color, width: 36, height: 36, fontSize: 18 }}
              aria-hidden="true"
            >
              <IonIcon icon={icon} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{b.title}</div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ion-color-medium)',
                  lineHeight: 1.3,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {b.body}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(b.id);
              }}
              aria-label={t('common.cancel')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--ion-color-medium)',
                fontSize: 18,
                padding: 4,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes banner-slide-in {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
