import { useEffect, useState } from 'react';

// Confetti/celebration overlay yang dipicu saat user mencentang task/habit
// penting. Pure CSS animation, auto-dismiss 1.2s.

interface Props {
  show: boolean;
  emoji?: string;
  onDone?: () => void;
}

export function Celebration({ show, emoji = '✨', onDone }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    if (show) {
      setMounted(true);
      const t = setTimeout(() => {
        setMounted(false);
        onDone?.();
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);
  if (!mounted) return null;
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 2000,
        fontSize: 96,
        animation: 'celebration-pop 600ms ease-out',
      }}
    >
      <span style={{ animation: 'celebration-emoji 1.2s ease-out forwards' }}>{emoji}</span>
      <style>{`
        @keyframes celebration-pop {
          0% { opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes celebration-emoji {
          0% { transform: scale(0.4); }
          40% { transform: scale(1.4); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
